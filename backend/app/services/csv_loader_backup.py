"""
CSVデータローダー（修正版）
特殊なステータスコード（s+XX）と日跨ぎを正しく処理
"""
import csv
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any
from collections import defaultdict

class CSVLoader:
    def __init__(self):
        # backend/app/services から2階層上がってbackendディレクトリ
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        # 1階層上がってプロジェクトルート、そしてdataフォルダ
        project_root = os.path.dirname(backend_dir)
        self.csv_file_path = os.path.join(project_root, "data", "attendance_data.csv")
        self.users = []
        self.attendance_records = []
        self.last_loaded = None
        
    def reload_data(self):
        """データを再読み込み"""
        self.users = []
        self.attendance_records = []
        self.last_loaded = None
        return self.load_data()
        
    def load_data(self) -> bool:
        """CSVファイルからデータを読み込み"""
        try:
            if os.path.exists(self.csv_file_path):
                self.attendance_records = []
                unique_users = {}
                
                with open(self.csv_file_path, 'r', encoding='utf-8') as csvfile:
                    reader = csv.DictReader(csvfile)
                    for row in reader:
                        # 勤怠データの形式に対応
                        user_name = row.get('ユーザー', row.get('user', row.get('名前', '')))
                        date = row.get('日付', row.get('date', ''))
                        time = row.get('時間', row.get('time', ''))
                        status = row.get('ステータス', row.get('status', ''))
                        message = row.get('メッセージ', row.get('message', ''))
                        working_hours = row.get('合計稼働時間', row.get('working_hours', ''))
                        
                        # ユーザー名が存在する場合、データを記録
                        if user_name and user_name.strip():
                            attendance_record = {
                                "user": user_name,
                                "date": date,
                                "time": time,
                                "status": status,
                                "message": message,
                                "working_hours": working_hours
                            }
                            self.attendance_records.append(attendance_record)
                            
                            # ユーザー情報を抽出（一意のユーザーのみ）
                            if user_name not in unique_users:
                                # ユーザー名から仮のIDを生成
                                user_id = f"user_{len(unique_users) + 1:03d}"
                                unique_users[user_name] = {
                                    "employee_id": user_id,
                                    "name": user_name,
                                    "department": "未設定",
                                    "email": f"{user_name.replace(' ', '.').lower()}@example.com",
                                    "position": "一般社員"
                                }
                    
                    # ユーザーリストを作成
                    self.users = list(unique_users.values())
                    self.last_loaded = datetime.now()
                    
                    print(f"CSVデータ読み込み完了: {len(self.users)}人のユーザー、{len(self.attendance_records)}件の勤怠データ")
                    return True
            else:
                print(f"CSVファイルが見つかりません: {self.csv_file_path}")
                return False
                
        except Exception as e:
            print(f"CSVデータ読み込みエラー: {str(e)}")
            return False
    
    def get_users(self) -> List[Dict[str, Any]]:
        """ユーザー情報を取得"""
        if not self.users:
            self.load_data()
        return self.users
    
    def get_attendance_records(self) -> List[Dict[str, Any]]:
        """勤怠記録を取得"""
        if not self.attendance_records:
            self.load_data()
        return self.attendance_records
    
    def get_user_by_id(self, employee_id: str) -> Dict[str, Any]:
        """IDでユーザーを取得"""
        for user in self.users:
            if user["employee_id"] == employee_id:
                return user
        return None
    
    def get_user_by_name(self, name: str) -> Dict[str, Any]:
        """名前でユーザーを取得"""
        for user in self.users:
            if user["name"] == name:
                return user
        return None
    
    def parse_status_with_adjustment(self, status: str, message: str, time: str):
        """
        ステータスコードを解析して調整時間を取得
        s+90 のような形式から調整分数を抽出
        messageフィールドも確認して調整時間を取得
        """
        if not status or not time:
            return None, None, 0
        
        status_lower = status.lower()
        adjustment_minutes = 0
        
        # messageフィールドをチェック
        if message:
            message_lower = message.lower()
            import re
            
            # s18:00 や s 18:00 や f19:30 のような時刻指定形式を最初にチェック（スペースあり・なし両対応）
            time_match = re.search(r'([sf])\s*(\d{1,2}):(\d{2})', message_lower)
            if time_match:
                status_type = time_match.group(1)
                specified_hour = int(time_match.group(2))
                specified_minute = int(time_match.group(3))
                
                # 基本ステータスを設定
                if status_type == 's':
                    base_status = 'start'
                else:
                    base_status = 'end'
                
                # 指定時刻を直接返す
                adjusted_time = f"{specified_hour:02d}:{specified_minute:02d}"
                print(f"時刻指定検出: {message} → {adjusted_time}")
                return base_status, adjusted_time, 0
            
            # s+60, s -60, f+30, f -20 などのパターンをチェック（スペースあり・なし両対応）
            elif '+' in message_lower or '-' in message_lower:
                # スペースを含む可能性があるパターンに対応
                match = re.search(r'([sf])\s*([\+\-])\s*(\d+)', message_lower)
                if match:
                    sign = match.group(2)
                    value = int(match.group(3))
                    adjustment_minutes = value if sign == '+' else -value
                    # messageから基本ステータスも取得
                    if match.group(1) == 's':
                        status_lower = 's'
                    elif match.group(1) == 'f':
                        status_lower = 'f'
                    print(f"メッセージから調整検出: {message} → {adjustment_minutes}分調整")
        
        # messageに調整情報がない場合はstatusフィールドをチェック
        elif '+' in status_lower or '-' in status_lower:
            import re
            # スペースを含む可能性があるパターンに対応
            match = re.search(r'([sf])\s*([\+\-])\s*(\d+)', status_lower)
            if match:
                sign = match.group(2)
                value = int(match.group(3))
                adjustment_minutes = value if sign == '+' else -value
                status_lower = match.group(1)
        
        # 基本ステータスの判定
        if status_lower in ["開始", "s", "start"]:
            base_status = "start"
        elif status_lower in ["終了", "f", "finish", "end"]:
            base_status = "end"
        else:
            return None, None, 0
        
        # 時刻のパース
        try:
            time_parts = time.split(":")
            if len(time_parts) >= 2:
                hours = int(time_parts[0])
                minutes = int(time_parts[1])
                # 調整時間を適用（開始時は減算、終了時は加算）
                if base_status == "start":
                    # 開始時刻を早める（s+90 = 90分前から勤務開始）
                    total_minutes = hours * 60 + minutes - adjustment_minutes
                else:
                    # 終了時刻を遅らせる（f+30 = 30分後まで勤務、f-20 = 20分前に終了）
                    total_minutes = hours * 60 + minutes + adjustment_minutes
                
                # 負の値の場合の処理
                if total_minutes < 0:
                    # 前日の時刻として計算
                    adjusted_hours = 24 + (total_minutes // 60)
                    adjusted_minutes = total_minutes % 60
                    if adjusted_minutes < 0:
                        adjusted_hours -= 1
                        adjusted_minutes = 60 + adjusted_minutes
                    date_adjustment = -1
                elif total_minutes >= 24 * 60:
                    # 翌日の時刻として計算
                    adjusted_hours = (total_minutes // 60) % 24
                    adjusted_minutes = total_minutes % 60
                    date_adjustment = 1
                else:
                    adjusted_hours = total_minutes // 60
                    adjusted_minutes = total_minutes % 60
                    date_adjustment = 0
                
                adjusted_time = f"{adjusted_hours:02d}:{adjusted_minutes:02d}"
                return base_status, adjusted_time, date_adjustment
        except Exception as e:
            print(f"時刻パースエラー: {e}")
        
        return base_status, time, 0
    
    def get_user_time_data(self) -> Dict[str, Any]:
        """各ユーザーの時間データを集計（修正版）"""
        user_time_data = {}
        user_all_timestamps = {}  # ユーザー別の全タイムスタンプ（時系列順）
        
        # 全レコードをユーザー別に収集
        for record in self.attendance_records:
            user_name = record.get("user", "")
            if not user_name:
                continue
                
            date = record.get("date", "")
            time = record.get("time", "")
            status = record.get("status", "")
            message = record.get("message", "")
            
            # ステータスと調整時間を解析（messageフィールドも渡す）
            base_status, adjusted_time, date_adjustment = self.parse_status_with_adjustment(status, message, time)
            
            if not base_status:
                continue
            
            # 調整がある場合はログ出力
            if time != adjusted_time and message:
                print(f"調整検出: {user_name} {date} {time} {message} → {adjusted_time}")
            
            # 日付調整が必要な場合
            adjusted_date = date
            if date_adjustment != 0:
                try:
                    dt = datetime.strptime(date, "%Y/%m/%d")
                    dt += timedelta(days=date_adjustment)
                    adjusted_date = dt.strftime("%Y/%m/%d")
                except:
                    pass
            
            if user_name not in user_all_timestamps:
                user_all_timestamps[user_name] = []
            
            # タイムスタンプを記録
            # メッセージフィールドも保存（s+90などの元の情報として）
            user_all_timestamps[user_name].append({
                "date": adjusted_date,
                "time": adjusted_time,
                "status": base_status,
                "original_status": status,
                "message": message,
                "datetime_str": f"{adjusted_date} {adjusted_time}"
            })
        
        # 各ユーザーの勤務時間を計算
        for user_name, timestamps in user_all_timestamps.items():
            if user_name not in user_time_data:
                user_time_data[user_name] = {
                    "name": user_name,
                    "total_hours": 0,
                    "total_minutes": 0,
                    "total_time_formatted": "0時間0分",
                    "work_days": 0,
                    "records": [],
                    "daily_hours": {},  # 日別勤務時間
                    "monthly_hours": {}  # 月別勤務時間
                }
            
            # タイムスタンプを時系列順にソート
            sorted_timestamps = sorted(timestamps, key=lambda x: x["datetime_str"])
            
            # s（開始）とf（終了）のペアを作成して計算
            current_start = None
            work_sessions = []  # 勤務セッション
            
            i = 0
            while i < len(sorted_timestamps):
                ts = sorted_timestamps[i]
                
                if ts["status"] == "start":
                    # 既に開始時刻がある場合（連続するstart）
                    if current_start:
                        # 連続するstartの場合、最初のstartを無視して2番目を採用
                        print(f"警告: {user_name} - 連続する開始時刻を検出、最初の開始時刻を無視: {current_start['date']} {current_start['time']} → {ts['date']} {ts['time']}")
                    current_start = ts
                    i += 1
                    
                elif ts["status"] == "end":
                    if not current_start:
                        # 開始時刻なしで終了時刻が来た場合
                        print(f"警告: {user_name} - 開始時刻なしの終了 {ts['date']} {ts['time']}")
                        i += 1
                        continue
                    
                    # 勤務時間を計算
                    try:
                        start_parts = current_start["time"].split(":")
                        end_parts = ts["time"].split(":")
                        
                        if len(start_parts) >= 2 and len(end_parts) >= 2:
                            start_hour = int(start_parts[0])
                            start_min = int(start_parts[1])
                            end_hour = int(end_parts[0])
                            end_min = int(end_parts[1])
                            
                            # 分単位で計算
                            start_total_min = start_hour * 60 + start_min
                            end_total_min = end_hour * 60 + end_min
                            
                            # 日跨ぎの処理
                            if current_start["date"] != ts["date"]:
                                try:
                                    start_dt = datetime.strptime(current_start["date"], "%Y/%m/%d")
                                    end_dt = datetime.strptime(ts["date"], "%Y/%m/%d")
                                    days_diff = (end_dt - start_dt).days
                                    
                                    if days_diff > 0:
                                        end_total_min += days_diff * 24 * 60
                                    else:
                                        # 日付逆転（エラー）
                                        print(f"エラー: {user_name} - 日付逆転 {current_start['date']} → {ts['date']}")
                                        current_start = None
                                        i += 1
                                        continue
                                except:
                                    pass
                            elif end_total_min < start_total_min:
                                # 同日でも終了が開始より前 = 日跨ぎ
                                end_total_min += 24 * 60
                            
                            work_minutes = end_total_min - start_total_min
                            
                            # 異常値チェック（24時間超えは無効）
                            if work_minutes > 24 * 60:
                                print(f"エラー: {user_name} - 24時間超過を検出 {current_start['date']} {current_start['time']} → {ts['date']} {ts['time']} = {work_minutes}分")
                                current_start = None
                                i += 1
                                continue
                            
                            if work_minutes > 0:
                                work_sessions.append({
                                    "start_date": current_start["date"],
                                    "start_time": current_start["time"],
                                    "end_date": ts["date"],
                                    "end_time": ts["time"],
                                    "work_minutes": work_minutes,
                                    "original_start_status": current_start.get("original_status", ""),
                                    "original_end_status": ts.get("original_status", "")
                                })
                            
                            current_start = None
                    except Exception as e:
                        print(f"計算エラー: {user_name} - {e}")
                        current_start = None
                    
                    i += 1
            
            # 未完了のセッションがある場合
            if current_start:
                print(f"情報: {user_name} - 未完了のセッション {current_start['date']} {current_start['time']}")
            
            # 勤務セッションを集計
            for session in work_sessions:
                date = session["start_date"]
                work_minutes = session["work_minutes"]
                
                # 日別集計
                if date not in user_time_data[user_name]["daily_hours"]:
                    user_time_data[user_name]["daily_hours"][date] = {
                        "hours": 0,
                        "minutes": 0,
                        "formatted": "",
                        "work_minutes": 0
                    }
                
                user_time_data[user_name]["daily_hours"][date]["work_minutes"] += work_minutes
                
                # 月別集計
                month_key = date[:7]  # YYYY/MM形式
                if month_key not in user_time_data[user_name]["monthly_hours"]:
                    user_time_data[user_name]["monthly_hours"][month_key] = {
                        "hours": 0,
                        "minutes": 0,
                        "formatted": "",
                        "work_minutes": 0
                    }
                
                user_time_data[user_name]["monthly_hours"][month_key]["work_minutes"] += work_minutes
                
                # レコードを追加
                user_time_data[user_name]["records"].append(session)
            
            # 合計を計算
            total_minutes = sum(session["work_minutes"] for session in work_sessions)
            total_hours = total_minutes // 60
            remaining_minutes = total_minutes % 60
            user_time_data[user_name]["total_minutes"] = remaining_minutes  # 60分未満の端数
            user_time_data[user_name]["total_hours"] = total_hours  # 整数時間
            user_time_data[user_name]["total_time_formatted"] = f"{total_hours}時間{remaining_minutes}分"
            user_time_data[user_name]["work_days"] = len(user_time_data[user_name]["daily_hours"])
            
            # フォーマット済み文字列を生成
            # 日別
            for date, data in user_time_data[user_name]["daily_hours"].items():
                minutes = data["work_minutes"]
                hours = minutes // 60
                mins = minutes % 60
                data["hours"] = hours
                data["minutes"] = mins
                data["formatted"] = f"{hours}時間{mins}分"
            
            # 月別
            for month, data in user_time_data[user_name]["monthly_hours"].items():
                minutes = data["work_minutes"]
                hours = minutes // 60
                mins = minutes % 60
                data["hours"] = hours
                data["minutes"] = mins
                data["formatted"] = f"{hours}時間{mins}分"
        
        return user_time_data
    
    def get_monthly_hours_by_user(self, top_users: int = 5, months: int = 12) -> Dict[str, Any]:
        """月別のユーザー別勤務時間を取得"""
        user_time_data = self.get_user_time_data()
        
        # 総勤務時間でソート
        sorted_users = sorted(
            user_time_data.items(),
            key=lambda x: x[1]["total_minutes"],
            reverse=True
        )[:top_users]
        
        # 月のリストを生成
        from datetime import datetime, timedelta
        end_date = datetime.now()
        start_date = end_date - timedelta(days=months * 30)
        
        month_list = []
        current = start_date
        while current <= end_date:
            month_key = current.strftime("%Y/%m")
            month_list.append(month_key)
            # 次の月へ
            if current.month == 12:
                current = current.replace(year=current.year + 1, month=1)
            else:
                current = current.replace(month=current.month + 1)
        
        # グラフ用データを構築
        chart_data = []
        for month_key in month_list:
            month_data = {"month": month_key}
            
            for user_name, user_data in sorted_users:
                if month_key in user_data["monthly_hours"]:
                    hours = user_data["monthly_hours"][month_key]["hours"]
                    minutes = user_data["monthly_hours"][month_key]["minutes"]
                    total_hours = hours + minutes / 60
                else:
                    total_hours = 0
                    hours = 0
                    minutes = 0
                
                month_data[user_name] = round(total_hours, 2)
                month_data[f"{user_name}_formatted"] = f"{hours}時間{minutes}分"
            
            chart_data.append(month_data)
        
        # ユーザー設定を生成
        user_configs = {}
        colors = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", 
                  "#06B6D4", "#EC4899", "#14B8A6", "#F97316", "#84CC16"]
        
        for i, (user_name, user_data) in enumerate(sorted_users):
            total_min = user_data["total_minutes"]
            total_h = total_min // 60
            total_m = total_min % 60
            
            user_configs[user_name] = {
                "label": user_name,
                "color": colors[i % len(colors)],
                "total": f"{total_h}時間{total_m}分"
            }
        
        return {
            "success": True,
            "chart_data": chart_data,
            "user_configs": user_configs,
            "period": f"{month_list[0]} 〜 {month_list[-1]}",
            "timestamp": datetime.now().isoformat()
        }

# シングルトンインスタンス
csv_loader = CSVLoader()

# アプリケーション起動時にデータを読み込む
csv_loader.load_data()