"""
Google スプレッドシート同期用APIエンドポイント
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import asyncio
from app.services.google_sheets_sync import sheets_sync

router = APIRouter()

class SyncConfig(BaseModel):
    spreadsheet_id: Optional[str] = None
    api_key: Optional[str] = None
    auto_sync_interval: Optional[int] = 300  # デフォルト5分

# 自動同期のタスク管理
auto_sync_task = None
auto_sync_enabled = False

@router.post("/sync/manual")
async def manual_sync():
    """
    手動でスプレッドシートと同期
    """
    try:
        result = await sheets_sync.sync_users()
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"同期中にエラーが発生しました: {str(e)}"
        )

@router.get("/sync/status")
async def get_sync_status():
    """
    同期ステータスを取得
    """
    try:
        users = sheets_sync.get_all_users()
        return {
            "success": True,
            "auto_sync_enabled": auto_sync_enabled,
            "total_users": len(users),
            "last_sync": datetime.now().isoformat(),
            "spreadsheet_configured": bool(sheets_sync.spreadsheet_id)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"ステータス取得中にエラーが発生しました: {str(e)}"
        )

async def auto_sync_loop(interval: int):
    """
    自動同期ループ
    """
    global auto_sync_enabled
    while auto_sync_enabled:
        try:
            print(f"自動同期実行中... {datetime.now()}")
            result = await sheets_sync.sync_users()
            if result["success"]:
                print(f"自動同期成功: {result['summary']}")
            else:
                print(f"自動同期失敗: {result['message']}")
        except Exception as e:
            print(f"自動同期エラー: {str(e)}")
        
        # 指定された間隔で待機
        await asyncio.sleep(interval)

@router.post("/sync/auto/start")
async def start_auto_sync(background_tasks: BackgroundTasks, interval: int = 300):
    """
    自動同期を開始（デフォルト5分間隔）
    """
    global auto_sync_task, auto_sync_enabled
    
    if auto_sync_enabled:
        return {
            "success": False,
            "message": "自動同期は既に実行中です"
        }
    
    auto_sync_enabled = True
    background_tasks.add_task(auto_sync_loop, interval)
    
    return {
        "success": True,
        "message": f"自動同期を開始しました（{interval}秒間隔）",
        "interval": interval
    }

@router.post("/sync/auto/stop")
async def stop_auto_sync():
    """
    自動同期を停止
    """
    global auto_sync_enabled
    
    if not auto_sync_enabled:
        return {
            "success": False,
            "message": "自動同期は実行されていません"
        }
    
    auto_sync_enabled = False
    
    return {
        "success": True,
        "message": "自動同期を停止しました"
    }

@router.post("/sync/configure")
async def configure_sync(config: SyncConfig):
    """
    スプレッドシート同期の設定を更新
    """
    try:
        import os
        
        # 環境変数を更新（実際の本番環境では.envファイルを更新）
        if config.spreadsheet_id:
            os.environ["GOOGLE_SPREADSHEET_ID"] = config.spreadsheet_id
            sheets_sync.spreadsheet_id = config.spreadsheet_id
        
        if config.api_key:
            os.environ["GOOGLE_API_KEY"] = config.api_key
            sheets_sync.api_key = config.api_key
        
        # .envファイルを更新
        env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), ".env")
        
        env_lines = []
        if os.path.exists(env_path):
            with open(env_path, 'r') as f:
                env_lines = f.readlines()
        
        # 既存の設定を更新または追加
        updated = False
        new_lines = []
        
        for line in env_lines:
            if line.startswith("GOOGLE_SPREADSHEET_ID=") and config.spreadsheet_id:
                new_lines.append(f"GOOGLE_SPREADSHEET_ID={config.spreadsheet_id}\n")
                updated = True
            elif line.startswith("GOOGLE_API_KEY=") and config.api_key:
                new_lines.append(f"GOOGLE_API_KEY={config.api_key}\n")
                updated = True
            else:
                new_lines.append(line)
        
        # 新しい設定を追加
        if config.spreadsheet_id and not any("GOOGLE_SPREADSHEET_ID=" in line for line in env_lines):
            new_lines.append(f"GOOGLE_SPREADSHEET_ID={config.spreadsheet_id}\n")
        
        if config.api_key and not any("GOOGLE_API_KEY=" in line for line in env_lines):
            new_lines.append(f"GOOGLE_API_KEY={config.api_key}\n")
        
        # ファイルに書き込み
        with open(env_path, 'w') as f:
            f.writelines(new_lines)
        
        return {
            "success": True,
            "message": "設定を更新しました",
            "config": {
                "spreadsheet_id": config.spreadsheet_id or sheets_sync.spreadsheet_id,
                "has_api_key": bool(config.api_key or sheets_sync.api_key),
                "auto_sync_interval": config.auto_sync_interval
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"設定の更新中にエラーが発生しました: {str(e)}"
        )