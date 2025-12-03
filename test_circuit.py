import fastf1

fastf1.Cache.enable_cache('data/cache')

# Load session
session = fastf1.get_session(2024, 1, 'R')
session.load()

# Get fastest lap
lap = session.laps.pick_fastest()
print(f"Lap: {lap.LapNumber}")

# Get position data
pos = lap.get_pos_data()
print(f"Columns: {list(pos.columns)}")
print(f"Rows: {len(pos)}")
if 'X' in pos.columns and 'Y' in pos.columns:
    print(f"X range: {pos['X'].min():.1f} to {pos['X'].max():.1f}")
    print(f"Y range: {pos['Y'].min():.1f} to {pos['Y'].max():.1f}")
    print(f"First point: X={pos['X'].iloc[0]:.1f}, Y={pos['Y'].iloc[0]:.1f}")
else:
    print("No X/Y coordinates found!")
