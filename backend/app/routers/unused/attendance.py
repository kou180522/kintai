from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any
from app.services.google_sheets import GoogleSheetsService
from app.services.csv_loader import csv_loader

router = APIRouter()

class AttendanceRecord:
    def __init__(self, id: str, user_id: str, clock_in: datetime, clock_in_comment: str = None):
        self.id = id
        self.user_id = user_id
        self.clock_in = clock_in
        self.clock_out = None
        self.clock_in_comment = clock_in_comment
        self.clock_out_comment = None

attendance_records: List[AttendanceRecord] = []
google_sheets_service = GoogleSheetsService()

class ClockInRequest(BaseModel):
    timestamp: str
    comment: Optional[str] = None

class ClockOutRequest(BaseModel):
    timestamp: str
    comment: Optional[str] = None

class AttendanceResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None

class StatusResponse(BaseModel):
    success: bool
    data: Dict[str, Any]

@router.post("/clock-in", response_model=AttendanceResponse)
async def clock_in(request: ClockInRequest):
    user_id = "user-001"
    
    existing_record = next(
        (record for record in attendance_records 
         if record.user_id == user_id and record.clock_out is None),
        None
    )
    
    if existing_record:
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "message": "既に出勤しています",
                "data": {
                    "id": existing_record.id,
                    "userId": existing_record.user_id,
                    "clockIn": existing_record.clock_in.isoformat(),
                    "clockInComment": existing_record.clock_in_comment
                }
            }
        )
    
    new_record = AttendanceRecord(
        id=f"attendance-{int(datetime.now().timestamp() * 1000)}",
        user_id=user_id,
        clock_in=datetime.fromisoformat(request.timestamp.replace('Z', '+00:00')),
        clock_in_comment=request.comment
    )
    
    attendance_records.append(new_record)
    print(f"出勤記録: {new_record.__dict__}")
    
    try:
        date_str = new_record.clock_in.strftime('%Y/%m/%d')
        await google_sheets_service.add_attendance_record({
            "date": date_str,
            "employeeId": user_id,
            "employeeName": "テストユーザー",
            "clockInTime": new_record.clock_in.strftime('%H:%M:%S'),
            "comment": request.comment or "",
            "status": "勤務中"
        })
        print("Google Sheetsに出勤記録を追加しました")
    except Exception as e:
        print(f"Google Sheetsエラー: {e}")
    
    return AttendanceResponse(
        success=True,
        message="出勤打刻が完了しました",
        data={
            "id": new_record.id,
            "userId": new_record.user_id,
            "clockIn": new_record.clock_in.isoformat(),
            "clockInComment": new_record.clock_in_comment
        }
    )

@router.post("/clock-out", response_model=AttendanceResponse)
async def clock_out(request: ClockOutRequest):
    user_id = "user-001"
    
    active_record = next(
        (record for record in attendance_records 
         if record.user_id == user_id and record.clock_out is None),
        None
    )
    
    if not active_record:
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "message": "出勤記録が見つかりません"
            }
        )
    
    active_record.clock_out = datetime.fromisoformat(request.timestamp.replace('Z', '+00:00'))
    active_record.clock_out_comment = request.comment
    
    working_hours = (active_record.clock_out - active_record.clock_in).total_seconds() / 3600
    
    print(f"退勤記録: {active_record.__dict__}")
    
    try:
        date_str = active_record.clock_in.strftime('%Y/%m/%d')
        overtime_hours = max(0, working_hours - 8)
        
        await google_sheets_service.update_attendance_record(
            user_id,
            date_str,
            {
                "clockOutTime": active_record.clock_out.strftime('%H:%M:%S'),
                "workingHours": f"{working_hours:.2f}",
                "overtimeHours": f"{overtime_hours:.2f}",
                "comment": request.comment or "",
                "status": "退勤済"
            }
        )
        print("Google Sheetsの退勤記録を更新しました")
    except Exception as e:
        print(f"Google Sheetsエラー: {e}")
    
    return AttendanceResponse(
        success=True,
        message="退勤打刻が完了しました",
        data={
            "id": active_record.id,
            "userId": active_record.user_id,
            "clockIn": active_record.clock_in.isoformat(),
            "clockOut": active_record.clock_out.isoformat(),
            "clockInComment": active_record.clock_in_comment,
            "clockOutComment": active_record.clock_out_comment,
            "workingHours": f"{working_hours:.2f}"
        }
    )

@router.get("/status", response_model=StatusResponse)
async def get_status():
    user_id = "user-001"
    
    active_record = next(
        (record for record in attendance_records 
         if record.user_id == user_id and record.clock_out is None),
        None
    )
    
    user_records = [
        {
            "id": record.id,
            "userId": record.user_id,
            "clockIn": record.clock_in.isoformat() if record.clock_in else None,
            "clockOut": record.clock_out.isoformat() if record.clock_out else None,
            "clockInComment": record.clock_in_comment,
            "clockOutComment": record.clock_out_comment
        }
        for record in attendance_records
        if record.user_id == user_id
    ]
    
    # CSVから読み込んだユーザー情報を追加
    csv_users = csv_loader.get_users()
    csv_attendance = csv_loader.get_attendance_records()
    
    return StatusResponse(
        success=True,
        data={
            "isWorking": active_record is not None,
            "currentRecord": {
                "id": active_record.id,
                "userId": active_record.user_id,
                "clockIn": active_record.clock_in.isoformat(),
                "clockInComment": active_record.clock_in_comment
            } if active_record else None,
            "todayRecords": user_records,
            "csvUsers": csv_users[:5],  # 最初の5人を表示
            "totalCsvUsers": len(csv_users),
            "totalCsvRecords": len(csv_attendance)
        }
    )