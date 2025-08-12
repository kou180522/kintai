"""
Google Sheets監視用APIエンドポイント
"""

from fastapi import APIRouter, BackgroundTasks
from app.services.sheets_monitor import sheets_monitor
import asyncio

router = APIRouter()

@router.post("/start")
async def start_monitoring(background_tasks: BackgroundTasks):
    """監視を開始"""
    if not sheets_monitor.is_monitoring:
        background_tasks.add_task(sheets_monitor.start_monitoring)
        return {
            "success": True,
            "message": "Google Sheets監視を開始しました",
            "interval": sheets_monitor.check_interval
        }
    else:
        return {
            "success": False,
            "message": "既に監視中です"
        }

@router.post("/stop")
async def stop_monitoring():
    """監視を停止"""
    sheets_monitor.stop_monitoring()
    return {
        "success": True,
        "message": "Google Sheets監視を停止しました"
    }

@router.get("/status")
async def get_monitor_status():
    """監視状態を取得"""
    return {
        "is_monitoring": sheets_monitor.is_monitoring,
        "check_interval": sheets_monitor.check_interval,
        "sheet_id": sheets_monitor.sheet_id
    }

@router.post("/check-now")
async def check_now():
    """今すぐ更新をチェック"""
    updated = await sheets_monitor.check_for_updates()
    return {
        "success": True,
        "updated": updated,
        "message": "更新されました" if updated else "変更はありません"
    }