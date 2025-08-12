#!/usr/bin/env python3
"""
勤務時間の正確な計算スクリプト
システム上で全ユーザーの勤務時間を正確に計算
"""

import sys
import os
sys.path.append('/Users/Owner/Atlas/kintai/backend_fastapi')

from app.services.csv_loader import csv_loader
from datetime import datetime
import json

def format_minutes_to_hours(total_minutes):
    """分を時間と分の形式に変換"""
    hours = total_minutes // 60
    minutes = total_minutes % 60
    return f"{hours}時間{minutes}分"

def calculate_accurate_working_hours():
    """正確な勤務時間を計算"""
    
    # データを再読み込み
    csv_loader.reload_data()
    
    # 全ユーザーの時間データを取得
    user_time_data = csv_loader.get_user_time_data()
    
    print("=" * 80)
    print("【勤務時間の正確な計算結果】")
    print("=" * 80)
    print(f"計算日時: {datetime.now().strftime('%Y年%m月%d日 %H:%M:%S')}")
    print(f"データ件数: {len(csv_loader.attendance_records)}件")
    print(f"ユーザー数: {len(user_time_data)}名")
    print()
    
    # 総勤務時間でソート
    sorted_users = sorted(
        user_time_data.items(),
        key=lambda x: x[1].get("total_hours", 0) * 60 + x[1].get("total_minutes", 0),
        reverse=True
    )
    
    # 全体統計
    total_all_minutes = 0
    total_all_days = 0
    active_users = 0
    
    print("【全ユーザーの勤務時間一覧】")
    print("-" * 80)
    print(f"{'順位':<4} {'ユーザー名':<25} {'総勤務時間':<15} {'勤務日数':<10} {'平均/日':<10}")
    print("-" * 80)
    
    results = []
    
    for rank, (user_name, data) in enumerate(sorted_users, 1):
        # 総勤務時間を分単位で計算
        total_minutes = data.get("total_hours", 0) * 60 + data.get("total_minutes", 0)
        work_days = data.get("work_days", 0)
        
        if total_minutes > 0:
            active_users += 1
            total_all_minutes += total_minutes
            total_all_days += work_days
            
            # 平均勤務時間/日
            avg_minutes_per_day = total_minutes / work_days if work_days > 0 else 0
            avg_formatted = format_minutes_to_hours(int(avg_minutes_per_day))
            
            formatted_time = format_minutes_to_hours(total_minutes)
            
            print(f"{rank:<4} {user_name:<25} {formatted_time:<15} {work_days:<10} {avg_formatted:<10}")
            
            # 結果を保存
            results.append({
                "rank": rank,
                "name": user_name,
                "total_minutes": total_minutes,
                "total_time": formatted_time,
                "work_days": work_days,
                "average_per_day": avg_formatted,
                "monthly_hours": data.get("monthly_hours", {})
            })
    
    print("-" * 80)
    
    # 全体統計の表示
    print()
    print("【全体統計】")
    print("-" * 80)
    print(f"アクティブユーザー数: {active_users}名")
    print(f"総勤務時間: {format_minutes_to_hours(total_all_minutes)}")
    print(f"総勤務日数: {total_all_days}日")
    if active_users > 0:
        avg_per_user = total_all_minutes / active_users
        print(f"平均勤務時間/ユーザー: {format_minutes_to_hours(int(avg_per_user))}")
    
    # 月別統計（直近3ヶ月）
    print()
    print("【月別勤務時間（2025年6月〜8月）】")
    print("-" * 80)
    
    months = ["2025/06", "2025/07", "2025/08"]
    for month in months:
        print(f"\n{month}:")
        month_total = 0
        active_in_month = 0
        
        for user_name, data in sorted_users[:10]:  # 上位10名のみ表示
            if month in data.get("monthly_hours", {}):
                month_minutes = data["monthly_hours"][month].get("work_minutes", 0)
                if month_minutes > 0:
                    active_in_month += 1
                    month_total += month_minutes
                    print(f"  {user_name:<25} {format_minutes_to_hours(month_minutes)}")
        
        if active_in_month > 0:
            print(f"  {'月合計':<25} {format_minutes_to_hours(month_total)}")
    
    # 異常値チェック
    print()
    print("【データ品質チェック】")
    print("-" * 80)
    
    # 1日24時間を超える勤務があるユーザー
    users_with_long_hours = []
    for user_name, data in user_time_data.items():
        for date, daily_data in data.get("daily_hours", {}).items():
            if daily_data.get("work_minutes", 0) > 12 * 60:  # 12時間超
                users_with_long_hours.append({
                    "user": user_name,
                    "date": date,
                    "hours": daily_data["work_minutes"] / 60
                })
    
    if users_with_long_hours:
        print(f"12時間超の勤務記録: {len(users_with_long_hours)}件")
        for record in users_with_long_hours[:5]:  # 最初の5件のみ表示
            print(f"  {record['user']}: {record['date']} ({record['hours']:.1f}時間)")
    else:
        print("✓ 異常な長時間勤務記録なし")
    
    # 結果をJSONファイルに保存
    output = {
        "calculation_time": datetime.now().isoformat(),
        "total_records": len(csv_loader.attendance_records),
        "total_users": len(user_time_data),
        "active_users": active_users,
        "statistics": {
            "total_working_minutes": total_all_minutes,
            "total_working_hours": format_minutes_to_hours(total_all_minutes),
            "total_work_days": total_all_days,
            "average_per_user": format_minutes_to_hours(int(avg_per_user)) if active_users > 0 else "0時間0分"
        },
        "user_details": results
    }
    
    with open('/Users/Owner/Atlas/kintai/accurate_working_hours.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print()
    print("=" * 80)
    print("✅ 計算完了")
    print("詳細データは accurate_working_hours.json に保存されました")
    print("=" * 80)
    
    return output

if __name__ == "__main__":
    calculate_accurate_working_hours()