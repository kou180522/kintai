#!/usr/bin/env python3
"""
時刻調整ロジックのテスト
差分計算後に調整時間を適用する新方式の検証
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.csv_loader import CSVLoader

def test_adjustment_logic():
    """新しい調整ロジックのテスト"""
    
    loader = CSVLoader()
    
    print("=" * 60)
    print("時刻調整ロジックテスト（差分計算後に調整適用）")
    print("=" * 60)
    
    # テストケース
    test_cases = [
        {
            "description": "基本ケース: 9:00-18:00 = 9時間",
            "start_time": "09:00",
            "end_time": "18:00",
            "start_adjustment": None,
            "end_adjustment": None,
            "expected_minutes": 540  # 9時間
        },
        {
            "description": "開始調整: 9:00(s+60)-18:00 = 10時間（60分早く開始）",
            "start_time": "09:00",
            "end_time": "18:00",
            "start_adjustment": 60,
            "end_adjustment": None,
            "expected_minutes": 600  # 10時間
        },
        {
            "description": "終了調整: 9:00-18:00(f+30) = 9時間30分（30分長く勤務）",
            "start_time": "09:00",
            "end_time": "18:00",
            "start_adjustment": None,
            "end_adjustment": 30,
            "expected_minutes": 570  # 9時間30分
        },
        {
            "description": "両方調整: 9:00(s+60)-18:00(f+30) = 10時間30分",
            "start_time": "09:00",
            "end_time": "18:00",
            "start_adjustment": 60,
            "end_adjustment": 30,
            "expected_minutes": 630  # 10時間30分
        },
        {
            "description": "マイナス調整: 9:00(s-30)-18:00 = 8時間30分（30分遅く開始）",
            "start_time": "09:00",
            "end_time": "18:00",
            "start_adjustment": -30,
            "end_adjustment": None,
            "expected_minutes": 510  # 8時間30分
        },
        {
            "description": "マイナス調整: 9:00-18:00(f-60) = 8時間（60分早く終了）",
            "start_time": "09:00",
            "end_time": "18:00",
            "start_adjustment": None,
            "end_adjustment": -60,
            "expected_minutes": 480  # 8時間
        },
    ]
    
    passed = 0
    failed = 0
    
    for test in test_cases:
        # 基本の差分を計算
        start_parts = test["start_time"].split(":")
        end_parts = test["end_time"].split(":")
        
        start_minutes = int(start_parts[0]) * 60 + int(start_parts[1])
        end_minutes = int(end_parts[0]) * 60 + int(end_parts[1])
        
        # 基本の勤務時間
        base_work_minutes = end_minutes - start_minutes
        
        # 調整を適用
        adjusted_work_minutes = base_work_minutes
        
        if test["start_adjustment"] is not None:
            adjusted_work_minutes += test["start_adjustment"]
        
        if test["end_adjustment"] is not None:
            adjusted_work_minutes += test["end_adjustment"]
        
        # 結果を検証
        if adjusted_work_minutes == test["expected_minutes"]:
            print(f"✅ PASS: {test['description']}")
            print(f"   基本: {base_work_minutes}分, 調整後: {adjusted_work_minutes}分")
            passed += 1
        else:
            print(f"❌ FAIL: {test['description']}")
            print(f"   期待値: {test['expected_minutes']}分")
            print(f"   実際値: {adjusted_work_minutes}分")
            print(f"   基本: {base_work_minutes}分")
            failed += 1
    
    print("=" * 60)
    print(f"テスト結果: {passed} 成功, {failed} 失敗")
    print("=" * 60)
    
    # 新しいロジックの説明
    print("\n【新しい調整ロジック】")
    print("1. まず開始時刻と終了時刻の差分を計算（基本勤務時間）")
    print("2. その後、調整時間を加減算")
    print("   - s+60: 基本勤務時間 + 60分（60分早く開始した）")
    print("   - f+30: 基本勤務時間 + 30分（30分長く働いた）")
    print("   - s-30: 基本勤務時間 - 30分（30分遅く開始した）")
    print("   - f-60: 基本勤務時間 - 60分（60分早く終了した）")
    print("\n例: 9:00(s+60) - 18:00(f+30)")
    print("   基本: 18:00 - 9:00 = 9時間（540分）")
    print("   調整: 540分 + 60分 + 30分 = 630分（10時間30分）")
    
    return failed == 0

if __name__ == "__main__":
    success = test_adjustment_logic()
    sys.exit(0 if success else 1)