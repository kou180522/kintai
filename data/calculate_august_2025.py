#!/usr/bin/env python3
"""
2025年8月の各ユーザーの勤務時間を詳細に計算
"""

import csv
from datetime import datetime, timedelta
from collections import defaultdict
import json

def parse_time_with_adjustment(status, time_str):
    """時刻とステータスから調整済み時刻を計算"""
    if not status or not time_str:
        return None, None
    
    status_lower = status.lower()
    adjustment_minutes = 0
    
    # s+XX または f+XX パターンの処理
    if '+' in status_lower:
        parts = status_lower.split('+')
        if len(parts) == 2:
            try:
                adjustment_minutes = int(parts[1])
                status_lower = parts[0]
            except ValueError:
                pass
    
    # 基本ステータスの判定
    if status_lower in ["開始", "s", "start"]:
        base_status = "start"
    elif status_lower in ["終了", "f", "finish", "end"]:
        base_status = "end"
    else:
        return None, None
    
    # 時刻のパース
    try:
        time_parts = time_str.split(":")
        if len(time_parts) >= 2:
            hours = int(time_parts[0])
            minutes = int(time_parts[1])
            
            # 調整時間を適用
            if base_status == "start":
                # s+90 = 90分前から勤務開始
                total_minutes = hours * 60 + minutes - adjustment_minutes
            else:
                # f+30 = 30分後まで勤務
                total_minutes = hours * 60 + minutes + adjustment_minutes
            
            # 時刻を再計算
            adjusted_hours = (total_minutes // 60) % 24
            adjusted_minutes = total_minutes % 60
            
            if total_minutes < 0:
                adjusted_hours = (24 + (total_minutes // 60)) % 24
                
            return base_status, (adjusted_hours, adjusted_minutes)
    except:
        pass
    
    # 調整なしで返す
    try:
        time_parts = time_str.split(":")
        if len(time_parts) >= 2:
            return base_status, (int(time_parts[0]), int(time_parts[1]))
    except:
        pass
    
    return None, None

def calculate_august_2025():
    """2025年8月の勤務時間を計算"""
    
    # CSVファイルを読み込み
    csv_file = "/Users/Owner/Atlas/kintai/attendance_data.csv"
    
    # ユーザー別のデータを格納
    user_records = defaultdict(list)
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            date = row.get('日付', '') or row.get('date', '')
            if not date or not date.startswith('2025/08'):
                continue
            
            user = row.get('ユーザー', '') or row.get('user', '')
            time = row.get('時間', '') or row.get('時刻', '') or row.get('time', '')
            status = row.get('ステータス', '') or row.get('status', '')
            message = row.get('メッセージ', '') or row.get('message', '')
            
            if user and time and status:
                user_records[user].append({
                    'date': date,
                    'time': time,
                    'status': status,
                    'message': message,
                    'datetime_str': f"{date} {time}"
                })
    
    # 各ユーザーの8月の勤務時間を計算
    results = {}
    
    print("=" * 80)
    print("【2025年8月の勤務時間計算結果】")
    print("=" * 80)
    print(f"計算日時: {datetime.now().strftime('%Y年%m月%d日 %H:%M:%S')}")
    print()
    
    all_users_total = 0
    active_users = 0
    
    for user_name, records in sorted(user_records.items()):
        if not records:
            continue
        
        # 時系列でソート
        sorted_records = sorted(records, key=lambda x: x['datetime_str'])
        
        print(f"\n【{user_name}】")
        print("-" * 60)
        
        # ペアリング処理
        work_sessions = []
        current_start = None
        daily_work = defaultdict(int)
        
        for rec in sorted_records:
            status_type, time_tuple = parse_time_with_adjustment(rec['status'], rec['time'])
            
            if not status_type or not time_tuple:
                continue
            
            if status_type == "start":
                if current_start:
                    print(f"  ⚠️ 連続開始: {current_start['date']} {current_start['time']} → {rec['date']} {rec['time']}")
                current_start = rec
                current_start['parsed_time'] = time_tuple
                
            elif status_type == "end" and current_start:
                # 勤務時間を計算
                start_h, start_m = current_start['parsed_time']
                end_h, end_m = time_tuple
                
                start_total_min = start_h * 60 + start_m
                end_total_min = end_h * 60 + end_m
                
                # 日跨ぎチェック
                if rec['date'] != current_start['date']:
                    try:
                        start_dt = datetime.strptime(current_start['date'], "%Y/%m/%d")
                        end_dt = datetime.strptime(rec['date'], "%Y/%m/%d")
                        days_diff = (end_dt - start_dt).days
                        if days_diff > 0:
                            end_total_min += days_diff * 24 * 60
                    except:
                        pass
                elif end_total_min < start_total_min:
                    # 同日でも終了が開始より前 = 日跨ぎ
                    end_total_min += 24 * 60
                
                work_minutes = end_total_min - start_total_min
                
                # 24時間超チェック
                if work_minutes > 24 * 60:
                    print(f"  ❌ 24時間超過（無効）: {current_start['date']} {current_start['time']} → {rec['date']} {rec['time']} = {work_minutes}分")
                    current_start = None
                    continue
                
                if work_minutes > 0:
                    work_sessions.append({
                        'start': f"{current_start['date']} {current_start['time']}",
                        'end': f"{rec['date']} {rec['time']}",
                        'minutes': work_minutes,
                        'date': current_start['date']
                    })
                    
                    # 日別集計（開始日に計上）
                    daily_work[current_start['date']] += work_minutes
                    
                    # セッション詳細を表示
                    hours = work_minutes // 60
                    mins = work_minutes % 60
                    print(f"  ✓ {current_start['date']} {current_start['time']} → {rec['date']} {rec['time']}: {hours}時間{mins}分")
                
                current_start = None
        
        # 未完了セッションチェック
        if current_start:
            print(f"  ⚠️ 未完了: {current_start['date']} {current_start['time']} から")
        
        # ユーザーの合計を計算
        total_minutes = sum(s['minutes'] for s in work_sessions)
        
        if total_minutes > 0:
            active_users += 1
            all_users_total += total_minutes
            
            total_hours = total_minutes // 60
            total_mins = total_minutes % 60
            work_days = len(daily_work)
            
            print(f"\n  8月合計: {total_hours}時間{total_mins}分")
            print(f"  勤務日数: {work_days}日")
            
            if work_days > 0:
                avg_per_day = total_minutes / work_days
                avg_h = int(avg_per_day) // 60
                avg_m = int(avg_per_day) % 60
                print(f"  平均/日: {avg_h}時間{avg_m}分")
            
            # 日別詳細（最初の5日のみ表示）
            print(f"\n  日別内訳:")
            for i, (date, minutes) in enumerate(sorted(daily_work.items())):
                if i >= 5:
                    remaining = len(daily_work) - 5
                    if remaining > 0:
                        print(f"    ...他{remaining}日")
                    break
                h = minutes // 60
                m = minutes % 60
                print(f"    {date}: {h}時間{m}分")
            
            results[user_name] = {
                'total_minutes': total_minutes,
                'total_hours': total_hours,
                'total_mins': total_mins,
                'work_days': work_days,
                'daily_work': dict(daily_work),
                'sessions': work_sessions
            }
        else:
            print(f"  8月の勤務記録なし")
            results[user_name] = {
                'total_minutes': 0,
                'total_hours': 0,
                'total_mins': 0,
                'work_days': 0,
                'daily_work': {},
                'sessions': []
            }
    
    # 全体サマリー
    print("\n" + "=" * 80)
    print("【2025年8月 全体サマリー】")
    print("=" * 80)
    
    # 勤務時間でソート
    sorted_results = sorted(results.items(), key=lambda x: x[1]['total_minutes'], reverse=True)
    
    print(f"\n{'順位':<4} {'ユーザー名':<25} {'8月勤務時間':<15} {'勤務日数':<10}")
    print("-" * 60)
    
    for rank, (user, data) in enumerate(sorted_results, 1):
        if data['total_minutes'] > 0:
            time_str = f"{data['total_hours']}時間{data['total_mins']}分"
            print(f"{rank:<4} {user:<25} {time_str:<15} {data['work_days']}日")
    
    print("-" * 60)
    
    if all_users_total > 0:
        total_h = all_users_total // 60
        total_m = all_users_total % 60
        print(f"\n8月の総勤務時間: {total_h}時間{total_m}分")
        print(f"アクティブユーザー数: {active_users}名")
        
        if active_users > 0:
            avg_per_user = all_users_total / active_users
            avg_h = int(avg_per_user) // 60
            avg_m = int(avg_per_user) % 60
            print(f"平均勤務時間/ユーザー: {avg_h}時間{avg_m}分")
    
    # JSONファイルに保存
    output = {
        'calculation_date': datetime.now().isoformat(),
        'month': '2025-08',
        'total_minutes': all_users_total,
        'active_users': active_users,
        'users': {}
    }
    
    for user, data in sorted_results:
        output['users'][user] = {
            'total_minutes': data['total_minutes'],
            'total_time': f"{data['total_hours']}時間{data['total_mins']}分",
            'work_days': data['work_days'],
            'daily_breakdown': data['daily_work']
        }
    
    with open('/Users/Owner/Atlas/kintai/august_2025_hours.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print("\n✅ 詳細データを august_2025_hours.json に保存しました")
    
    return results

if __name__ == "__main__":
    calculate_august_2025()