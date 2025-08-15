#!/usr/bin/env python3
"""
s/s/f, s/f/f パターンのテスト
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# テストデータを作成
test_patterns = [
    {
        "name": "s/s/f パターン（連続する開始）",
        "description": "09:00 s, 09:30 s, 18:00 f",
        "expected": "09:30〜18:00（8時間30分）",
        "timestamps": [
            {"date": "2025/08/15", "time": "09:00", "status": "start"},
            {"date": "2025/08/15", "time": "09:30", "status": "start"},
            {"date": "2025/08/15", "time": "18:00", "status": "end"}
        ]
    },
    {
        "name": "s/f/f パターン（連続する終了）",
        "description": "09:00 s, 18:00 f, 18:30 f", 
        "expected": "09:00〜18:00（9時間）",
        "timestamps": [
            {"date": "2025/08/15", "time": "09:00", "status": "start"},
            {"date": "2025/08/15", "time": "18:00", "status": "end"},
            {"date": "2025/08/15", "time": "18:30", "status": "end"}
        ]
    },
    {
        "name": "f/s/f パターン（終了から開始）",
        "description": "08:00 f, 09:00 s, 18:00 f",
        "expected": "09:00〜18:00（9時間）",
        "timestamps": [
            {"date": "2025/08/15", "time": "08:00", "status": "end"},
            {"date": "2025/08/15", "time": "09:00", "status": "start"},
            {"date": "2025/08/15", "time": "18:00", "status": "end"}
        ]
    },
    {
        "name": "s/s/s/f パターン（複数の連続開始）",
        "description": "09:00 s, 09:15 s, 09:30 s, 18:00 f",
        "expected": "09:30〜18:00（8時間30分）",
        "timestamps": [
            {"date": "2025/08/15", "time": "09:00", "status": "start"},
            {"date": "2025/08/15", "time": "09:15", "status": "start"},
            {"date": "2025/08/15", "time": "09:30", "status": "start"},
            {"date": "2025/08/15", "time": "18:00", "status": "end"}
        ]
    }
]

def process_timestamps(timestamps):
    """CSVローダーのロジックをシミュレート"""
    # 時刻でソート（パディング付き）
    for ts in timestamps:
        time_parts = ts["time"].split(":")
        if len(time_parts) == 2:
            hour = time_parts[0].zfill(2)
            minute = time_parts[1].zfill(2)
            ts["sort_key"] = f"{ts['date']} {hour}:{minute}"
        else:
            ts["sort_key"] = f"{ts['date']} {ts['time']}"
    
    sorted_timestamps = sorted(timestamps, key=lambda x: x["sort_key"])
    
    # セッション処理
    current_start = None
    work_sessions = []
    warnings = []
    
    for ts in sorted_timestamps:
        if ts["status"] == "start":
            if current_start:
                warnings.append(f"警告: 連続する開始時刻を検出、最初の開始時刻を無視（{current_start['time']} → {ts['time']}）")
            current_start = ts
            
        elif ts["status"] == "end":
            if not current_start:
                warnings.append(f"警告: 開始時刻なしの終了 {ts['time']}")
            else:
                # 勤務時間計算
                start_parts = current_start['time'].split(':')
                end_parts = ts['time'].split(':')
                start_min = int(start_parts[0]) * 60 + int(start_parts[1])
                end_min = int(end_parts[0]) * 60 + int(end_parts[1])
                
                if end_min < start_min:
                    end_min += 24 * 60
                
                work_min = end_min - start_min
                work_sessions.append({
                    "start": current_start['time'],
                    "end": ts['time'],
                    "minutes": work_min
                })
                current_start = None
    
    if current_start:
        warnings.append(f"情報: 未完了のセッション {current_start['time']}")
    
    return work_sessions, warnings

# テスト実行
print("=" * 60)
print("重複パターンのテスト")
print("=" * 60)

for test in test_patterns:
    print(f"\n■ {test['name']}")
    print(f"  入力: {test['description']}")
    print(f"  期待: {test['expected']}")
    
    sessions, warnings = process_timestamps(test["timestamps"])
    
    # 警告表示
    for warning in warnings:
        print(f"  {warning}")
    
    # 結果表示
    if sessions:
        for session in sessions:
            hours = session["minutes"] // 60
            mins = session["minutes"] % 60
            print(f"  結果: {session['start']}〜{session['end']}（{hours}時間{mins}分）")
    else:
        print(f"  結果: セッションなし")
    
    # 判定
    if len(sessions) == 1:
        actual_minutes = sessions[0]["minutes"]
        # 期待値から分数を抽出
        import re
        match = re.search(r'（(\d+)時間(\d+)?分?）', test['expected'])
        if match:
            expected_hours = int(match.group(1))
            expected_mins = int(match.group(2)) if match.group(2) else 0
            expected_total = expected_hours * 60 + expected_mins
            
            if actual_minutes == expected_total:
                print(f"  ✅ 正しく処理されました")
            else:
                print(f"  ❌ 期待値と異なります（期待: {expected_total}分、実際: {actual_minutes}分）")

print("\n" + "=" * 60)