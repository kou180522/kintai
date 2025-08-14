from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.services.csv_loader import csv_loader

router = APIRouter()

class UserTimeData(BaseModel):
    name: str
    total_hours: int
    total_minutes: int
    total_time_formatted: str
    work_days: int
    records_count: int

class TimeDataResponse(BaseModel):
    success: bool
    total_users: int
    users: List[UserTimeData]
    timestamp: str

class UserDetailTimeData(BaseModel):
    name: str
    total_hours: int
    total_minutes: int
    total_time_formatted: str
    work_days: int
    recent_records: List[Dict[str, Any]]

@router.get("/summary", response_model=TimeDataResponse)
async def get_time_summary():
    """
    全ユーザーの時間データサマリーを取得
    """
    try:
        # ユーザーごとの時間データを取得
        user_time_data = csv_loader.get_user_time_data()
        
        # レスポンス用にデータを整形
        users_list = []
        for user_name, data in user_time_data.items():
            users_list.append(UserTimeData(
                name=user_name,
                total_hours=data["total_hours"],
                total_minutes=data["total_minutes"],
                total_time_formatted=data["total_time_formatted"],
                work_days=data["work_days"],
                records_count=len(data["records"])
            ))
        
        # 総稼働時間でソート（降順）
        users_list.sort(key=lambda x: x.total_hours * 60 + x.total_minutes, reverse=True)
        
        return TimeDataResponse(
            success=True,
            total_users=len(users_list),
            users=users_list,
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"時間データの取得中にエラーが発生しました: {str(e)}"
        )

@router.get("/user/{user_name}")
async def get_user_time_detail(user_name: str):
    """
    特定ユーザーの詳細な時間データを取得
    """
    try:
        # ユーザーごとの時間データを取得
        user_time_data = csv_loader.get_user_time_data()
        
        if user_name not in user_time_data:
            raise HTTPException(
                status_code=404,
                detail=f"ユーザー '{user_name}' のデータが見つかりません"
            )
        
        data = user_time_data[user_name]
        
        # 最新10件のレコードを取得
        recent_records = data["records"][-10:] if len(data["records"]) > 10 else data["records"]
        
        return {
            "success": True,
            "user_data": UserDetailTimeData(
                name=user_name,
                total_hours=data["total_hours"],
                total_minutes=data["total_minutes"],
                total_time_formatted=data["total_time_formatted"],
                work_days=data["work_days"],
                recent_records=recent_records
            ),
            "total_records": len(data["records"]),
            "timestamp": datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"ユーザーデータの取得中にエラーが発生しました: {str(e)}"
        )

@router.get("/statistics")
async def get_time_statistics():
    """
    時間データの統計情報を取得
    """
    try:
        # ユーザーごとの時間データを取得
        user_time_data = csv_loader.get_user_time_data()
        
        if not user_time_data:
            return {
                "success": True,
                "message": "データがありません",
                "statistics": {}
            }
        
        # 統計情報を計算
        total_hours = sum(data["total_hours"] for data in user_time_data.values())
        total_minutes = sum(data["total_minutes"] for data in user_time_data.values())
        total_hours += total_minutes // 60
        total_minutes = total_minutes % 60
        
        total_work_days = sum(data["work_days"] for data in user_time_data.values())
        avg_hours_per_user = total_hours // len(user_time_data) if user_time_data else 0
        
        # 最も稼働時間が長いユーザー
        max_user = max(user_time_data.items(), 
                      key=lambda x: x[1]["total_hours"] * 60 + x[1]["total_minutes"])
        
        # 最も稼働時間が短いユーザー（0時間のユーザーを除く）
        active_users = {k: v for k, v in user_time_data.items() 
                       if v["total_hours"] > 0 or v["total_minutes"] > 0}
        min_user = min(active_users.items(), 
                      key=lambda x: x[1]["total_hours"] * 60 + x[1]["total_minutes"]) if active_users else None
        
        return {
            "success": True,
            "statistics": {
                "total_users": len(user_time_data),
                "active_users": len(active_users),
                "total_hours": total_hours,
                "total_minutes": total_minutes,
                "total_time_formatted": f"{total_hours}時間{total_minutes}分",
                "total_work_days": total_work_days,
                "average_hours_per_user": avg_hours_per_user,
                "most_active_user": {
                    "name": max_user[0],
                    "total_time": max_user[1]["total_time_formatted"],
                    "work_days": max_user[1]["work_days"]
                },
                "least_active_user": {
                    "name": min_user[0],
                    "total_time": min_user[1]["total_time_formatted"],
                    "work_days": min_user[1]["work_days"]
                } if min_user else None
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"統計情報の取得中にエラーが発生しました: {str(e)}"
        )