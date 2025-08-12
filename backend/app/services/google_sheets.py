import os
from typing import Dict, Any
import httpx

class GoogleSheetsService:
    def __init__(self):
        self.spreadsheet_id = os.getenv("GOOGLE_SPREADSHEET_ID", "")
        self.script_url = os.getenv("GOOGLE_SCRIPT_URL", "")
    
    def get_public_spreadsheet_url(self) -> str:
        if self.spreadsheet_id:
            return f"https://docs.google.com/spreadsheets/d/{self.spreadsheet_id}"
        return ""
    
    async def add_attendance_record(self, data: Dict[str, Any]) -> Dict[str, Any]:
        if not self.script_url:
            raise ValueError("Google Apps Script URLが設定されていません")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.script_url,
                json={
                    "action": "addAttendance",
                    "data": data
                }
            )
            response.raise_for_status()
            return response.json()
    
    async def update_attendance_record(
        self, 
        employee_id: str, 
        date: str, 
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        if not self.script_url:
            raise ValueError("Google Apps Script URLが設定されていません")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.script_url,
                json={
                    "action": "updateAttendance",
                    "employeeId": employee_id,
                    "date": date,
                    "data": data
                }
            )
            response.raise_for_status()
            return response.json()
    
    async def get_attendance_records(
        self, 
        employee_id: str = None, 
        date: str = None
    ) -> Dict[str, Any]:
        if not self.script_url:
            raise ValueError("Google Apps Script URLが設定されていません")
        
        params = {"action": "getAttendance"}
        if employee_id:
            params["employeeId"] = employee_id
        if date:
            params["date"] = date
        
        async with httpx.AsyncClient() as client:
            response = await client.get(self.script_url, params=params)
            response.raise_for_status()
            return response.json()