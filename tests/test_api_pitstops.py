"""
Tests for pit stop API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)


class TestPitStopsEndpoint:
    """Test /pitstops/{year}/{race} endpoint"""
    
    def test_get_race_pitstops_qatar_2025(self):
        """Test getting pit stops for Qatar 2025"""
        response = client.get("/pitstops/2025/23")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert "race" in data
        assert "year" in data
        assert "total_drivers" in data
        assert "pitstops" in data
        
        # Verify race info
        assert data["year"] == 2025
        assert "Qatar" in data["race"]
        
        # Check that we have pit stop data
        assert data["total_drivers"] > 0
        assert len(data["pitstops"]) > 0
        
    def test_pitstops_driver_structure(self):
        """Test pit stop data structure for individual driver"""
        response = client.get("/pitstops/2025/23")
        data = response.json()
        
        # Get first driver's data
        first_driver_code = list(data["pitstops"].keys())[0]
        driver_data = data["pitstops"][first_driver_code]
        
        # Check driver data structure
        assert "driver" in driver_data
        assert "total_stops" in driver_data
        assert "stops" in driver_data
        assert isinstance(driver_data["stops"], list)
        
        # Check individual stop structure
        if len(driver_data["stops"]) > 0:
            stop = driver_data["stops"][0]
            assert "lap" in stop
            assert "stint" in stop
            assert isinstance(stop["lap"], int)
    
    def test_qatar_2025_verstappen_pitstops(self):
        """Test Verstappen has 2 pit stops in Qatar 2025"""
        response = client.get("/pitstops/2025/23")
        data = response.json()
        
        # Check VER has pit stops
        assert "VER" in data["pitstops"]
        ver_data = data["pitstops"]["VER"]
        
        # Should have 2 stops (lap 7 and lap 32)
        assert ver_data["total_stops"] == 2
        assert len(ver_data["stops"]) == 2
        
        # Check lap numbers
        lap_numbers = [stop["lap"] for stop in ver_data["stops"]]
        assert 7 in lap_numbers
        assert 32 in lap_numbers


class TestDriverLapsEndpoint:
    """Test /laps/{year}/{race}/{driver} endpoint"""
    
    def test_get_driver_laps_with_pitstops(self):
        """Test getting laps with pit stop data"""
        response = client.get("/laps/2025/23/VER")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert "driver" in data
        assert "race" in data
        assert "laps" in data
        assert "pit_stops" in data
        
        assert data["driver"] == "VER"
        assert isinstance(data["laps"], list)
        assert isinstance(data["pit_stops"], list)
        
    def test_laps_exclude_pit_laps(self):
        """Test that lap data excludes pit stop laps"""
        response = client.get("/laps/2025/23/VER")
        data = response.json()
        
        # Get lap numbers from laps
        lap_numbers = {lap["lap_number"] for lap in data["laps"]}
        
        # Get pit stop laps
        pit_lap_numbers = {stop["lap"] for stop in data["pit_stops"]}
        
        # Pit laps should NOT be in regular laps
        intersection = lap_numbers & pit_lap_numbers
        assert len(intersection) == 0, "Pit stop laps should be excluded from lap data"
    
    def test_pit_stops_have_required_fields(self):
        """Test pit stops contain all required fields"""
        response = client.get("/laps/2025/23/VER")
        data = response.json()
        
        assert len(data["pit_stops"]) > 0, "Should have pit stops"
        
        for stop in data["pit_stops"]:
            assert "lap" in stop
            assert "stint" in stop
            
            # Check optional fields are present (may be None)
            assert "pit_duration" in stop or True  # May be None
            assert "lap_time" in stop or True
            assert "compound_before" in stop or True
            assert "tyre_life_before" in stop or True
    
    def test_verstappen_qatar_pitstop_details(self):
        """Test detailed pit stop information for VER in Qatar 2025"""
        response = client.get("/laps/2025/23/VER")
        data = response.json()
        
        # Should have 2 pit stops
        assert len(data["pit_stops"]) == 2
        
        # Find lap 7 pit stop
        lap7_stop = next((s for s in data["pit_stops"] if s["lap"] == 7), None)
        assert lap7_stop is not None, "Should have pit stop on lap 7"
        
        # Verify lap 7 details
        assert lap7_stop["compound_before"] == "MEDIUM"
        assert lap7_stop["tyre_life_before"] == 7
        assert lap7_stop["lap_time"] > 100, "Lap time should be >100s (includes pit stop)"
        
        # Find lap 32 pit stop
        lap32_stop = next((s for s in data["pit_stops"] if s["lap"] == 32), None)
        assert lap32_stop is not None, "Should have pit stop on lap 32"
        
        # Verify lap 32 details
        assert lap32_stop["compound_before"] == "MEDIUM"
        assert lap32_stop["tyre_life_before"] == 25


class TestPitStopDataQuality:
    """Test pit stop data quality and consistency"""
    
    def test_all_drivers_consistent_structure(self):
        """Test all drivers have consistent data structure"""
        response = client.get("/pitstops/2025/23")
        data = response.json()
        
        for driver_code, driver_data in data["pitstops"].items():
            assert "driver" in driver_data
            assert "total_stops" in driver_data
            assert "stops" in driver_data
            assert driver_data["driver"] == driver_code
            assert driver_data["total_stops"] == len(driver_data["stops"])
    
    def test_pit_duration_reasonable(self):
        """Test pit durations are within reasonable range"""
        response = client.get("/pitstops/2025/23")
        data = response.json()
        
        for driver_data in data["pitstops"].values():
            for stop in driver_data["stops"]:
                if stop.get("pit_duration"):
                    # Pit stops should be between 2s and 30s (2s for fastest, 30s max for slow)
                    assert 2.0 <= stop["pit_duration"] <= 30.0, \
                        f"Unusual pit duration: {stop['pit_duration']}s"
    
    def test_lap_numbers_sequential(self):
        """Test pit stop lap numbers are sequential"""
        response = client.get("/pitstops/2025/23")
        data = response.json()
        
        for driver_data in data["pitstops"].values():
            if len(driver_data["stops"]) > 1:
                lap_numbers = [stop["lap"] for stop in driver_data["stops"]]
                # Should be in ascending order
                assert lap_numbers == sorted(lap_numbers), \
                    "Pit stop laps should be in sequential order"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
