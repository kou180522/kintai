#!/usr/bin/env python3
"""
test_userのデバッグ
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.csv_loader import CSVLoader
from collections import defaultdict

loader = CSVLoader()
loader.reload_data()  # データを読み込む

# test_userのタイムスタンプを処理
user_all_timestamps = defaultdict(list)

for record in loader.attendance_records:
    user_name = record.get("user", "")
    if user_name != "test_user":
        continue
        
    date = record.get("date", "")
    time = record.get("time", "")
    status = record.get("status", "")
    message = record.get("message", "")
    
    print(f"Raw record: date={date}, time={time}, status={status}, message={message}")
    
    # ステータスを正規化
    base_status = loader.parse_status(status, message)
    
    # 特定時刻の指定があるかチェック
    specific_time = loader.parse_specific_time_from_message(message)
    
    # 特定時刻がある場合はそれを使用、ない場合は記録時刻を使用
    if specific_time:
        actual_time = specific_time
        adjustment_minutes = None
    else:
        actual_time = time
        adjustment_minutes = loader.parse_adjustment_from_message(message)
    
    print(f"  -> base_status={base_status}, specific_time={specific_time}, actual_time={actual_time}")
    
    # 時刻を適切にパディング
    time_parts = actual_time.split(":")
    if len(time_parts) == 2:
        hour = time_parts[0].zfill(2)
        minute = time_parts[1].zfill(2)
        formatted_time = f"{hour}:{minute}"
    else:
        formatted_time = actual_time
    
    user_all_timestamps[user_name].append({
        "date": date,
        "time": actual_time,
        "status": base_status,
        "adjustment_minutes": adjustment_minutes,
        "original_status": status,
        "message": message,
        "datetime_str": f"{date} {formatted_time}"
    })

print("\nTimestamps before sorting:")
for ts in user_all_timestamps["test_user"]:
    print(f"  {ts['datetime_str']} - {ts['status']}")

# ソート
sorted_timestamps = sorted(user_all_timestamps["test_user"], key=lambda x: x["datetime_str"])

print("\nTimestamps after sorting:")
for ts in sorted_timestamps:
    print(f"  {ts['datetime_str']} - {ts['status']} (time={ts['time']})")

# セッション処理
print("\nProcessing sessions:")
current_start = None
work_sessions = []

for ts in sorted_timestamps:
    if ts["status"] == "start":
        if current_start:
            print(f"  Warning: Consecutive start")
        current_start = ts
        print(f"  Start at {ts['time']}")
    elif ts["status"] == "end":
        if not current_start:
            print(f"  Warning: End without start at {ts['time']}")
        else:
            # 勤務時間計算
            start_parts = current_start['time'].split(':')
            end_parts = ts['time'].split(':')
            start_min = int(start_parts[0]) * 60 + int(start_parts[1])
            end_min = int(end_parts[0]) * 60 + int(end_parts[1])
            
            if end_min < start_min:
                end_min += 24 * 60
            
            work_min = end_min - start_min
            print(f"  End at {ts['time']} - Session: {work_min} minutes ({work_min/60:.2f} hours)")
            work_sessions.append(work_min)
            current_start = None

if current_start:
    print(f"  Warning: Incomplete session starting at {current_start['time']}")

if work_sessions:
    total = sum(work_sessions)
    print(f"\nTotal: {total} minutes ({total/60:.2f} hours)")
    print(f"Expected: 14:30 to 17:45 = 195 minutes (3.25 hours)")