import csv
import io
import os
from typing import List, Dict, Any
from datetime import datetime

class CSVDataLoader:
    """CSVファイルからユーザー情報と勤怠データを読み込むクラス"""
    
    def __init__(self):
        self.csv_file_path = "attendance_data.csv"
        self.users = []
        self.attendance_records = []
        self.last_loaded = None
        self.load_data()
    
    def load_data(self):
        """CSVファイルからデータを読み込む"""
        try:
            if os.path.exists(self.csv_file_path):
                with open(self.csv_file_path, 'r', encoding='utf-8') as file:
                    csv_content = file.read()
                    csv_reader = csv.DictReader(io.StringIO(csv_content))
                    
                    # データをリセット
                    unique_users = {}
                    self.attendance_records = []
                    
                    for row in csv_reader:
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
    
    def get_user_time_data(self) -> Dict[str, Any]:
        """各ユーザーの時間データを集計（日跨ぎ対応、s/f打刻ペアから直接計算）"""
        user_time_data = {}
        user_all_timestamps = {}  # ユーザー別の全タイムスタンプ（時系列順）
        
        # 全レコードをユーザー別に収集
        for record in self.attendance_records:
            user_name = record.get("user", "")
            if not user_name:
                continue
                
            date = record.get("date", "")
            time = record.get("time", "")
            status = record.get("status", "").lower()
            
            if user_name not in user_all_timestamps:
                user_all_timestamps[user_name] = []
            
            # タイムスタンプを記録（開始はs/開始、終了はf/終了として統一）
            if status in ["開始", "s", "start"]:
                # 時刻を0埋めして正しくソートできるようにする
                time_parts = time.split(":")
                if len(time_parts) >= 2:
                    formatted_time = f"{int(time_parts[0]):02d}:{int(time_parts[1]):02d}"
                else:
                    formatted_time = time
                
                user_all_timestamps[user_name].append({
                    "date": date,
                    "time": time,
                    "status": "start",
                    "datetime_str": f"{date} {formatted_time}"  # ソート用（時刻を0埋め）
                })
            elif status in ["終了", "f", "finish", "end"]:
                # 時刻を0埋めして正しくソートできるようにする
                time_parts = time.split(":")
                if len(time_parts) >= 2:
                    formatted_time = f"{int(time_parts[0]):02d}:{int(time_parts[1]):02d}"
                else:
                    formatted_time = time
                    
                user_all_timestamps[user_name].append({
                    "date": date,
                    "time": time,
                    "status": "end",
                    "datetime_str": f"{date} {formatted_time}"  # ソート用（時刻を0埋め）
                })
        
        # 各ユーザーの勤務時間を計算（日跨ぎ対応）
        for user_name, timestamps in user_all_timestamps.items():
            if user_name not in user_time_data:
                user_time_data[user_name] = {
                    "name": user_name,
                    "total_hours": 0,
                    "total_minutes": 0,
                    "work_days": 0,
                    "records": [],
                    "daily_hours": {},  # 日別勤務時間
                    "monthly_hours": {}  # 月別勤務時間
                }
            
            # タイムスタンプを時系列順にソート
            sorted_timestamps = sorted(timestamps, key=lambda x: x["datetime_str"])
            
            # s（開始）とf（終了）のペアを作成して計算
            current_start = None
            work_sessions = []  # 勤務セッション（開始日、開始時刻、終了日、終了時刻、勤務時間）
            
            for ts in sorted_timestamps:
                if ts["status"] == "start":
                    # 新しい開始時刻を記録
                    current_start = ts
                elif ts["status"] == "end" and current_start:
                    # 開始時刻がある場合、終了時刻とペアにして計算
                    try:
                        # 時刻をパース（HH:MM形式を想定）
                        start_parts = current_start["time"].split(":")
                        end_parts = ts["time"].split(":")
                        
                        if len(start_parts) >= 2 and len(end_parts) >= 2:
                            start_hour = int(start_parts[0])
                            start_min = int(start_parts[1])
                            end_hour = int(end_parts[0])
                            end_min = int(end_parts[1])
                            
                            # 日付を比較して日跨ぎを判定
                            start_date = current_start["date"]
                            end_date = ts["date"]
                            
                            # 分単位で計算
                            start_total_min = start_hour * 60 + start_min
                            end_total_min = end_hour * 60 + end_min
                            
                            # 日跨ぎの場合
                            if start_date != end_date:
                                # 日付が異なる場合は日跨ぎとして処理
                                # 簡易的に翌日として計算（実際の日数差は考慮しない）
                                end_total_min += 24 * 60
                            elif end_total_min < start_total_min:
                                # 同じ日付でも終了時刻が開始時刻より前の場合（データエラー）
                                # この場合も日跨ぎとして処理
                                end_total_min += 24 * 60
                            
                            work_minutes = end_total_min - start_total_min
                            if work_minutes > 0:
                                work_sessions.append({
                                    "start_date": start_date,
                                    "start_time": current_start["time"],
                                    "end_date": end_date,
                                    "end_time": ts["time"],
                                    "work_minutes": work_minutes
                                })
                            
                            # ペアが完成したらリセット
                            current_start = None
                    except Exception as e:
                        print(f"時刻計算エラー: {user_name} {current_start['date']} {current_start['time']}-{ts['date']} {ts['time']}: {e}")
                        current_start = None
            
            # 勤務セッションを日別に集計
            for session in work_sessions:
                # 勤務時間は開始日に計上
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
                
                # 月別集計用のキーを作成（YYYY/MM形式）
                if "/" in date:
                    month_key = "/".join(date.split("/")[:2])
                    if month_key not in user_time_data[user_name]["monthly_hours"]:
                        user_time_data[user_name]["monthly_hours"][month_key] = {
                            "total_minutes": 0,
                            "work_days": 0
                        }
                    user_time_data[user_name]["monthly_hours"][month_key]["total_minutes"] += work_minutes
            
            # 日別データを整形し、勤務日数をカウント
            for date, day_data in user_time_data[user_name]["daily_hours"].items():
                daily_minutes = day_data["work_minutes"]
                if daily_minutes > 0:
                    daily_hours = daily_minutes // 60
                    daily_mins = daily_minutes % 60
                    user_time_data[user_name]["daily_hours"][date]["hours"] = daily_hours
                    user_time_data[user_name]["daily_hours"][date]["minutes"] = daily_mins
                    user_time_data[user_name]["daily_hours"][date]["formatted"] = f"{daily_hours}時間{daily_mins}分"
                    
                    # 総計に加算
                    user_time_data[user_name]["total_minutes"] += daily_minutes
                    user_time_data[user_name]["work_days"] += 1
                    
                    # 月別の勤務日数をカウント
                    if "/" in date:
                        month_key = "/".join(date.split("/")[:2])
                        if month_key in user_time_data[user_name]["monthly_hours"]:
                            user_time_data[user_name]["monthly_hours"][month_key]["work_days"] += 1
        
        # 全ユーザーの分を時間に変換し、月別データもフォーマット
        for user_name in user_time_data:
            # 総計の変換
            total_minutes = user_time_data[user_name]["total_minutes"]
            user_time_data[user_name]["total_hours"] = total_minutes // 60
            user_time_data[user_name]["total_minutes"] = total_minutes % 60
            user_time_data[user_name]["total_time_formatted"] = f"{user_time_data[user_name]['total_hours']}時間{user_time_data[user_name]['total_minutes']}分"
            
            # 月別データのフォーマット
            for month_key in user_time_data[user_name]["monthly_hours"]:
                month_data = user_time_data[user_name]["monthly_hours"][month_key]
                month_total_minutes = month_data["total_minutes"]
                month_hours = month_total_minutes // 60
                month_mins = month_total_minutes % 60
                month_data["hours"] = month_hours
                month_data["minutes"] = month_mins
                month_data["formatted"] = f"{month_hours}時間{month_mins}分"
        
        # 存在しないユーザーも含めて全ユーザーを確保
        for user in self.users:
            if user["name"] not in user_time_data:
                user_time_data[user["name"]] = {
                    "name": user["name"],
                    "total_hours": 0,
                    "total_minutes": 0,
                    "work_days": 0,
                    "records": [],
                    "daily_hours": {},
                    "monthly_hours": {},
                    "total_time_formatted": "0時間0分"
                }
        
        return user_time_data
    
    def reload_data(self):
        """データを再読み込み"""
        print("CSVデータを再読み込みしています...")
        return self.load_data()

# シングルトンインスタンスを作成
csv_loader = CSVDataLoader()