"""
Google スプレッドシートとのユーザー同期サービス
"""
import os
import json
import csv
from typing import List, Dict, Any
from datetime import datetime
import httpx
from dotenv import load_dotenv

load_dotenv()

class GoogleSheetsSync:
    def __init__(self):
        # Google Sheets APIの設定
        self.spreadsheet_id = os.getenv("GOOGLE_SPREADSHEET_ID", "")
        self.api_key = os.getenv("GOOGLE_API_KEY", "")
        self.sheet_name = os.getenv("SHEET_NAME", "ユーザーマスタ")
        
        # ファイルパス
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        project_root = os.path.dirname(backend_dir)
        self.csv_path = os.path.join(project_root, "data", "attendance_data.csv")
        self.users_json_path = os.path.join(project_root, "data", "users.json")
        
    async def fetch_sheet_data(self) -> List[Dict[str, Any]]:
        """
        Google スプレッドシートからデータを取得
        公開されているスプレッドシートの場合はAPIキーのみで取得可能
        """
        try:
            # Google Sheets API v4のURL
            range_param = f"{self.sheet_name}!A:F"  # A列からF列まで取得
            url = f"https://sheets.googleapis.com/v4/spreadsheets/{self.spreadsheet_id}/values/{range_param}"
            
            params = {
                "key": self.api_key,
                "majorDimension": "ROWS",
                "valueRenderOption": "FORMATTED_VALUE"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    values = data.get("values", [])
                    
                    if not values:
                        return []
                    
                    # 最初の行をヘッダーとして扱う
                    headers = values[0]
                    users = []
                    
                    for row in values[1:]:  # 2行目以降がデータ
                        if row and row[0]:  # 空行をスキップ
                            user_dict = {}
                            for i, header in enumerate(headers):
                                user_dict[header] = row[i] if i < len(row) else ""
                            users.append(user_dict)
                    
                    return users
                else:
                    print(f"スプレッドシート取得エラー: {response.status_code}")
                    return []
                    
        except Exception as e:
            print(f"スプレッドシート取得エラー: {str(e)}")
            return []
    
    def load_existing_users(self) -> Dict[str, Dict[str, Any]]:
        """
        既存のユーザー情報を読み込み
        """
        if os.path.exists(self.users_json_path):
            try:
                with open(self.users_json_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                return {}
        return {}
    
    def save_users(self, users: Dict[str, Dict[str, Any]]):
        """
        ユーザー情報をJSONファイルに保存
        """
        os.makedirs(os.path.dirname(self.users_json_path), exist_ok=True)
        with open(self.users_json_path, 'w', encoding='utf-8') as f:
            json.dump(users, f, ensure_ascii=False, indent=2)
    
    async def sync_users(self) -> Dict[str, Any]:
        """
        スプレッドシートとローカルデータを同期
        """
        try:
            # スプレッドシートからデータを取得
            sheet_users = await self.fetch_sheet_data()
            
            if not sheet_users:
                return {
                    "success": False,
                    "message": "スプレッドシートからデータを取得できませんでした"
                }
            
            # 既存のユーザー情報を読み込み
            existing_users = self.load_existing_users()
            
            # 新規追加・更新されたユーザー
            added_users = []
            updated_users = []
            
            # スプレッドシートのユーザーを処理
            current_users = {}
            for sheet_user in sheet_users:
                # スプレッドシートの列マッピング
                # 例: 名前, 部署, 役職, メールアドレス, 社員番号, ステータス
                user_name = sheet_user.get("名前", "").strip()
                
                if not user_name:
                    continue
                
                user_info = {
                    "name": user_name,
                    "department": sheet_user.get("部署", "未設定"),
                    "position": sheet_user.get("役職", "一般社員"),
                    "email": sheet_user.get("メールアドレス", f"{user_name.replace(' ', '.').lower()}@example.com"),
                    "employee_id": sheet_user.get("社員番号", f"EMP_{len(current_users)+1:04d}"),
                    "status": sheet_user.get("ステータス", "有効"),
                    "created_at": existing_users.get(user_name, {}).get("created_at", datetime.now().isoformat()),
                    "updated_at": datetime.now().isoformat()
                }
                
                # ステータスが「有効」のユーザーのみ追加
                if user_info["status"] == "有効":
                    current_users[user_name] = user_info
                    
                    if user_name not in existing_users:
                        added_users.append(user_name)
                        # 新規ユーザーをCSVに初期エントリとして追加
                        await self.add_user_to_csv(user_info)
                    elif existing_users[user_name] != user_info:
                        updated_users.append(user_name)
            
            # 削除されたユーザー（スプレッドシートにないか、ステータスが無効）
            deleted_users = []
            for user_name in existing_users:
                if user_name not in current_users:
                    deleted_users.append(user_name)
            
            # ユーザー情報を保存
            self.save_users(current_users)
            
            # CSVローダーをリロード
            from app.services.csv_loader import csv_loader
            csv_loader.reload_data()
            
            return {
                "success": True,
                "message": "同期完了",
                "summary": {
                    "total_users": len(current_users),
                    "added": added_users,
                    "updated": updated_users,
                    "deleted": deleted_users,
                    "added_count": len(added_users),
                    "updated_count": len(updated_users),
                    "deleted_count": len(deleted_users)
                },
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"同期エラー: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
    
    async def add_user_to_csv(self, user_info: Dict[str, Any]):
        """
        新規ユーザーをCSVに追加（初期エントリ）
        """
        try:
            with open(self.csv_path, 'a', encoding='utf-8', newline='') as file:
                writer = csv.writer(file)
                # 登録日時のエントリを追加
                writer.writerow([
                    datetime.now().strftime("%Y/%m/%d"),  # 日付
                    datetime.now().strftime("%H:%M"),     # 時刻
                    user_info["name"],                     # ユーザー名
                    "登録",                                # ステータス
                    f"新規登録: {user_info['department']} - {user_info['position']}",  # メッセージ
                    "",                                    # 合計稼働時間
                    ""                                     # 月次稼働時間
                ])
        except Exception as e:
            print(f"CSVへのユーザー追加エラー: {str(e)}")
    
    def get_user_info(self, user_name: str) -> Dict[str, Any]:
        """
        特定ユーザーの情報を取得
        """
        users = self.load_existing_users()
        return users.get(user_name, None)
    
    def get_all_users(self) -> List[Dict[str, Any]]:
        """
        全ユーザーの情報を取得
        """
        users = self.load_existing_users()
        return list(users.values())

# シングルトンインスタンス
sheets_sync = GoogleSheetsSync()