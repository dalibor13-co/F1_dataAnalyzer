"""
🏎️ Qatar 2025 - Pitstop Analysis
Najdeme kde jsou uloženy pitstopy v FastF1 datech
"""

import fastf1
from pathlib import Path
import pandas as pd

# Nastavení cache
cache_dir = Path("../data/cache")
fastf1.Cache.enable_cache(str(cache_dir))

print("=" * 80)
print("🏁 QATAR GP 2025 - Hledání pitstopů")
print("=" * 80)

# Načteme závod
year = 2025
race = "Qatar"
session_type = "R"

print(f"\n📥 Načítám {race} {year} - {session_type}...")
session = fastf1.get_session(year, race, session_type)
session.load()

print(f"✅ Session načtena: {session.event['EventName']}")
print(f"📅 Datum: {session.event['EventDate']}")

# ══════════════════════════════════════════════════════════════════════════════
# 1️⃣ CO JE DOSTUPNÉ V SESSION?
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "=" * 80)
print("📊 DOSTUPNÉ DATASETY V SESSION:")
print("=" * 80)

print("\nVšechny atributy session:")
attributes = [attr for attr in dir(session) if not attr.startswith('_')]
for attr in sorted(attributes):
    try:
        value = getattr(session, attr)
        if not callable(value):
            print(f"  • {attr:30s} = {type(value).__name__}")
    except:
        pass

# ══════════════════════════════════════════════════════════════════════════════
# 2️⃣ HLEDÁNÍ PITSTOPŮ V LAPS
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "=" * 80)
print("🔍 HLEDÁNÍ PITSTOPŮ V LAPS:")
print("=" * 80)

laps = session.laps
print(f"\nSloupce v laps DataFrame:")
for col in laps.columns:
    print(f"  • {col}")

# Najdeme sloupce související s pitstopy
pit_columns = [col for col in laps.columns if 'Pit' in col or 'pit' in col.lower()]
print(f"\n🔧 Sloupce s 'Pit' v názvu:")
for col in pit_columns:
    print(f"  • {col}")

# ══════════════════════════════════════════════════════════════════════════════
# 3️⃣ PITSTOPY - DETAILNÍ ANALÝZA
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "=" * 80)
print("🛠️  PITSTOPY - DETAILNÍ INFORMACE:")
print("=" * 80)

# Filtrujeme kola kde byl pitstop (PitInTime není null)
pit_laps = laps[laps['PitInTime'].notna()].copy()

print(f"\n📊 Celkový počet pitstopů: {len(pit_laps)}")

if len(pit_laps) > 0:
    # Sloupce které chceme zobrazit
    pit_info_columns = [
        'Driver', 'LapNumber', 'Stint', 
        'PitInTime', 'PitOutTime', 'PitDuration',
        'Compound', 'TyreLife', 'LapTime'
    ]
    
    # Ověříme které sloupce existují
    available_cols = [col for col in pit_info_columns if col in pit_laps.columns]
    
    print(f"\nDostupné sloupce pro pitstopy:")
    for col in available_cols:
        print(f"  • {col}")
    
    print("\n" + "=" * 80)
    print("📋 VŠECHNY PITSTOPY:")
    print("=" * 80)
    
    # Seřadíme podle času vjezdu
    pit_laps_sorted = pit_laps.sort_values('PitInTime')
    
    for idx, (_, pit) in enumerate(pit_laps_sorted.iterrows(), 1):
        print(f"\n#{idx} {pit['Driver']} - Kolo {int(pit['LapNumber'])}")
        print(f"   ├─ Stint:              {pit.get('Stint', 'N/A')}")
        print(f"   ├─ PitInTime:          {pit['PitInTime']}")
        
        if pd.notna(pit.get('PitOutTime')):
            print(f"   ├─ PitOutTime:         {pit['PitOutTime']}")
        
        if pd.notna(pit.get('PitDuration')):
            duration = pit['PitDuration'].total_seconds() if hasattr(pit['PitDuration'], 'total_seconds') else pit['PitDuration']
            print(f"   ├─ PitDuration:        {duration:.2f}s")
        
        if pd.notna(pit.get('LapTime')):
            lap_time = pit['LapTime'].total_seconds() if hasattr(pit['LapTime'], 'total_seconds') else pit['LapTime']
            print(f"   ├─ LapTime:            {lap_time:.2f}s")
        
        if pd.notna(pit.get('Compound')):
            print(f"   ├─ Pneumatika předtím: {pit['Compound']}")
        
        if pd.notna(pit.get('TyreLife')):
            print(f"   └─ Stáří pneu:         {int(pit['TyreLife'])} kol")

# ══════════════════════════════════════════════════════════════════════════════
# 4️⃣ PITSTOP LAPS - SOUHRN PRO KAŽDÉHO JEZDCE
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "=" * 80)
print("👥 PITSTOP LAPS PO JEZDCÍCH:")
print("=" * 80)

drivers = pit_laps_sorted['Driver'].unique()
for driver in sorted(drivers):
    driver_pits = pit_laps_sorted[pit_laps_sorted['Driver'] == driver]
    pit_lap_numbers = driver_pits['LapNumber'].astype(int).tolist()
    pit_lap_times = []
    
    for _, pit in driver_pits.iterrows():
        if pd.notna(pit.get('LapTime')):
            lap_time = pit['LapTime'].total_seconds() if hasattr(pit['LapTime'], 'total_seconds') else pit['LapTime']
            pit_lap_times.append(f"Lap {int(pit['LapNumber'])} ({lap_time:.2f}s)")
        else:
            pit_lap_times.append(f"Lap {int(pit['LapNumber'])}")
    
    print(f"\n{driver}:")
    print(f"  • Pitstop laps: {pit_lap_numbers}")
    print(f"  • Details: {', '.join(pit_lap_times)}")

# ══════════════════════════════════════════════════════════════════════════════
# 5️⃣ EXPORTUJEME DO JSON PRO FRONTEND
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "=" * 80)
print("💾 EXPORT DAT PRO FRONTEND:")
print("=" * 80)

# Vytvoříme strukturu pro každého jezdce
pitstop_data = {}
for driver in sorted(drivers):
    driver_pits = pit_laps_sorted[pit_laps_sorted['Driver'] == driver]
    pitstop_data[driver] = {
        'laps': driver_pits['LapNumber'].astype(int).tolist(),
        'details': []
    }
    
    for _, pit in driver_pits.iterrows():
        detail = {
            'lap': int(pit['LapNumber']),
            'stint': int(pit['Stint']) if pd.notna(pit.get('Stint')) else None,
        }
        
        if pd.notna(pit.get('PitDuration')):
            duration = pit['PitDuration'].total_seconds() if hasattr(pit['PitDuration'], 'total_seconds') else pit['PitDuration']
            detail['pit_duration'] = round(duration, 2)
        
        if pd.notna(pit.get('LapTime')):
            lap_time = pit['LapTime'].total_seconds() if hasattr(pit['LapTime'], 'total_seconds') else pit['LapTime']
            detail['lap_time'] = round(lap_time, 2)
        
        if pd.notna(pit.get('Compound')):
            detail['compound_before'] = pit['Compound']
        
        if pd.notna(pit.get('TyreLife')):
            detail['tyre_life_before'] = int(pit['TyreLife'])
        
        pitstop_data[driver]['details'].append(detail)

print("\n📦 Struktura dat:")
import json
print(json.dumps(pitstop_data, indent=2))

print("\n" + "=" * 80)
print("✅ ANALÝZA DOKONČENA")
print("=" * 80)
