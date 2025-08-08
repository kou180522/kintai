from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any
import csv
import io
import os

router = APIRouter()

class TestRequest(BaseModel):
    timestamp: Optional[str] = None
    message: Optional[str] = None

class TestResponse(BaseModel):
    success: bool
    message: str
    method: Optional[str] = None
    timestamp: Optional[str] = None
    received: Optional[dict] = None
    serverTime: Optional[str] = None
    processedBy: Optional[str] = None
    data: Optional[dict] = None

@router.get("/")
async def get_test():
    """
    テストAPIエンドポイント - CSVファイルからユーザー情報を読み込んで返す
    """
    csv_file_path = "attendance_data.csv"
    
    try:
        # CSVファイルを読み込み
        if os.path.exists(csv_file_path):
            with open(csv_file_path, 'r', encoding='utf-8') as file:
                csv_content = file.read()
                csv_reader = csv.DictReader(io.StringIO(csv_content))
                
                # 勤怠データから一意のユーザーを抽出
                unique_users = {}
                total_records = 0
                
                for row in csv_reader:
                    total_records += 1
                    user_name = row.get('ユーザー', row.get('user', row.get('名前', '')))
                    
                    # ユーザー名が存在する場合、ユーザー情報を記録
                    if user_name and user_name.strip():
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
                users_list = list(unique_users.values())
                
                return {
                    "success": True,
                    "message": f"テストAPI正常動作中 - CSVから{len(users_list)}人のユーザー情報を取得",
                    "method": "GET",
                    "timestamp": datetime.now().isoformat(),
                    "data": {
                        "users": users_list[:5],  # 最初の5人のみ表示
                        "total_users": len(users_list),
                        "total_records": total_records,
                        "csv_file": csv_file_path
                    },
                    "serverTime": datetime.now().isoformat(),
                    "processedBy": "FastAPI バックエンドサーバー"
                }
        else:
            # CSVファイルが存在しない場合
            return {
                "success": True,
                "message": "テストAPIエンドポイントは正常に動作しています（CSVファイルなし）",
                "method": "GET",
                "timestamp": datetime.now().isoformat(),
                "data": {
                    "users": [],
                    "total_users": 0,
                    "note": "CSVファイルが見つかりません"
                }
            }
            
    except Exception as e:
        return {
            "success": False,
            "message": f"エラーが発生しました: {str(e)}",
            "method": "GET",
            "timestamp": datetime.now().isoformat()
        }

@router.post("/", response_model=TestResponse)
async def post_test(request: TestRequest):
    print(f"テストAPI - 受信データ: {request.dict()}")
    
    return TestResponse(
        success=True,
        message="POSTリクエストを正常に処理しました",
        received={
            "timestamp": request.timestamp,
            "message": request.message
        },
        serverTime=datetime.now().isoformat(),
        processedBy="FastAPI バックエンドサーバー"
    )

@router.get("/{test_id}", response_model=TestResponse)
async def get_test_by_id(test_id: str):
    return TestResponse(
        success=True,
        message="IDによるテストデータ取得",
        data={
            "id": test_id,
            "name": f"テストデータ {test_id}",
            "createdAt": datetime.now().isoformat()
        }
    )