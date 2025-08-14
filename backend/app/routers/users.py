"""
ユーザー管理用APIエンドポイント
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import csv
import os
import uuid

router = APIRouter()

# CSVファイルのパス
def get_csv_path():
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    project_root = os.path.dirname(backend_dir)
    return os.path.join(project_root, "data", "attendance_data.csv")

class UserCreate(BaseModel):
    name: str
    department: Optional[str] = ""
    position: Optional[str] = ""

class UserResponse(BaseModel):
    id: str
    name: str
    department: str
    position: str
    total_hours: int
    total_minutes: int
    work_days: int

@router.get("/users")
async def get_users():
    """
    全ユーザーの一覧を取得
    """
    try:
        from app.services.csv_loader import csv_loader
        
        # ユーザー時間データを取得
        user_time_data = csv_loader.get_user_time_data()
        
        users = []
        for idx, (user_name, data) in enumerate(user_time_data.items()):
            # ユーザー基本情報を取得
            user_info = csv_loader.get_user_by_name(user_name)
            
            users.append({
                "id": user_info["employee_id"] if user_info else f"user_{idx+1:03d}",
                "name": user_name,
                "department": user_info["department"] if user_info else "未設定",
                "position": user_info["position"] if user_info else "一般社員",
                "total_hours": data["total_hours"],
                "total_minutes": data["total_minutes"],
                "work_days": data["work_days"]
            })
        
        return {
            "success": True,
            "users": users,
            "total": len(users)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"ユーザー情報の取得中にエラーが発生しました: {str(e)}"
        )

@router.post("/users")
async def create_user(user: UserCreate):
    """
    新規ユーザーを追加
    """
    try:
        csv_path = get_csv_path()
        
        # 新しいユーザーIDを生成
        new_user_id = f"user_{uuid.uuid4().hex[:8]}"
        
        # 現在の日時を取得
        current_datetime = datetime.now().strftime("%Y/%m/%d %H:%M")
        
        # CSVファイルに新規ユーザーを追加（初期エントリとして）
        with open(csv_path, 'a', encoding='utf-8', newline='') as file:
            writer = csv.writer(file)
            # 初期エントリとして登録のみ（打刻なし）
            writer.writerow([
                current_datetime.split()[0],  # 日付
                current_datetime.split()[1],  # 時刻
                user.name,                    # ユーザー名
                "登録",                        # ステータス
                user.department or "未設定",   # 部署
                user.position or "一般社員"    # 役職
            ])
        
        # データを再読み込み
        from app.services.csv_loader import csv_loader
        csv_loader.reload_data()
        
        return {
            "success": True,
            "message": f"ユーザー '{user.name}' を追加しました",
            "user_id": new_user_id
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"ユーザーの追加中にエラーが発生しました: {str(e)}"
        )

@router.delete("/users/{user_name}")
async def delete_user(user_name: str):
    """
    ユーザーを削除（CSVから該当ユーザーのすべてのエントリを削除）
    """
    try:
        csv_path = get_csv_path()
        
        # CSVファイルを読み込み
        rows = []
        deleted_count = 0
        
        with open(csv_path, 'r', encoding='utf-8') as file:
            reader = csv.reader(file)
            header = next(reader, None)
            if header:
                rows.append(header)
            
            for row in reader:
                # ユーザー名が一致しない行のみ保持
                if len(row) > 2 and row[2] != user_name:
                    rows.append(row)
                else:
                    deleted_count += 1
        
        if deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"ユーザー '{user_name}' が見つかりません"
            )
        
        # CSVファイルを書き直し
        with open(csv_path, 'w', encoding='utf-8', newline='') as file:
            writer = csv.writer(file)
            writer.writerows(rows)
        
        # データを再読み込み
        from app.services.csv_loader import csv_loader
        csv_loader.reload_data()
        
        return {
            "success": True,
            "message": f"ユーザー '{user_name}' を削除しました",
            "deleted_entries": deleted_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"ユーザーの削除中にエラーが発生しました: {str(e)}"
        )

@router.put("/users/{user_id}")
async def update_user(user_id: str, user: UserCreate):
    """
    ユーザー情報を更新
    """
    try:
        # 実装予定：ユーザー情報の更新
        return {
            "success": True,
            "message": f"ユーザー情報を更新しました",
            "user_id": user_id
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"ユーザー情報の更新中にエラーが発生しました: {str(e)}"
        )