"""
勤怠打刻APIエンドポイント
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import csv
import os

router = APIRouter()

class AttendanceRecord(BaseModel):
    user_name: str
    status: str  # 開始/終了/s/f など
    message: str = ""
    
def get_csv_path():
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    project_root = os.path.dirname(backend_dir)
    return os.path.join(project_root, "data", "attendance_data.csv")

@router.post("/punch")
async def punch_attendance(record: AttendanceRecord):
    """
    勤怠打刻を記録
    """
    try:
        csv_path = get_csv_path()
        
        # 現在の日時を取得
        now = datetime.now()
        date_str = now.strftime("%Y/%m/%d")
        time_str = now.strftime("%H:%M")
        
        # CSVに新しい打刻記録を追加
        with open(csv_path, 'a', encoding='utf-8', newline='') as file:
            writer = csv.writer(file)
            writer.writerow([
                date_str,                # 日付
                time_str,                # 時刻
                record.user_name,        # ユーザー名
                record.status,           # ステータス
                record.message,          # メッセージ
                "",                      # 合計稼働時間（終了時に計算）
                ""                       # 月次稼働時間
            ])
        
        # CSVローダーをリロード
        from app.services.csv_loader import csv_loader
        csv_loader.reload_data()
        
        return {
            "success": True,
            "message": f"{record.user_name}の打刻を記録しました",
            "timestamp": now.isoformat(),
            "data": {
                "date": date_str,
                "time": time_str,
                "user": record.user_name,
                "status": record.status,
                "message": record.message
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"打刻記録中にエラーが発生しました: {str(e)}"
        )

@router.get("/today")
async def get_today_attendance():
    """
    本日の打刻記録を取得
    """
    try:
        from app.services.csv_loader import csv_loader
        
        # データを再読み込み
        csv_loader.reload_data()
        
        # 本日の日付
        today = datetime.now().strftime("%Y/%m/%d")
        
        # 全打刻記録から本日分を抽出
        all_records = csv_loader.get_attendance_records()
        today_records = [
            record for record in all_records 
            if record.get("date") == today
        ]
        
        return {
            "success": True,
            "date": today,
            "records": today_records,
            "count": len(today_records),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"本日の打刻記録取得中にエラーが発生しました: {str(e)}"
        )