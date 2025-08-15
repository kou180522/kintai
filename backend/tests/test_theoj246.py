#!/usr/bin/env python3
"""
Test script to debug theoj246's data for 2025/08/15
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.csv_loader import CSVLoader
from datetime import datetime

def test_theoj246():
    loader = CSVLoader()
    loader.reload_data()
    
    # Get all records for theoj246 on 2025/08/15
    theoj246_records = []
    for record in loader.attendance_records:
        if record.get("user") == "theoj246" and record.get("date") == "2025/08/15":
            theoj246_records.append(record)
    
    print("=" * 60)
    print("theoj246 records for 2025/08/15:")
    print("=" * 60)
    for record in theoj246_records:
        print(f"  Time: {record.get('time')}, Status: {record.get('status')}, Message: {record.get('message')}")
    
    # Get the computed time data
    time_data = loader.get_user_time_data()
    
    print("\n" + "=" * 60)
    print("Computed data for theoj246 on 2025/08/15:")
    print("=" * 60)
    
    if "2025/08/15" in time_data:
        if "theoj246" in time_data["2025/08/15"]:
            data = time_data["2025/08/15"]["theoj246"]
            print(f"  Work hours: {data.get('work_hours', 0)} hours")
            print(f"  Sessions: {data.get('sessions', [])}")
        else:
            print("  No data for theoj246 on this date")
    else:
        print("  No data for 2025/08/15")
    
    # Check all dates for theoj246
    print("\n" + "=" * 60)
    print("All dates with theoj246 data:")
    print("=" * 60)
    for date, users in time_data.items():
        if "theoj246" in users:
            print(f"  {date}: {users['theoj246'].get('work_hours', 0)} hours")

if __name__ == "__main__":
    test_theoj246()