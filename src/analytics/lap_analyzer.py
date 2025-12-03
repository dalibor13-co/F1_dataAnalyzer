"""Analytics module for lap and race analysis"""

import pandas as pd
import numpy as np
import structlog
from typing import Optional

logger = structlog.get_logger()


class LapAnalyzer:
    """Analyze lap performance and patterns"""

    @staticmethod
    def calculate_pace_analysis(laps: pd.DataFrame) -> dict:
        """
        Analyze race pace over stint
        
        Args:
            laps: Lap data
        
        Returns:
            Dictionary with pace statistics
        """
        lap_times = laps['LapTime'].dt.total_seconds()
        
        analysis = {
            'mean_pace': lap_times.mean(),
            'median_pace': lap_times.median(),
            'std_pace': lap_times.std(),
            'fastest_lap': lap_times.min(),
            'slowest_lap': lap_times.max(),
            'consistency': lap_times.std() / lap_times.mean(),
        }
        
        logger.info("Pace analysis completed", **analysis)
        
        return analysis

    @staticmethod
    def analyze_tyre_degradation(laps: pd.DataFrame) -> pd.DataFrame:
        """
        Analyze tyre degradation per stint
        
        Args:
            laps: Lap data with tyre info
        
        Returns:
            DataFrame with degradation analysis per stint
        """
        stints = []
        
        # Group by compound
        for compound in laps['Compound'].unique():
            if pd.isna(compound):
                continue
                
            compound_laps = laps[laps['Compound'] == compound].copy()
            compound_laps['TyreLife'] = range(1, len(compound_laps) + 1)
            compound_laps['LapTimeSeconds'] = compound_laps['LapTime'].dt.total_seconds()
            
            # Calculate degradation (lap time increase per lap)
            if len(compound_laps) > 1:
                first_lap_time = compound_laps['LapTimeSeconds'].iloc[0]
                last_lap_time = compound_laps['LapTimeSeconds'].iloc[-1]
                degradation = (last_lap_time - first_lap_time) / len(compound_laps)
            else:
                degradation = 0
            
            stints.append({
                'Compound': compound,
                'StintLength': len(compound_laps),
                'AvgLapTime': compound_laps['LapTimeSeconds'].mean(),
                'DegradationPerLap': degradation,
                'FirstLapTime': first_lap_time if len(compound_laps) > 0 else None,
                'LastLapTime': last_lap_time if len(compound_laps) > 0 else None,
            })
        
        return pd.DataFrame(stints)

    @staticmethod
    def find_optimal_lap(laps: pd.DataFrame) -> pd.Series:
        """
        Find theoretical optimal lap from best sectors
        
        Args:
            laps: Lap data with sector times
        
        Returns:
            Series with optimal lap data
        """
        best_s1 = laps['Sector1Time'].min()
        best_s2 = laps['Sector2Time'].min()
        best_s3 = laps['Sector3Time'].min()
        
        optimal_time = best_s1 + best_s2 + best_s3
        
        logger.info(
            "Optimal lap calculated",
            sector1=best_s1.total_seconds(),
            sector2=best_s2.total_seconds(),
            sector3=best_s3.total_seconds(),
            total=optimal_time.total_seconds()
        )
        
        return pd.Series({
            'Sector1Time': best_s1,
            'Sector2Time': best_s2,
            'Sector3Time': best_s3,
            'OptimalLapTime': optimal_time
        })


