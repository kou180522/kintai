#!/usr/bin/env python3
"""
特定時刻指定機能のテスト
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.csv_loader import CSVLoader

def test_specific_time():
    """特定時刻指定のテスト"""
    
    loader = CSVLoader()
    
    print("=" * 60)
    print("特定時刻指定機能テスト")
    print("=" * 60)
    
    # テストケース
    test_cases = [
        # 特定時刻指定
        {"message": "s18:00", "expected_time": "18:00", "expected_adj": None},
        {"message": "f19:30", "expected_time": "19:30", "expected_adj": None},
        {"message": "s 18:00", "expected_time": "18:00", "expected_adj": None},
        {"message": "s9:00", "expected_time": "9:00", "expected_adj": None},
        
        # 調整時間指定
        {"message": "s+60", "expected_time": None, "expected_adj": 60},
        {"message": "f-30", "expected_time": None, "expected_adj": -30},
        {"message": "s + 60", "expected_time": None, "expected_adj": 60},
        
        # 通常のs/f
        {"message": "s", "expected_time": None, "expected_adj": None},
        {"message": "f", "expected_time": None, "expected_adj": None},
        
        # 無効な時刻
        {"message": "s25:00", "expected_time": None, "expected_adj": None},
        {"message": "f12:99", "expected_time": None, "expected_adj": None},
    ]
    
    passed = 0
    failed = 0
    
    for test in test_cases:
        message = test["message"]
        expected_time = test["expected_time"]
        expected_adj = test["expected_adj"]
        
        # 特定時刻を解析
        specific_time = loader.parse_specific_time_from_message(message)
        
        # 調整時間を解析
        adjustment = loader.parse_adjustment_from_message(message)
        
        # 結果を検証
        time_ok = specific_time == expected_time
        adj_ok = adjustment == expected_adj
        
        if time_ok and adj_ok:
            print(f"✅ PASS: '{message}'")
            print(f"   特定時刻: {specific_time}, 調整時間: {adjustment}")
            passed += 1
        else:
            print(f"❌ FAIL: '{message}'")
            print(f"   期待値 - 時刻: {expected_time}, 調整: {expected_adj}")
            print(f"   実際値 - 時刻: {specific_time}, 調整: {adjustment}")
            failed += 1
    
    print("=" * 60)
    print(f"テスト結果: {passed} 成功, {failed} 失敗")
    print("=" * 60)
    
    return failed == 0

if __name__ == "__main__":
    success = test_specific_time()
    sys.exit(0 if success else 1)