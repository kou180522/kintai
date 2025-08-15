"""
CSVデータローダー（改良版）
開始と終了の差分を計算してから調整時間を適用
"""
import csv
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple, Optional
from collections import defaultdict
import re

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
    
    def parse_specific_time_from_message(self, message: str) -> Optional[str]:
        """
        メッセージから特定時刻を抽出
        例: "s18:00", "f19:30", "s 18:00" など
        返り値: 時刻文字列（HH:MM形式）、特定時刻がない場合はNone
        """
        if not message:
            return None
            
        message_lower = message.lower().strip()
        
        # 特定時刻のパターンをチェック（s/fの後に時刻）
        match = re.search(r'[sf]?\s*(\d{1,2}):(\d{2})', message_lower)
        if match:
            hour = int(match.group(1))
            minute = int(match.group(2))
            
            # 時刻の妥当性チェック
            if 0 <= hour <= 23 and 0 <= minute <= 59:
                specific_time = f"{hour}:{minute:02d}"
                print(f"特定時刻検出: {message} → {specific_time}")
                return specific_time
        
        return None
    
    def parse_adjustment_from_message(self, message: str) -> Optional[int]:
        """
        メッセージから調整時間（分）を抽出
        例: "s+60", "f-30", "s + 60" など
        返り値: 調整分数（正または負）、調整情報がない場合はNone
        """
        if not message:
            return None
            
        message_lower = message.lower().strip()
        
        # 特定時刻指定がある場合は調整時間として扱わない
        if self.parse_specific_time_from_message(message):
            return None
        
        # +/- の調整パターンをチェック（スペースあり・なし両対応）
        match = re.search(r'[sf]?\s*([\+\-])\s*(\d+)', message_lower)
        if match:
            sign = match.group(1)
            value = int(match.group(2))
            adjustment_minutes = value if sign == '+' else -value
            print(f"調整時間検出: {message} → {adjustment_minutes}分")
            return adjustment_minutes
            
        return None
    
    def parse_status(self, status: str, message: str) -> str:
        """
        ステータスを正規化（開始/終了）
        """
        if not status:
            return None
            
        status_lower = status.lower().strip()
        
        # メッセージからもステータスを推測
        if message:
            message_lower = message.lower()
            if message_lower.startswith('s'):
                return "start"
            elif message_lower.startswith('f'):
                return "end"
        
        # 基本ステータスの判定
        if status_lower in ["開始", "s", "start"]:
            return "start"
        elif status_lower in ["終了", "f", "finish", "end"]:
            return "end"
        else:
            return None
    
    def get_user_time_data(self) -> Dict[str, Any]:
        """各ユーザーの時間データを集計（改良版：差分計算後に調整適用）"""
        user_time_data = {}
        user_all_timestamps = defaultdict(list)
        
        # 全レコードをユーザー別に収集
        for record in self.attendance_records:
            user_name = record.get("user", "")
            if not user_name:
                continue
                
            date = record.get("date", "")
            time = record.get("time", "")
            status = record.get("status", "")
            message = record.get("message", "")
            
            # ステータスを正規化
            base_status = self.parse_status(status, message)
            if not base_status:
                continue
            
            # 特定時刻の指定があるかチェック
            specific_time = self.parse_specific_time_from_message(message)
            
            # 特定時刻がある場合はそれを使用、ない場合は記録時刻を使用
            if specific_time:
                actual_time = specific_time
                adjustment_minutes = None  # 特定時刻指定の場合は調整時間なし
            else:
                actual_time = time
                # 調整時間を取得（特定時刻がない場合のみ）
                adjustment_minutes = self.parse_adjustment_from_message(message)
            
            # タイムスタンプを記録
            # 時刻を適切にパディング（例: "9:31" -> "09:31"）
            time_parts = actual_time.split(":")
            if len(time_parts) == 2:
                hour = time_parts[0].zfill(2)  # 時間を2桁にパディング
                minute = time_parts[1].zfill(2)  # 分を2桁にパディング
                formatted_time = f"{hour}:{minute}"
            else:
                formatted_time = actual_time
            
            user_all_timestamps[user_name].append({
                "date": date,
                "time": actual_time,  # 特定時刻または記録時刻
                "status": base_status,
                "adjustment_minutes": adjustment_minutes,  # 調整時間を保存
                "original_status": status,
                "message": message,
                "datetime_str": f"{date} {formatted_time}"  # ソート用にフォーマット済み時刻を使用
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
                        print(f"警告: {user_name} - 連続する開始時刻を検出、最初の開始時刻を無視")
                    current_start = ts
                    i += 1
                    
                elif ts["status"] == "end":
                    if not current_start:
                        # 開始時刻なしで終了時刻が来た場合
                        print(f"警告: {user_name} - 開始時刻なしの終了 {ts['date']} {ts['time']}")
                        i += 1
                        continue
                    
                    # 基本の勤務時間を計算（調整前）
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
                                        print(f"エラー: {user_name} - 日付逆転")
                                        current_start = None
                                        i += 1
                                        continue
                                except:
                                    pass
                            elif end_total_min < start_total_min:
                                # 同日でも終了が開始より前 = 日跨ぎ
                                end_total_min += 24 * 60
                            
                            # 基本の勤務時間（調整前）
                            base_work_minutes = end_total_min - start_total_min
                            
                            # ここで調整時間を適用
                            # 開始時の調整：マイナスで勤務時間増加、プラスで勤務時間減少
                            # 終了時の調整：プラスで勤務時間増加、マイナスで勤務時間減少
                            adjusted_work_minutes = base_work_minutes
                            
                            if current_start["adjustment_minutes"] is not None:
                                # 開始時の調整（s+60 = 60分早く始めた = 勤務時間+60分）
                                adjusted_work_minutes += current_start["adjustment_minutes"]
                                print(f"開始時調整適用: {user_name} {current_start['date']} - 基本{base_work_minutes}分 + 調整{current_start['adjustment_minutes']}分")
                            
                            if ts["adjustment_minutes"] is not None:
                                # 終了時の調整（f+30 = 30分長く働いた = 勤務時間+30分）
                                adjusted_work_minutes += ts["adjustment_minutes"]
                                print(f"終了時調整適用: {user_name} {ts['date']} - 現在{adjusted_work_minutes-ts['adjustment_minutes']}分 + 調整{ts['adjustment_minutes']}分")
                            
                            # 異常値チェック（24時間超えは無効）
                            if adjusted_work_minutes > 24 * 60:
                                print(f"エラー: {user_name} - 24時間超過を検出 = {adjusted_work_minutes}分")
                                current_start = None
                                i += 1
                                continue
                            
                            if adjusted_work_minutes > 0:
                                work_sessions.append({
                                    "start_date": current_start["date"],
                                    "start_time": current_start["time"],
                                    "end_date": ts["date"],
                                    "end_time": ts["time"],
                                    "base_work_minutes": base_work_minutes,  # 調整前
                                    "work_minutes": adjusted_work_minutes,    # 調整後
                                    "start_adjustment": current_start["adjustment_minutes"],
                                    "end_adjustment": ts["adjustment_minutes"],
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
            key=lambda x: x[1]["total_hours"] * 60 + x[1]["total_minutes"],
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
            total_h = user_data["total_hours"]
            total_m = user_data["total_minutes"]
            
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