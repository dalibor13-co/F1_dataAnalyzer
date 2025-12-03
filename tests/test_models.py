"""Test data models"""

import pytest
from src.models.data_models import LapData, TelemetryPoint, SectorData


def test_lap_data_creation():
    """Test LapData dataclass creation"""
    lap = LapData(
        lap_number=1,
        driver="VER",
        team="Red Bull Racing",
        lap_time=87.5,
        sector1_time=28.1,
        sector2_time=29.4,
        sector3_time=30.0,
        is_personal_best=True,
        compound="SOFT",
        tyre_life=5,
        track_status="1",
        is_accurate=True
    )
    
    assert lap.lap_number == 1
    assert lap.driver == "VER"
    assert lap.compound == "SOFT"


def test_telemetry_point():
    """Test TelemetryPoint dataclass"""
    point = TelemetryPoint(
        distance=1000.0,
        speed=320.5,
        throttle=100.0,
        brake=False,
        drs=1,
        gear=8,
        rpm=11500.0,
        x=100.0,
        y=200.0,
        z=0.0
    )
    
    assert point.speed == 320.5
    assert point.gear == 8
    assert point.drs == 1


def test_sector_data():
    """Test SectorData dataclass"""
    sector = SectorData(
        driver="HAM",
        lap_number=10,
        sector=1,
        time=28.5,
        speed_trap=310.0
    )
    
    assert sector.driver == "HAM"
    assert sector.sector == 1
    assert sector.speed_trap == 310.0
