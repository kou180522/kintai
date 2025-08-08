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
    
    def reload_data(self):
        """データを再読み込み"""
        print("CSVデータを再読み込みしています...")
        return self.load_data()

# シングルトンインスタンスを作成
csv_loader = CSVDataLoader()