"""FastF1 data loader and caching"""

import fastf1
import structlog
from pathlib import Path
from typing import Optional
import pandas as pd

logger = structlog.get_logger()


class F1DataLoader:
    """Handles loading F1 data from FastF1 API"""

    def __init__(self, cache_dir: str = "./data/cache"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        fastf1.Cache.enable_cache(str(self.cache_dir))
        logger.info("FastF1 cache enabled", cache_dir=str(self.cache_dir))

    def load_session(
        self, 
        year: int, 
        race: int | str, 
        session: str = "R"
    ) -> fastf1.core.Session:
        """
        Load a session from FastF1
        
        Args:
            year: Season year
            race: Race number or name
            session: Session type (FP1, FP2, FP3, Q, S, R)
        
        Returns:
            Loaded session object
        """
        logger.info("Loading session", year=year, race=race, session=session)
        
        try:
            session_obj = fastf1.get_session(year, race, session)
            session_obj.load()
            logger.info(
                "Session loaded successfully",
                event_name=session_obj.event['EventName'],
                event_date=session_obj.event['EventDate']
            )
            return session_obj
        except Exception as e:
            logger.error("Failed to load session", err=str(e))
            raise

    def get_laps(
        self, 
        session: fastf1.core.Session,
        driver: Optional[str] = None
    ) -> pd.DataFrame:
        """
        Get lap data from session
        
        Args:
            session: FastF1 session object
            driver: Optional driver identifier (3-letter code or full name)
        
        Returns:
            DataFrame with lap data
        """
        laps = session.laps
        
        if driver:
            laps = laps.pick_driver(driver)
            logger.info("Filtered laps for driver", driver=driver, lap_count=len(laps))
        
        return laps

    def get_telemetry(
        self,
        session: fastf1.core.Session,
        driver: str,
        lap: int
    ) -> pd.DataFrame:
        """
        Get telemetry data for specific lap
        
        Args:
            session: FastF1 session object
            driver: Driver identifier
            lap: Lap number
        
        Returns:
            DataFrame with telemetry data
        """
        logger.info("Loading telemetry", driver=driver, lap=lap)
        
        try:
            lap_data = session.laps.pick_driver(driver).pick_lap(lap)
            telemetry = lap_data.get_telemetry()
            return telemetry
        except Exception as e:
            logger.error("Failed to get telemetry", err=str(e))
            raise

    def get_race_schedule(self, year: int) -> pd.DataFrame:
        """
        Get race schedule for a season
        
        Args:
            year: Season year
        
        Returns:
            DataFrame with race schedule
        """
        logger.info("Loading race schedule", year=year)
        schedule = fastf1.get_event_schedule(year)
        return schedule

    def get_fastest_lap(
        self,
        session: fastf1.core.Session,
        driver: Optional[str] = None
    ) -> pd.Series:
        """
        Get fastest lap from session
        
        Args:
            session: FastF1 session object
            driver: Optional driver filter
        
        Returns:
            Series with fastest lap data
        """
        laps = self.get_laps(session, driver)
        fastest = laps.pick_fastest()
        
        logger.info(
            "Fastest lap found",
            driver=fastest['Driver'],
            time=fastest['LapTime']
        )
        
        return fastest

    def get_safety_car_periods(
        self,
        session: fastf1.core.Session
    ) -> list[dict]:
        """
        Get Safety Car, VSC and Red Flag periods from session
        
        Args:
            session: FastF1 session object
        
        Returns:
            List of dicts with SC/VSC/Red Flag periods
        """
        logger.info("Extracting Safety Car and Red Flag periods")
        
        try:
            incidents = []
            
            # Method 1: Check session_status for Red Flags
            if hasattr(session, 'session_status'):
                try:
                    session_status = session.session_status
                    if session_status is not None and len(session_status) > 0:
                        # Session status contains time and status
                        # Status can be: 'Started', 'Aborted', 'Finished', etc.
                        for idx, row in session_status.iterrows():
                            status = row.get('Status', '')
                            if 'Aborted' in str(status) or 'Red' in str(status):
                                # Try to find which lap this corresponds to
                                time = row.get('Time', None)
                                if time is not None:
                                    # Find closest lap
                                    laps = session.laps
                                    # This is approximate
                                    incidents.append({
                                        'type': 'Red Flag',
                                        'reason': 'Session stopped',
                                        'lap': None  # We'll try to determine this
                                    })
                except Exception as e:
                    logger.warning("Could not parse session_status", err=str(e))
            
            # Method 2: Check race_control_messages for flags
            if hasattr(session, 'race_control_messages'):
                try:
                    rc_messages = session.race_control_messages
                    if rc_messages is not None and len(rc_messages) > 0:
                        for idx, msg in rc_messages.iterrows():
                            message_text = str(msg.get('Message', '')).upper()
                            lap_num = msg.get('Lap', None)
                            
                            if 'RED FLAG' in message_text:
                                incidents.append({
                                    'lap': int(lap_num) if lap_num is not None else None,
                                    'type': 'Red Flag',
                                    'reason': msg.get('Message', 'Red flag shown')
                                })
                            elif 'SAFETY CAR' in message_text or 'SC DEPLOYED' in message_text:
                                incidents.append({
                                    'lap': int(lap_num) if lap_num is not None else None,
                                    'type': 'Safety Car',
                                    'reason': msg.get('Message', 'Safety Car deployed')
                                })
                            elif 'VIRTUAL SAFETY CAR' in message_text or 'VSC' in message_text:
                                incidents.append({
                                    'lap': int(lap_num) if lap_num is not None else None,
                                    'type': 'VSC',
                                    'reason': msg.get('Message', 'Virtual Safety Car')
                                })
                except Exception as e:
                    logger.warning("Could not parse race_control_messages", err=str(e))
            
            # Method 3: Analyze lap times for anomalies (backup method)
            laps = session.laps
            if len(laps) > 0 and len(incidents) == 0:
                for driver in laps['Driver'].unique():
                    driver_laps = laps[laps['Driver'] == driver].copy()
                    if len(driver_laps) > 3:
                        driver_laps = driver_laps[driver_laps['LapTime'].notna()]
                        if len(driver_laps) > 0:
                            median_time = driver_laps['LapTime'].median()
                            slow_laps = driver_laps[
                                driver_laps['LapTime'] > median_time * 1.5
                            ]
                            
                            for _, lap in slow_laps.iterrows():
                                lap_num = lap['LapNumber']
                                if not any(p.get('lap') == lap_num for p in incidents):
                                    incidents.append({
                                        'lap': int(lap_num),
                                        'type': 'SC/VSC',
                                        'reason': 'Significant lap time increase detected'
                                    })
            
            # Remove duplicates and sort
            seen = set()
            unique_incidents = []
            for incident in incidents:
                key = (incident.get('lap'), incident.get('type'))
                if key not in seen:
                    seen.add(key)
                    unique_incidents.append(incident)
            
            unique_incidents = sorted(
                [i for i in unique_incidents if i.get('lap') is not None],
                key=lambda x: x['lap']
            )
            
            logger.info(f"Found {len(unique_incidents)} incident periods")
            return unique_incidents
            
        except Exception as e:
            logger.error("Failed to get incident periods", err=str(e))
            return []
