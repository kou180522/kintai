#!/usr/bin/env python3
"""
特定時刻指定機能のデバッグ
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.csv_loader import CSVLoader

def test_debug():
    loader = CSVLoader()
    loader.reload_data()
    
    # test_userのレコードを取得
    test_records = []
    for record in loader.attendance_records:
        if record.get("user") == "test_user":
            test_records.append(record)
    
    print("test_user records:")
    for record in test_records:
        print(f"  Date: {record.get('date')}, Time: {record.get('time')}, Status: {record.get('status')}, Message: {record.get('message')}")
    
    # 特定時刻の解析テスト
    print("\nParsing tests:")
    messages = ["s14:30", "f17:45"]
    for msg in messages:
        specific_time = loader.parse_specific_time_from_message(msg)
        adjustment = loader.parse_adjustment_from_message(msg)
        print(f"  Message: '{msg}' -> Time: {specific_time}, Adjustment: {adjustment}")

if __name__ == "__main__":
    test_debug()