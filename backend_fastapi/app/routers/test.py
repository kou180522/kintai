from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any
import csv
import io
import os
from app.services.csv_loader import csv_loader

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
    テストAPIエンドポイント - ユーザー情報と稼働時間データを返す
    """
    try:
        # ユーザー情報を取得
        users = csv_loader.get_users()
        attendance_records = csv_loader.get_attendance_records()
        
        # ユーザーごとの時間データを取得
        user_time_data = csv_loader.get_user_time_data()
        
        # 全ユーザーの時間データを稼働時間でソート
        sorted_time_data = sorted(
            user_time_data.items(),
            key=lambda x: x[1]["total_hours"] * 60 + x[1]["total_minutes"],
            reverse=True
        )
        
        # 全ユーザーの時間データを作成（日別・月別データも含む）
        time_summary = []
        for user_name, data in sorted_time_data:
            # 全員のデータを含める（稼働時間0の人も含む）
            time_summary.append({
                "name": user_name,
                "total_time": data["total_time_formatted"],
                "work_days": data["work_days"],
                "total_hours": data["total_hours"],
                "total_minutes": data["total_minutes"],
                "daily_hours": data.get("daily_hours", {}),
                "monthly_hours": data.get("monthly_hours", {})
            })
        
        # 統計情報を計算
        total_hours = sum(data["total_hours"] for data in user_time_data.values())
        total_minutes = sum(data["total_minutes"] for data in user_time_data.values())
        total_hours += total_minutes // 60
        total_minutes = total_minutes % 60
        
        active_users = len([u for u in user_time_data.values() 
                           if u["total_hours"] > 0 or u["total_minutes"] > 0])
        
        return {
            "success": True,
            "message": f"テストAPI正常動作中 - {len(users)}人のユーザー情報と稼働時間データを取得",
            "method": "GET",
            "timestamp": datetime.now().isoformat(),
            "data": {
                "users": users,  # 全ユーザー情報
                "total_users": len(users),
                "total_records": len(attendance_records),
                "time_data": {
                    "summary": time_summary,  # 全15人の稼働時間データ
                    "statistics": {
                        "total_work_time": f"{total_hours}時間{total_minutes}分",
                        "active_users": active_users,
                        "total_users": len(user_time_data)
                    }
                },
                "csv_file": "attendance_data.csv"
            },
            "serverTime": datetime.now().isoformat(),
            "processedBy": "FastAPI バックエンドサーバー"
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