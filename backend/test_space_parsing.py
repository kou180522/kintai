#!/usr/bin/env python3
"""
スペースを含む調整時間のパーステストスクリプト
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.csv_loader import CSVLoader

def test_space_parsing():
    """スペースを含む調整時間のパーステスト"""
    
    loader = CSVLoader()
    
    # テストケース: (status, message, time, 期待される結果)
    test_cases = [
        # スペースなし
        ("s", "s+60", "10:00", ("start", "09:00", 0)),
        ("f", "f+30", "18:00", ("end", "18:30", 0)),
        ("s", "s-90", "10:00", ("start", "11:30", 0)),
        
        # スペースあり
        ("s", "s +60", "10:00", ("start", "09:00", 0)),
        ("f", "f +30", "18:00", ("end", "18:30", 0)),
        ("s", "s -90", "10:00", ("start", "11:30", 0)),
        ("s", "s - 60", "10:00", ("start", "11:00", 0)),
        ("f", "f + 45", "17:00", ("end", "17:45", 0)),
        
        # 時刻指定形式
        ("s", "s18:00", "10:00", ("start", "18:00", 0)),
        ("s", "s 18:00", "10:00", ("start", "18:00", 0)),
        ("f", "f19:30", "18:00", ("end", "19:30", 0)),
        ("f", "f 19:30", "18:00", ("end", "19:30", 0)),
        
        # 通常の開始・終了
        ("開始", "", "09:00", ("start", "09:00", 0)),
        ("終了", "", "18:00", ("end", "18:00", 0)),
    ]
    
    print("=" * 60)
    print("スペースを含む調整時間のパーステスト")
    print("=" * 60)
    
    passed = 0
    failed = 0
    
    for status, message, time, expected in test_cases:
        result = loader.parse_status_with_adjustment(status, message, time)
        
        if result == expected:
            print(f"✅ PASS: status='{status}', message='{message}', time='{time}'")
            print(f"   結果: {result}")
            passed += 1
        else:
            print(f"❌ FAIL: status='{status}', message='{message}', time='{time}'")
            print(f"   期待値: {expected}")
            print(f"   実際値: {result}")
            failed += 1
    
    print("=" * 60)
    print(f"テスト結果: {passed} 成功, {failed} 失敗")
    print("=" * 60)
    
    if failed == 0:
        print("✨ すべてのテストが成功しました！")
    else:
        print("⚠️  一部のテストが失敗しました。")
    
    return failed == 0

if __name__ == "__main__":
    success = test_space_parsing()
    sys.exit(0 if success else 1)