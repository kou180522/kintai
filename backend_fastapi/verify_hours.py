#!/usr/bin/env python3
"""
各ユーザーの勤務時間を検証するスクリプト
"""

import csv
from datetime import datetime
from collections import defaultdict
import json

def parse_time(time_str):
    """時刻文字列をパース"""
    try:
        parts = time_str.split(":")
        if len(parts) >= 2:
            return int(parts[0]), int(parts[1])
    except:
        pass
    return None, None

def calculate_work_minutes(start_date, start_time, end_date, end_time):
    """勤務時間を分単位で計算"""
    start_h, start_m = parse_time(start_time)
    end_h, end_m = parse_time(end_time)
    
    if start_h is None or end_h is None:
        return 0
    
    start_total_min = start_h * 60 + start_m
    end_total_min = end_h * 60 + end_m
    
    # 日跨ぎ判定
    if start_date != end_date:
        try:
            start_dt = datetime.strptime(start_date, "%Y/%m/%d")
            end_dt = datetime.strptime(end_date, "%Y/%m/%d")
            days_diff = (end_dt - start_dt).days
            
            if days_diff < 0:
                # 日付逆転（エラーデータ）
                print(f"  ⚠️ 日付逆転: {start_date} → {end_date}")
                end_total_min += 24 * 60
            else:
                end_total_min += days_diff * 24 * 60
        except:
            end_total_min += 24 * 60
    elif end_total_min < start_total_min:
        # 同日でも終了が開始より前 = 日跨ぎ
        end_total_min += 24 * 60
    
    work_minutes = end_total_min - start_total_min
    
    # 24時間超えチェック
    if work_minutes > 24 * 60:
        print(f"  ⚠️ 24時間超過: {work_minutes}分 ({work_minutes//60}時間{work_minutes%60}分)")
        return 0  # 無効化
    
    return work_minutes if work_minutes > 0 else 0

def verify_user_hours(csv_file):
    """各ユーザーの勤務時間を検証"""
    
    # CSVを読み込み
    users_data = defaultdict(list)
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # 日本語と英語の両方のヘッダーに対応
            user = row.get('ユーザー', '') or row.get('user', '')
            date = row.get('日付', '') or row.get('date', '')
            time = row.get('時間', '') or row.get('時刻', '') or row.get('time', '')
            status = (row.get('ステータス', '') or row.get('status', '')).lower()
            
            if user and date and time and status:
                users_data[user].append({
                    'date': date,
                    'time': time,
                    'status': status,
                    'datetime_str': f"{date} {time}"
                })
    
    # 各ユーザーの勤務時間を計算
    all_users_summary = {}
    
    for user_name, records in users_data.items():
        print(f"\n{'='*60}")
        print(f"👤 ユーザー: {user_name}")
        print(f"{'='*60}")
        
        # 時系列でソート
        sorted_records = sorted(records, key=lambda x: x['datetime_str'])
        
        # ペアを作成
        work_sessions = []
        current_start = None
        total_minutes = 0
        monthly_minutes = defaultdict(int)
        daily_minutes = defaultdict(int)
        
        i = 0
        while i < len(sorted_records):
            rec = sorted_records[i]
            
            if rec['status'] in ['s', 'start', '開始']:
                if current_start:
                    print(f"  ⚠️ 連続する開始: {current_start['date']} {current_start['time']} → {rec['date']} {rec['time']}")
                current_start = rec
                i += 1
                
            elif rec['status'] in ['f', 'finish', 'end', '終了']:
                if not current_start:
                    print(f"  ⚠️ 開始なしの終了: {rec['date']} {rec['time']}")
                    i += 1
                    continue
                
                # 連続する終了をチェック
                final_end = rec
                j = i + 1
                while j < len(sorted_records) and sorted_records[j]['status'] in ['f', 'finish', 'end', '終了']:
                    print(f"  📝 連続終了検出: {sorted_records[j-1]['date']} {sorted_records[j-1]['time']} → {sorted_records[j]['date']} {sorted_records[j]['time']}")
                    final_end = sorted_records[j]
                    j += 1
                
                # 勤務時間を計算
                work_min = calculate_work_minutes(
                    current_start['date'], current_start['time'],
                    final_end['date'], final_end['time']
                )
                
                if work_min > 0:
                    work_sessions.append({
                        'start': f"{current_start['date']} {current_start['time']}",
                        'end': f"{final_end['date']} {final_end['time']}",
                        'minutes': work_min,
                        'hours': work_min / 60
                    })
                    
                    # 月別集計（開始日の月に計上）
                    month = current_start['date'][:7]  # YYYY/MM
                    monthly_minutes[month] += work_min
                    
                    # 日別集計
                    daily_minutes[current_start['date']] += work_min
                    
                    total_minutes += work_min
                
                current_start = None
                i = j
            else:
                i += 1
        
        # 未完了のセッション
        if current_start:
            print(f"  ⚠️ 未完了セッション: {current_start['date']} {current_start['time']} から")
        
        # サマリー表示
        print(f"\n📊 勤務サマリー:")
        print(f"  総勤務時間: {total_minutes}分 ({total_minutes//60}時間{total_minutes%60}分)")
        print(f"  勤務日数: {len(daily_minutes)}日")
        if len(daily_minutes) > 0:
            avg_minutes = total_minutes / len(daily_minutes)
            print(f"  平均勤務時間/日: {avg_minutes:.1f}分 ({avg_minutes/60:.1f}時間)")
        
        # 月別表示（最近の3ヶ月）
        print(f"\n📅 月別勤務時間:")
        for month in sorted(monthly_minutes.keys())[-3:]:
            min = monthly_minutes[month]
            print(f"  {month}: {min}分 ({min//60}時間{min%60}分)")
        
        # 異常値チェック
        print(f"\n🔍 異常値チェック:")
        long_days = [d for d, m in daily_minutes.items() if m > 12*60]  # 12時間超
        if long_days:
            print(f"  12時間超の日: {len(long_days)}日")
            for day in long_days[:3]:  # 最初の3日を表示
                m = daily_minutes[day]
                print(f"    {day}: {m}分 ({m//60}時間{m%60}分)")
        
        # 全体サマリーに追加
        all_users_summary[user_name] = {
            'total_minutes': total_minutes,
            'total_hours': total_minutes / 60,
            'work_days': len(daily_minutes),
            'monthly': dict(monthly_minutes)
        }
    
    # 全ユーザーサマリー
    print(f"\n{'='*60}")
    print(f"📊 全ユーザーサマリー")
    print(f"{'='*60}")
    
    sorted_users = sorted(all_users_summary.items(), 
                         key=lambda x: x[1]['total_minutes'], 
                         reverse=True)
    
    for i, (user, data) in enumerate(sorted_users, 1):
        hours = data['total_hours']
        print(f"{i:2}. {user:20} {hours:7.1f}時間 ({data['work_days']}日)")
    
    return all_users_summary

if __name__ == "__main__":
    csv_file = "/Users/Owner/Atlas/kintai/attendance_data.csv"
    summary = verify_user_hours(csv_file)
    
    # JSONで保存
    with open('/Users/Owner/Atlas/kintai/verification_result.json', 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    
    print("\n✅ 検証結果を verification_result.json に保存しました")