class ComparisonAnalyzer:
    """Compare drivers and strategies"""

    @staticmethod
    def compare_drivers(
        driver1_laps: pd.DataFrame,
        driver2_laps: pd.DataFrame
    ) -> dict:
        """
        Detailed comparison between two drivers
        
        Args:
            driver1_laps: First driver lap data
            driver2_laps: Second driver lap data
        
        Returns:
            Dictionary with comparison metrics
        """
        d1_name = driver1_laps['Driver'].iloc[0]
        d2_name = driver2_laps['Driver'].iloc[0]
        
        # Reset index to ensure proper comparison
        driver1_laps = driver1_laps.reset_index(drop=True)
        driver2_laps = driver2_laps.reset_index(drop=True)
        
        d1_times = driver1_laps['LapTime'].dt.total_seconds()
        d2_times = driver2_laps['LapTime'].dt.total_seconds()
        
        # Get common laps for proper comparison
        min_len = min(len(d1_times), len(d2_times))
        d1_times_common = d1_times.iloc[:min_len].reset_index(drop=True)
        d2_times_common = d2_times.iloc[:min_len].reset_index(drop=True)
        
        comparison = {
            'driver1': d1_name,
            'driver2': d2_name,
            'avg_gap': d1_times.mean() - d2_times.mean(),
            'fastest_lap_gap': d1_times.min() - d2_times.min(),
            'driver1_faster_laps': int((d1_times_common < d2_times_common).sum()),
            'driver2_faster_laps': int((d2_times_common < d1_times_common).sum()),
            'driver1_consistency': float(d1_times.std()),
            'driver2_consistency': float(d2_times.std()),
        }
        
        # Sector comparison
        for sector in [1, 2, 3]:
            col = f'Sector{sector}Time'
            if col in driver1_laps.columns and col in driver2_laps.columns:
                s1 = driver1_laps[col].dt.total_seconds().mean()
                s2 = driver2_laps[col].dt.total_seconds().mean()
                comparison[f'sector{sector}_gap'] = float(s1 - s2)
            else:
                comparison[f'sector{sector}_gap'] = 0.0
        
        logger.info("Driver comparison completed")
        
        return comparison

    @staticmethod
    def analyze_overtakes(
        laps: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Detect position changes (overtakes)
        
        Args:
            laps: All drivers lap data with positions
        
        Returns:
            DataFrame with overtake events
        """
        overtakes = []
        
        for lap_num in laps['LapNumber'].unique():
            lap_data = laps[laps['LapNumber'] == lap_num].sort_values('Position')
            
            if lap_num > 1:
                prev_lap = laps[laps['LapNumber'] == lap_num - 1]
                
                for _, driver in lap_data.iterrows():
                    prev_pos = prev_lap[prev_lap['Driver'] == driver['Driver']]['Position']
                    
                    if not prev_pos.empty:
                        prev_pos = prev_pos.iloc[0]
                        curr_pos = driver['Position']
                        
                        if prev_pos > curr_pos:
                            overtakes.append({
                                'Lap': lap_num,
                                'Driver': driver['Driver'],
                                'FromPosition': prev_pos,
                                'ToPosition': curr_pos,
                                'PositionsGained': prev_pos - curr_pos
                            })
        
        return pd.DataFrame(overtakes)


class StrategyAnalyzer:
    """Analyze pit stop and tyre strategies"""

    @staticmethod
    def analyze_pit_stops(laps: pd.DataFrame) -> pd.DataFrame:
        """
        Analyze pit stop performance
        
        Args:
            laps: Lap data
        
        Returns:
            DataFrame with pit stop analysis
        """
        pit_laps = laps[laps['PitInTime'].notna()].copy()
        
        pit_stops = []
        
        for _, lap in pit_laps.iterrows():
            pit_in = lap['PitInTime']
            pit_out = lap['PitOutTime']
            
            if pd.notna(pit_in) and pd.notna(pit_out):
                pit_duration = (pit_out - pit_in).total_seconds()
                
                pit_stops.append({
                    'Driver': lap['Driver'],
                    'Lap': lap['LapNumber'],
                    'PitDuration': pit_duration,
                    'Compound': lap['Compound'],
                })
        
        df = pd.DataFrame(pit_stops)
        
        if not df.empty:
            logger.info(
                "Pit stop analysis",
                total_stops=len(df),
                avg_duration=df['PitDuration'].mean()
            )
        
        return df

    @staticmethod
    def predict_optimal_strategy(
        laps: pd.DataFrame,
        race_laps: int = 60
    ) -> dict:
        """
        Predict optimal pit stop strategy
        
        Args:
            laps: Historical lap data
            race_laps: Total race laps
        
        Returns:
            Dictionary with strategy recommendation
        """
        # Analyze degradation per compound
        degradation = LapAnalyzer.analyze_tyre_degradation(laps)
        
        # Simple strategy model
        strategy = {
            'recommended_stops': 1,
            'optimal_lap': race_laps // 2,
            'compounds': degradation.to_dict('records') if not degradation.empty else []
        }
        
        logger.info("Strategy prediction", **strategy)
        
        return strategy
