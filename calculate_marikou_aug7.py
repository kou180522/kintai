#!/usr/bin/env python3
"""
marikou180522の2025年8月7日の勤務時間を詳細に計算
"""

import csv
from datetime import datetime, timedelta

def parse_time_and_adjustment(status, time_str):
    """ステータスと時刻から調整を含めて解析"""
    if not status or not time_str:
        return None, None, None
    
    status_lower = status.lower()
    adjustment_minutes = 0
    original_status = status
    
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
        return None, None, None
    
    # 時刻のパース
    try:
        time_parts = time_str.split(":")
        if len(time_parts) >= 2:
            hours = int(time_parts[0])
            minutes = int(time_parts[1])
            
            # 調整時間を適用
            total_minutes = hours * 60 + minutes
            
            if base_status == "start":
                # s+60 = 60分前から勤務開始として計算
                adjusted_total_minutes = total_minutes - adjustment_minutes
            else:
                # f+30 = 30分後まで勤務として計算
                adjusted_total_minutes = total_minutes + adjustment_minutes
            
            # 調整後の時刻を計算
            adjusted_hours = (adjusted_total_minutes // 60) % 24
            adjusted_minutes = adjusted_total_minutes % 60
            
            # 負の値の場合は前日扱い
            if adjusted_total_minutes < 0:
                adjusted_hours = 24 + (adjusted_total_minutes // 60)
                adjusted_minutes = 60 + (adjusted_total_minutes % 60) if adjusted_total_minutes % 60 != 0 else 0
            
            adjusted_time = f"{adjusted_hours:02d}:{adjusted_minutes:02d}"
            
            return base_status, adjusted_time, adjustment_minutes
    except:
        pass
    
    return None, None, None

def calculate_marikou_aug7():
    """marikou180522の8月7日の勤務時間を計算"""
    
    csv_file = "/Users/Owner/Atlas/kintai/attendance_data.csv"
    
    print("=" * 80)
    print("【marikou180522 - 2025年8月7日の勤務時間詳細計算】")
    print("=" * 80)
    print()
    
    # 8月6日〜8日のデータを取得（日跨ぎの可能性を考慮）
    records = []
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            user = row.get('ユーザー', '') or row.get('user', '')
            if user != 'marikou180522':
                continue
            
            date = row.get('日付', '') or row.get('date', '')
            if not date:
                continue
            
            # 8月6日〜8日のデータを取得
            if date in ['2025/08/06', '2025/08/07', '2025/08/08']:
                time = row.get('時間', '') or row.get('時刻', '') or row.get('time', '')
                status = row.get('ステータス', '') or row.get('status', '')
                message = row.get('メッセージ', '') or row.get('message', '')
                
                if time and status:
                    records.append({
                        'date': date,
                        'time': time,
                        'status': status,
                        'message': message,
                        'datetime_str': f"{date} {time}"
                    })
    
    # 時系列でソート
    records.sort(key=lambda x: x['datetime_str'])
    
    print("【取得したレコード】")
    print("-" * 60)
    for rec in records:
        print(f"{rec['date']} {rec['time']:8} {rec['status']:10} {rec.get('message', '')}")
    
    print("\n【詳細解析】")
    print("-" * 60)
    
    # 8月7日に関連するセッションを特定
    aug7_sessions = []
    current_start = None
    
    for i, rec in enumerate(records):
        status_type, adjusted_time, adjustment = parse_time_and_adjustment(rec['status'], rec['time'])
        
        if not status_type:
            continue
        
        print(f"\n{rec['date']} {rec['time']} - ステータス: {rec['status']}")
        
        if adjustment and adjustment > 0:
            print(f"  → 調整時間: {adjustment}分")
            print(f"  → 調整後時刻: {adjusted_time}")
        
        if status_type == "start":
            if current_start:
                print(f"  ⚠️ 前のセッション未完了のため自動終了")
            current_start = {
                'date': rec['date'],
                'time': rec['time'],
                'adjusted_time': adjusted_time,
                'status': rec['status'],
                'adjustment': adjustment
            }
            print(f"  ✓ 開始セッション記録")
            
        elif status_type == "end" and current_start:
            # 勤務時間を計算
            start_time_parts = current_start['adjusted_time'].split(':')
            end_time_parts = adjusted_time.split(':')
            
            start_h, start_m = int(start_time_parts[0]), int(start_time_parts[1])
            end_h, end_m = int(end_time_parts[0]), int(end_time_parts[1])
            
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
                        print(f"  → 日跨ぎ検出: {days_diff}日")
                except:
                    pass
            elif end_total_min < start_total_min:
                end_total_min += 24 * 60
                print(f"  → 時刻逆転のため日跨ぎとして処理")
            
            work_minutes = end_total_min - start_total_min
            
            # 8月7日に該当するセッションか判定
            if current_start['date'] == '2025/08/07' or rec['date'] == '2025/08/07':
                hours = work_minutes // 60
                mins = work_minutes % 60
                
                print(f"  ✓ セッション完了: {hours}時間{mins}分")
                
                aug7_sessions.append({
                    'start': f"{current_start['date']} {current_start['time']}",
                    'start_adjusted': f"{current_start['date']} {current_start['adjusted_time']}",
                    'end': f"{rec['date']} {rec['time']}",
                    'end_adjusted': f"{rec['date']} {adjusted_time}",
                    'minutes': work_minutes,
                    'start_adjustment': current_start.get('adjustment', 0),
                    'end_adjustment': adjustment
                })
                
                # 8月7日分として計上するか判定
                if current_start['date'] == '2025/08/07':
                    print(f"  → 8月7日の勤務として計上")
            
            current_start = None
    
    print("\n" + "=" * 80)
    print("【8月7日の勤務時間集計】")
    print("=" * 80)
    
    total_minutes = 0
    
    print("\n勤務セッション:")
    for i, session in enumerate(aug7_sessions, 1):
        hours = session['minutes'] // 60
        mins = session['minutes'] % 60
        
        print(f"\nセッション{i}:")
        print(f"  開始: {session['start']}")
        if session['start_adjustment'] > 0:
            print(f"    → s+{session['start_adjustment']} 調整後: {session['start_adjusted'].split()[1]}")
        print(f"  終了: {session['end']}")
        if session['end_adjustment'] > 0:
            print(f"    → f+{session['end_adjustment']} 調整後: {session['end_adjusted'].split()[1]}")
        print(f"  勤務時間: {hours}時間{mins}分")
        
        total_minutes += session['minutes']
    
    if total_minutes > 0:
        total_hours = total_minutes // 60
        total_mins = total_minutes % 60
        
        print("\n" + "-" * 60)
        print(f"\n【8月7日の合計勤務時間】")
        print(f"  {total_hours}時間{total_mins}分（{total_minutes}分）")
    else:
        print("\n8月7日の勤務記録はありません")
    
    print("\n" + "=" * 80)
    
    return total_minutes

if __name__ == "__main__":
    calculate_marikou_aug7()