"""Test FastF1 data loader"""

import pytest
from unittest.mock import Mock, patch
from src.ingestion.fastf1_loader import F1DataLoader


@pytest.fixture
def loader():
    """Create F1DataLoader instance"""
    return F1DataLoader(cache_dir="./data/test_cache")


def test_loader_initialization(loader):
    """Test loader initializes with cache directory"""
    assert loader.cache_dir.exists()


@patch('src.ingestion.fastf1_loader.fastf1')
def test_load_session(mock_fastf1, loader):
    """Test session loading"""
    mock_session = Mock()
    mock_fastf1.get_session.return_value = mock_session
    
    result = loader.load_session(2024, 1, "R")
    
    mock_fastf1.get_session.assert_called_once_with(2024, 1, "R")
    mock_session.load.assert_called_once()
    assert result == mock_session


@patch('src.ingestion.fastf1_loader.fastf1')
def test_get_race_schedule(mock_fastf1, loader):
    """Test getting race schedule"""
    mock_schedule = Mock()
    mock_fastf1.get_event_schedule.return_value = mock_schedule
    
    result = loader.get_race_schedule(2024)
    
    mock_fastf1.get_event_schedule.assert_called_once_with(2024)
    assert result == mock_schedule
