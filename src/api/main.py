"""FastAPI application for F1 analytics"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import structlog
import pandas as pd
from functools import lru_cache

from src.ingestion.fastf1_loader import F1DataLoader
from src.processing.lap_processor import LapProcessor
from src.analytics.lap_analyzer import LapAnalyzer, ComparisonAnalyzer

logger = structlog.get_logger()

app = FastAPI(
    title="F1 Data Analytics API",
    description="API for F1 telemetry and race data analysis",
    version="0.1.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize data loader
loader = F1DataLoader()

# Simple in-memory cache for session data
_session_cache = {}

def get_cached_session(year: int, race: int, session_type: str):
    """Get cached session or load and cache it"""
    cache_key = f"{year}_{race}_{session_type}"
    if cache_key not in _session_cache:
        logger.info("Loading session (not cached)", year=year, race=race, session=session_type)
        _session_cache[cache_key] = loader.load_session(year, race, session_type)
    else:
        logger.info("Using cached session", year=year, race=race, session=session_type)
    return _session_cache[cache_key]


# Pydantic models
class RaceInfo(BaseModel):
    round: int
    race_name: str
    country: str
    circuit: str
    date: str


class LapTime(BaseModel):
    lap_number: int
    time: float
    sector1: Optional[float]
    sector2: Optional[float]
    sector3: Optional[float]


class ComparisonResponse(BaseModel):
    driver1: str
    driver2: str
    avg_gap: float
    fastest_lap_gap: float
    sector_gaps: dict


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "service": "F1 Data Analytics API",
        "version": "0.1.0",
        "status": "running"
    }


@app.get("/safety-car/{year}/{race}")
def get_safety_car_periods(
    year: int,
    race: int
):
    """
    Get Safety Car and VSC periods for a race
    
    Args:
        year: Season year
        race: Race round number
    
    Returns:
        Safety Car periods information
    """
    try:
        loader = F1DataLoader()
        session = loader.load_session(year, race, "R")
        sc_periods = loader.get_safety_car_periods(session)
        
        return {
            "year": year,
            "race": race,
            "event": session.event['EventName'],
            "safety_car_periods": sc_periods
        }
    except Exception as e:
        logger.error("Failed to get Safety Car data", err=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/races/{year}", response_model=List[RaceInfo])
def get_races(year: int):
    """
    Get race schedule for a season
    
    Args:
        year: Season year
    
    Returns:
        List of races
    """
    try:
        logger.info("Fetching races", year=year)
        schedule = loader.get_race_schedule(year)
        
        races = []
        for _, race in schedule.iterrows():
            # Format date as YYYY-MM-DD only (no time)
            event_date = race['EventDate']
            if hasattr(event_date, 'date'):
                date_str = event_date.date().isoformat()
            else:
                date_str = str(event_date).split()[0] if ' ' in str(event_date) else str(event_date)
            
            races.append({
                "round": race['RoundNumber'],
                "race_name": race['EventName'],
                "country": race['Country'],
                "circuit": race['Location'],
                "date": date_str
            })
        
        return races
    except Exception as e:
        logger.error("Failed to fetch races", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/laps/{year}/{race}/{driver}")
def get_driver_laps(
    year: int,
    race: int,
    driver: str,
    session: str = Query("R", description="Session type (FP1, FP2, FP3, Q, R)")
):
    """
    Get lap data for a driver in a specific race
    
    Args:
        year: Season year
        race: Race round number
        driver: Driver 3-letter code
        session: Session type
    
    Returns:
        Lap times and telemetry data
    """
    try:
        logger.info("Fetching laps", year=year, race=race, driver=driver, session=session)
        
        # Load session
        session_obj = loader.load_session(year, race, session)
        
        # Get laps
        laps = loader.get_laps(session_obj, driver)
        
        # Clean data
        laps_clean = LapProcessor.clean_lap_times(laps)
        
        # Convert to response format
        lap_data = []
        for _, lap in laps_clean.iterrows():
            lap_data.append({
                "lap_number": int(lap['LapNumber']),
                "time": lap['LapTime'].total_seconds() if pd.notna(lap['LapTime']) else None,
                "sector1": lap['Sector1Time'].total_seconds() if pd.notna(lap['Sector1Time']) else None,
                "sector2": lap['Sector2Time'].total_seconds() if pd.notna(lap['Sector2Time']) else None,
                "sector3": lap['Sector3Time'].total_seconds() if pd.notna(lap['Sector3Time']) else None,
                "compound": lap['Compound'],
                "tyre_life": int(lap['TyreLife']) if pd.notna(lap['TyreLife']) else None,
            })
        
        return {
            "driver": driver,
            "race": session_obj.event['EventName'],
            "laps": lap_data
        }
    
    except Exception as e:
        logger.error("Failed to fetch laps", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/sectors/{year}/{race}/{driver}")
def get_sector_times(
    year: int,
    race: int,
    driver: str,
    session: str = Query("R", description="Session type")
):
    """
    Get sector times analysis for a driver
    
    Args:
        year: Season year
        race: Race round number
        driver: Driver 3-letter code
        session: Session type
    
    Returns:
        Sector times statistics
    """
    try:
        logger.info("Fetching sector times", year=year, race=race, driver=driver)
        
        session_obj = loader.load_session(year, race, session)
        laps = loader.get_laps(session_obj, driver)
        laps_clean = LapProcessor.clean_lap_times(laps)
        
        sectors = LapProcessor.aggregate_sector_times(laps_clean)
        
        return {
            "driver": driver,
            "sectors": sectors.to_dict('records')
        }
    
    except Exception as e:
        logger.error("Failed to fetch sector times", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/comparison/{year}/{race}/{driver1}/{driver2}")
def compare_drivers(
    year: int,
    race: int,
    driver1: str,
    driver2: str,
    session: str = Query("R", description="Session type")
):
    """
    Compare two drivers' performance
    
    Args:
        year: Season year
        race: Race round number
        driver1: First driver code
        driver2: Second driver code
        session: Session type
    
    Returns:
        Comparison metrics
    """
    try:
        logger.info("Comparing drivers", year=year, race=race, driver1=driver1, driver2=driver2)
        
        session_obj = loader.load_session(year, race, session)
        
        laps1 = loader.get_laps(session_obj, driver1)
        laps2 = loader.get_laps(session_obj, driver2)
        
        laps1_clean = LapProcessor.clean_lap_times(laps1)
        laps2_clean = LapProcessor.clean_lap_times(laps2)
        
        comparison = ComparisonAnalyzer.compare_drivers(laps1_clean, laps2_clean)
        
        return comparison
    
    except Exception as e:
        logger.error("Failed to compare drivers", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analysis/pace/{year}/{race}/{driver}")
def get_pace_analysis(
    year: int,
    race: int,
    driver: str,
    session: str = Query("R", description="Session type")
):
    """
    Get race pace analysis for a driver
    
    Args:
        year: Season year
        race: Race round number
        driver: Driver code
        session: Session type
    
    Returns:
        Pace analysis metrics
    """
    try:
        logger.info("Analyzing pace", year=year, race=race, driver=driver)
        
        session_obj = loader.load_session(year, race, session)
        laps = loader.get_laps(session_obj, driver)
        laps_clean = LapProcessor.clean_lap_times(laps)
        
        pace = LapAnalyzer.calculate_pace_analysis(laps_clean)
        degradation = LapAnalyzer.analyze_tyre_degradation(laps_clean)
        
        return {
            "driver": driver,
            "pace": pace,
            "tyre_degradation": degradation.to_dict('records')
        }
    
    except Exception as e:
        logger.error("Failed to analyze pace", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/drivers/{year}/{race}")
def get_race_drivers(year: int, race: int):
    """
    Get list of drivers who participated in a specific race
    
    Args:
        year: Season year
        race: Race round number
    
    Returns:
        List of drivers with their codes and names
    """
    try:
        logger.info("Fetching drivers for race", year=year, race=race)
        
        session = get_cached_session(year, race, "R")
        
        # Get unique drivers from the session
        drivers_list = []
        if hasattr(session, 'laps') and not session.laps.empty:
            unique_drivers = session.laps['Driver'].unique()
            
            for driver_code in unique_drivers:
                # Get driver info from session
                driver_info = session.get_driver(driver_code)
                if driver_info is not None and not driver_info.empty:
                    drivers_list.append({
                        'code': driver_code,
                        'name': f"{driver_info['FirstName']} {driver_info['LastName']}",
                        'number': str(driver_info['DriverNumber'])
                    })
        
        # Sort by driver number
        drivers_list.sort(key=lambda x: int(x['number']) if x['number'].isdigit() else 999)
        
        return {
            "year": year,
            "race": race,
            "drivers": drivers_list
        }
    
    except Exception as e:
        logger.error("Failed to fetch drivers", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/telemetry/{year}/{race}/{driver1}/{driver2}")
async def get_telemetry_comparison(
    year: int,
    race: int,
    driver1: str,
    driver2: str,
    session: str = Query(default="R", description="Session type (R=Race, Q=Qualifying)")
):
    """
    Get detailed telemetry comparison between two drivers for their fastest laps
    
    Args:
        year: Season year
        race: Race round number
        driver1: First driver code
        driver2: Second driver code
        session: Session type
    
    Returns:
        Telemetry data for both drivers
    """
    try:
        logger.info("Getting telemetry comparison", year=year, race=race, driver1=driver1, driver2=driver2)
        
        session_obj = get_cached_session(year, race, session)
        
        # Get fastest laps for both drivers
        fastest1 = loader.get_fastest_lap(session_obj, driver1)
        fastest2 = loader.get_fastest_lap(session_obj, driver2)
        
        if fastest1 is None or fastest2 is None:
            raise HTTPException(status_code=404, detail="Could not find fastest laps for drivers")
        
        # Get telemetry data
        tel1 = fastest1.get_telemetry()
        tel2 = fastest2.get_telemetry()
        
        # Find minimum distance across both laps to normalize consistently
        all_distances = tel1['Distance'].tolist() + tel2['Distance'].tolist()
        min_distance = min(all_distances) if all_distances else 0
        
        # Normalize distances to start from 0 using the same offset
        def normalize_distance(distances):
            return [d - min_distance for d in distances]
        
        # Convert to dict with distance, speed, throttle, brake, gear, RPM, DRS
        tel1_data = {
            'Distance': normalize_distance(tel1['Distance'].tolist()),
            'Speed': tel1['Speed'].tolist(),
            'Throttle': tel1['Throttle'].tolist(),
            'Brake': tel1['Brake'].tolist(),
            'nGear': tel1['nGear'].tolist(),
            'RPM': tel1['RPM'].tolist(),
            'DRS': tel1['DRS'].tolist() if 'DRS' in tel1.columns else [0] * len(tel1),
        }
        
        tel2_data = {
            'Distance': normalize_distance(tel2['Distance'].tolist()),
            'Speed': tel2['Speed'].tolist(),
            'Throttle': tel2['Throttle'].tolist(),
            'Brake': tel2['Brake'].tolist(),
            'nGear': tel2['nGear'].tolist(),
            'RPM': tel2['RPM'].tolist(),
            'DRS': tel2['DRS'].tolist() if 'DRS' in tel2.columns else [0] * len(tel2),
        }
        
        return {
            "driver1": driver1,
            "driver2": driver2,
            "lap1": {
                "lap_time": str(fastest1['LapTime']),
                "lap_number": int(fastest1['LapNumber']),
                "compound": str(fastest1['Compound']),
                "telemetry": tel1_data
            },
            "lap2": {
                "lap_time": str(fastest2['LapTime']),
                "lap_number": int(fastest2['LapNumber']),
                "compound": str(fastest2['Compound']),
                "telemetry": tel2_data
            }
        }
    
    except Exception as e:
        logger.error("Failed to get telemetry comparison", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/circuit-layout/{year}/{race}")
def get_circuit_layout(year: int, race: int):
    """
    Get circuit layout coordinates for visualization
    
    Args:
        year: Season year
        race: Race round number
    
    Returns:
        Circuit layout X/Y coordinates
    """
    try:
        logger.info("Fetching circuit layout", year=year, race=race)
        
        # Load race session
        session = get_cached_session(year, race, "R")
        
        # Get a lap with telemetry data (includes proper X, Y coordinates)
        laps = session.laps
        if laps.empty:
            raise HTTPException(status_code=404, detail="No laps found")
        
        # Get telemetry from fastest lap (has X, Y and Distance)
        lap = laps.pick_fastest()
        telemetry = lap.get_telemetry()
        
        if telemetry.empty or 'X' not in telemetry.columns or 'Y' not in telemetry.columns:
            raise HTTPException(status_code=404, detail="No position data available")
        
        # Get distances and find minimum to normalize
        distances = telemetry['Distance'].tolist()
        min_distance = min(distances) if distances else 0
        
        # Normalize distances to start from 0
        normalized_distances = [d - min_distance for d in distances]
        
        # Prepare layout data
        layout_data = {
            'x': telemetry['X'].tolist(),
            'y': telemetry['Y'].tolist(),
            'distance': normalized_distances
        }
        
        return {
            "circuit": session.event['EventName'],
            "layout": layout_data
        }
        
    except Exception as e:
        logger.error("Failed to get circuit layout", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
