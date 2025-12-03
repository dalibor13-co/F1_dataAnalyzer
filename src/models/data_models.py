"""Data models for F1 telemetry and race data"""

from dataclasses import dataclass
from typing import Optional
from datetime import datetime


@dataclass
class LapData:
    """Represents a single lap"""
    lap_number: int
    driver: str
    team: str
    lap_time: float
    sector1_time: Optional[float]
    sector2_time: Optional[float]
    sector3_time: Optional[float]
    is_personal_best: bool
    compound: str
    tyre_life: int
    track_status: str
    is_accurate: bool


@dataclass
class TelemetryPoint:
    """Single telemetry data point"""
    distance: float
    speed: float
    throttle: float
    brake: bool
    drs: int
    gear: int
    rpm: float
    x: float
    y: float
    z: float


@dataclass
class SectorData:
    """Sector timing data"""
    driver: str
    lap_number: int
    sector: int
    time: float
    speed_trap: Optional[float]


@dataclass
class RaceInfo:
    """Race metadata"""
    season: int
    round: int
    race_name: str
    circuit: str
    date: datetime
    country: str


@dataclass
class DriverComparison:
    """Comparison between two drivers"""
    driver1: str
    driver2: str
    lap_delta: list[float]
    avg_delta: float
    max_delta: float
    sectors_comparison: dict[int, float]
