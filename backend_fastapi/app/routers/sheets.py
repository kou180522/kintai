from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import httpx

router = APIRouter()

class SpreadsheetUrlResponse(BaseModel):
    success: bool
    data: Dict[str, Any]

class TestConnectionResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None
    scriptResponse: Optional[Dict[str, Any]] = None
    details: Optional[str] = None

@router.get("/url", response_model=SpreadsheetUrlResponse)
async def get_spreadsheet_url():
    spreadsheet_id = os.getenv("GOOGLE_SPREADSHEET_ID", "")
    script_url = os.getenv("GOOGLE_SCRIPT_URL", "")
    
    spreadsheet_url = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}" if spreadsheet_id else ""
    
    return SpreadsheetUrlResponse(
        success=True,
        data={
            "spreadsheetUrl": spreadsheet_url,
            "isConfigured": bool(script_url),
            "message": (
                "Google Sheets連携が設定されています" 
                if script_url 
                else "Google Apps Script URLが未設定です。環境変数を確認してください。"
            )
        }
    )

@router.get("/test", response_model=TestConnectionResponse)
async def test_connection():
    script_url = os.getenv("GOOGLE_SCRIPT_URL", "")
    
    if not script_url:
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "error": "Google Apps Script URLが設定されていません"
            }
        )
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(script_url)
            response.raise_for_status()
            data = response.json()
        
        return TestConnectionResponse(
            success=True,
            message="Google Apps Script接続テスト成功",
            scriptResponse=data
        )
    except Exception as e:
        print(f"Google Apps Script接続エラー: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "Google Apps Script接続に失敗しました",
                "details": str(e)
            }
        )