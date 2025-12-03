"""Data processing and transformation utilities"""

import pandas as pd
import numpy as np
import structlog
from typing import Optional

logger = structlog.get_logger()


class LapProcessor:
    """Process and clean lap data"""

    @staticmethod
    def clean_lap_times(laps: pd.DataFrame) -> pd.DataFrame:
        """
        Remove invalid laps and outliers
        
        Args:
            laps: Raw lap data
        
        Returns:
            Cleaned lap data
        """
        initial_count = len(laps)
        
        # Remove laps with no time
        laps = laps[laps['LapTime'].notna()].copy()
        
        # Remove in/out laps
        laps = laps[laps['IsAccurate'] == True].copy()
        
        # Remove pit laps
        laps = laps[laps['PitInTime'].isna()].copy()
        laps = laps[laps['PitOutTime'].isna()].copy()
        
        logger.info(
            "Cleaned lap times",
            initial=initial_count,
            remaining=len(laps),
            removed=initial_count - len(laps)
        )
        
        return laps

    @staticmethod
    def calculate_lap_deltas(
        laps1: pd.DataFrame,
        laps2: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Calculate time delta between two drivers' laps
        
        Args:
            laps1: First driver laps
            laps2: Second driver laps
        
        Returns:
            DataFrame with lap-by-lap deltas
        """
        # Ensure both have same lap numbers
        common_laps = set(laps1['LapNumber']) & set(laps2['LapNumber'])
        
        laps1_filtered = laps1[laps1['LapNumber'].isin(common_laps)].sort_values('LapNumber').reset_index(drop=True)
        laps2_filtered = laps2[laps2['LapNumber'].isin(common_laps)].sort_values('LapNumber').reset_index(drop=True)
        
        deltas = pd.DataFrame({
            'LapNumber': laps1_filtered['LapNumber'].values,
            'Driver1': laps1_filtered['Driver'].iloc[0] if len(laps1_filtered) > 0 else '',
            'Driver2': laps2_filtered['Driver'].iloc[0] if len(laps2_filtered) > 0 else '',
            'Time1': laps1_filtered['LapTime'].dt.total_seconds().values,
            'Time2': laps2_filtered['LapTime'].dt.total_seconds().values,
        })
        
        deltas['Delta'] = deltas['Time1'] - deltas['Time2']
        
        return deltas

    @staticmethod
    def aggregate_sector_times(laps: pd.DataFrame) -> pd.DataFrame:
        """
        Aggregate sector times for analysis
        
        Args:
            laps: Lap data with sector times
        
        Returns:
            Aggregated sector statistics
        """
        sectors = pd.DataFrame({
            'Sector': [1, 2, 3],
            'Mean': [
                laps['Sector1Time'].dt.total_seconds().mean(),
                laps['Sector2Time'].dt.total_seconds().mean(),
                laps['Sector3Time'].dt.total_seconds().mean(),
            ],
            'Min': [
                laps['Sector1Time'].dt.total_seconds().min(),
                laps['Sector2Time'].dt.total_seconds().min(),
                laps['Sector3Time'].dt.total_seconds().min(),
            ],
            'Max': [
                laps['Sector1Time'].dt.total_seconds().max(),
                laps['Sector2Time'].dt.total_seconds().max(),
                laps['Sector3Time'].dt.total_seconds().max(),
            ]
        })
        
        return sectors


class TelemetryProcessor:
    """Process telemetry data"""

    @staticmethod
    def resample_telemetry(
        telemetry: pd.DataFrame,
        frequency: str = '10ms'
    ) -> pd.DataFrame:
        """
        Resample telemetry to uniform frequency
        
        Args:
            telemetry: Raw telemetry data
            frequency: Target sampling frequency
        
        Returns:
            Resampled telemetry
        """
        if 'Time' in telemetry.columns:
            telemetry = telemetry.set_index('Time')
        
        resampled = telemetry.resample(frequency).interpolate(method='linear')
        
        return resampled.reset_index()

    @staticmethod
    def calculate_speed_trace(telemetry: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate speed statistics along track
        
        Args:
            telemetry: Telemetry data
        
        Returns:
            Speed trace with distance bins
        """
        # Create distance bins (every 100m)
        telemetry['DistanceBin'] = (telemetry['Distance'] // 100) * 100
        
        speed_trace = telemetry.groupby('DistanceBin').agg({
            'Speed': ['mean', 'max', 'min'],
            'Throttle': 'mean',
            'Brake': 'mean'
        }).reset_index()
        
        return speed_trace

    @staticmethod
    def detect_corners(telemetry: pd.DataFrame, threshold: float = 200) -> list[tuple[float, float]]:
        """
        Detect corners based on speed reduction
        
        Args:
            telemetry: Telemetry data
            threshold: Speed threshold for corner detection (km/h)
        
        Returns:
            List of (start_distance, end_distance) tuples
        """
        corners = []
        in_corner = False
        corner_start = 0
        
        for idx, row in telemetry.iterrows():
            if row['Speed'] < threshold and not in_corner:
                in_corner = True
                corner_start = row['Distance']
            elif row['Speed'] >= threshold and in_corner:
                in_corner = False
                corners.append((corner_start, row['Distance']))
        
        logger.info("Detected corners", count=len(corners))
        
        return corners
