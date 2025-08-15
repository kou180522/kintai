#!/usr/bin/env python3
"""
Detailed test script to debug theoj246's data for 2025/08/15
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime

# Test the datetime string formatting and sorting
timestamps = [
    {"date": "2025/08/15", "time": "0:05", "status": "end"},
    {"date": "2025/08/15", "time": "9:31", "status": "start"},
    {"date": "2025/08/15", "time": "11:12", "status": "end"}
]

print("Original timestamps:")
for ts in timestamps:
    print(f"  {ts['date']} {ts['time']} - {ts['status']}")

# Apply the fix
formatted_timestamps = []
for ts in timestamps:
    time_parts = ts["time"].split(":")
    if len(time_parts) == 2:
        hour = time_parts[0].zfill(2)
        minute = time_parts[1].zfill(2)
        formatted_time = f"{hour}:{minute}"
    else:
        formatted_time = ts["time"]
    
    formatted_timestamps.append({
        "date": ts["date"],
        "time": ts["time"],
        "status": ts["status"],
        "datetime_str": f"{ts['date']} {formatted_time}"
    })

print("\nWith formatted datetime_str:")
for ts in formatted_timestamps:
    print(f"  {ts['datetime_str']} - {ts['status']}")

# Sort by datetime_str
sorted_timestamps = sorted(formatted_timestamps, key=lambda x: x["datetime_str"])

print("\nAfter sorting:")
for ts in sorted_timestamps:
    print(f"  {ts['datetime_str']} - {ts['status']}")

# Process with the fixed logic
print("\nProcessing sessions:")
current_start = None
work_sessions = []

for ts in sorted_timestamps:
    if ts["status"] == "start":
        if current_start:
            print(f"  Warning: Consecutive start, ignoring first")
        current_start = ts
        print(f"  Start: {ts['time']}")
    elif ts["status"] == "end":
        if not current_start:
            print(f"  Warning: End without start at {ts['time']}, ignoring")
        else:
            # Calculate work time
            start_parts = current_start['time'].split(':')
            end_parts = ts['time'].split(':')
            start_min = int(start_parts[0]) * 60 + int(start_parts[1])
            end_min = int(end_parts[0]) * 60 + int(end_parts[1])
            
            if end_min < start_min:
                end_min += 24 * 60
            
            work_min = end_min - start_min
            print(f"  End: {ts['time']} - Session: {work_min} minutes ({work_min/60:.2f} hours)")
            work_sessions.append(work_min)
            current_start = None

if current_start:
    print(f"  Warning: Incomplete session starting at {current_start['time']}")

print(f"\nTotal work time: {sum(work_sessions)} minutes ({sum(work_sessions)/60:.2f} hours)")