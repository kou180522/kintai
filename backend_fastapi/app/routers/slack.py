from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import hashlib
import hmac
import time
import os
import json

router = APIRouter()

class SlackEvent(BaseModel):
    type: str
    challenge: Optional[str] = None
    token: Optional[str] = None
    team_id: Optional[str] = None
    event: Optional[Dict[str, Any]] = None
    event_time: Optional[int] = None

class SlackCommand(BaseModel):
    token: str
    team_id: str
    team_domain: str
    channel_id: str
    channel_name: str
    user_id: str
    user_name: str
    command: str
    text: str
    response_url: str
    trigger_id: str

class AttendanceData(BaseModel):
    user_id: str
    user_name: str
    timestamp: datetime
    action: str  # "clock_in" or "clock_out"
    message: Optional[str] = None
    location: Optional[str] = None

# メモリ内でデータを保存（実際の実装ではデータベースを使用）
attendance_data: List[AttendanceData] = []

def verify_slack_signature(request_body: bytes, timestamp: str, signature: str) -> bool:
    """Slackのリクエスト署名を検証"""
    slack_signing_secret = os.getenv("SLACK_SIGNING_SECRET", "")
    if not slack_signing_secret:
        return True  # 開発環境では署名検証をスキップ
    
    if abs(time.time() - float(timestamp)) > 60 * 5:
        return False
    
    sig_basestring = f"v0:{timestamp}:{request_body.decode('utf-8')}"
    my_signature = f"v0={hmac.new(slack_signing_secret.encode(), sig_basestring.encode(), hashlib.sha256).hexdigest()}"
    
    return hmac.compare_digest(my_signature, signature)

@router.post("/events")
async def handle_slack_events(request: Request):
    """Slack Event APIを処理"""
    body = await request.body()
    data = await request.json()
    
    # 署名検証
    timestamp = request.headers.get("X-Slack-Request-Timestamp", "")
    signature = request.headers.get("X-Slack-Signature", "")
    
    if not verify_slack_signature(body, timestamp, signature):
        raise HTTPException(status_code=403, detail="Invalid signature")
    
    # URL検証用のチャレンジレスポンス
    if data.get("type") == "url_verification":
        return {"challenge": data.get("challenge")}
    
    # イベント処理
    event = data.get("event", {})
    event_type = event.get("type")
    
    if event_type == "message":
        return await process_message_event(event)
    
    return {"status": "ok"}

@router.post("/slash-command")
async def handle_slash_command(request: Request):
    """Slackスラッシュコマンドを処理"""
    body = await request.body()
    form_data = await request.form()
    
    # 署名検証
    timestamp = request.headers.get("X-Slack-Request-Timestamp", "")
    signature = request.headers.get("X-Slack-Signature", "")
    
    if not verify_slack_signature(body, timestamp, signature):
        raise HTTPException(status_code=403, detail="Invalid signature")
    
    command = form_data.get("command")
    text = form_data.get("text", "")
    user_id = form_data.get("user_id")
    user_name = form_data.get("user_name")
    
    # 打刻コマンドの処理
    if command == "/attendance" or command == "/勤怠":
        return await process_attendance_command(user_id, user_name, text)
    elif command == "/clock-in" or command == "/出勤":
        return await process_clock_in(user_id, user_name, text)
    elif command == "/clock-out" or command == "/退勤":
        return await process_clock_out(user_id, user_name, text)
    elif command == "/attendance-status" or command == "/勤怠状況":
        return await get_attendance_status(user_id)
    
    return {
        "response_type": "ephemeral",
        "text": "不明なコマンドです"
    }

async def process_message_event(event: Dict[str, Any]):
    """メッセージイベントを処理（打刻キーワードを検出）"""
    text = event.get("text", "").lower()
    user = event.get("user")
    
    # 打刻キーワードを検出
    clock_in_keywords = ["出勤", "出社", "おはよう", "始業", "clock in", "出勤します"]
    clock_out_keywords = ["退勤", "退社", "お疲れ様", "終業", "clock out", "退勤します"]
    
    for keyword in clock_in_keywords:
        if keyword in text:
            await save_attendance(user, "clock_in", text)
            return {"status": "clock_in_recorded"}
    
    for keyword in clock_out_keywords:
        if keyword in text:
            await save_attendance(user, "clock_out", text)
            return {"status": "clock_out_recorded"}
    
    return {"status": "no_action"}

async def process_attendance_command(user_id: str, user_name: str, text: str):
    """汎用勤怠コマンドを処理"""
    if "出勤" in text or "in" in text.lower():
        return await process_clock_in(user_id, user_name, text)
    elif "退勤" in text or "out" in text.lower():
        return await process_clock_out(user_id, user_name, text)
    else:
        return {
            "response_type": "ephemeral",
            "text": "使用方法: `/attendance 出勤 [メモ]` または `/attendance 退勤 [メモ]`"
        }

async def process_clock_in(user_id: str, user_name: str, message: str = ""):
    """出勤処理"""
    # 既に出勤しているかチェック
    today_records = get_today_records(user_id)
    if today_records and today_records[-1].action == "clock_in":
        return {
            "response_type": "ephemeral",
            "text": "既に出勤済みです"
        }
    
    attendance = AttendanceData(
        user_id=user_id,
        user_name=user_name,
        timestamp=datetime.now(),
        action="clock_in",
        message=message
    )
    attendance_data.append(attendance)
    
    return {
        "response_type": "in_channel",
        "text": f"<@{user_id}> が出勤しました :sunny:",
        "attachments": [{
            "color": "good",
            "fields": [
                {"title": "時刻", "value": attendance.timestamp.strftime("%H:%M"), "short": True},
                {"title": "メモ", "value": message or "なし", "short": True}
            ]
        }]
    }

async def process_clock_out(user_id: str, user_name: str, message: str = ""):
    """退勤処理"""
    today_records = get_today_records(user_id)
    if not today_records or today_records[-1].action != "clock_in":
        return {
            "response_type": "ephemeral",
            "text": "出勤記録がありません"
        }
    
    clock_in_time = today_records[-1].timestamp
    attendance = AttendanceData(
        user_id=user_id,
        user_name=user_name,
        timestamp=datetime.now(),
        action="clock_out",
        message=message
    )
    attendance_data.append(attendance)
    
    # 勤務時間を計算
    work_duration = attendance.timestamp - clock_in_time
    hours = int(work_duration.total_seconds() // 3600)
    minutes = int((work_duration.total_seconds() % 3600) // 60)
    
    return {
        "response_type": "in_channel",
        "text": f"<@{user_id}> が退勤しました :moon:",
        "attachments": [{
            "color": "good",
            "fields": [
                {"title": "退勤時刻", "value": attendance.timestamp.strftime("%H:%M"), "short": True},
                {"title": "勤務時間", "value": f"{hours}時間{minutes}分", "short": True},
                {"title": "メモ", "value": message or "なし", "short": False}
            ]
        }]
    }

async def get_attendance_status(user_id: str):
    """勤怠状況を取得"""
    today_records = get_today_records(user_id)
    
    if not today_records:
        return {
            "response_type": "ephemeral",
            "text": "本日の勤怠記録はありません"
        }
    
    fields = []
    for record in today_records:
        action_text = "出勤" if record.action == "clock_in" else "退勤"
        fields.append({
            "title": action_text,
            "value": record.timestamp.strftime("%H:%M"),
            "short": True
        })
    
    # 勤務時間を計算
    if len(today_records) >= 2 and today_records[-1].action == "clock_out":
        clock_in = today_records[-2].timestamp
        clock_out = today_records[-1].timestamp
        duration = clock_out - clock_in
        hours = int(duration.total_seconds() // 3600)
        minutes = int((duration.total_seconds() % 3600) // 60)
        fields.append({
            "title": "勤務時間",
            "value": f"{hours}時間{minutes}分",
            "short": True
        })
    
    return {
        "response_type": "ephemeral",
        "text": "本日の勤怠状況",
        "attachments": [{
            "color": "good",
            "fields": fields
        }]
    }

def get_today_records(user_id: str) -> List[AttendanceData]:
    """本日の勤怠記録を取得"""
    today = datetime.now().date()
    return [
        record for record in attendance_data
        if record.user_id == user_id and record.timestamp.date() == today
    ]

async def save_attendance(user_id: str, action: str, message: str = ""):
    """勤怠データを保存"""
    attendance = AttendanceData(
        user_id=user_id,
        user_name="",  # Event APIからは取得できない場合がある
        timestamp=datetime.now(),
        action=action,
        message=message
    )
    attendance_data.append(attendance)

@router.get("/attendance-data")
async def get_attendance_data(user_id: Optional[str] = None, date: Optional[str] = None):
    """勤怠データを取得（グラフ表示用）"""
    filtered_data = attendance_data
    
    if user_id:
        filtered_data = [d for d in filtered_data if d.user_id == user_id]
    
    if date:
        target_date = datetime.fromisoformat(date).date()
        filtered_data = [d for d in filtered_data if d.timestamp.date() == target_date]
    
    # グラフ用にデータを整形
    result = []
    for record in filtered_data:
        result.append({
            "user_id": record.user_id,
            "user_name": record.user_name,
            "timestamp": record.timestamp.isoformat(),
            "action": record.action,
            "message": record.message
        })
    
    return {"success": True, "data": result}

@router.get("/attendance-summary")
async def get_attendance_summary(start_date: Optional[str] = None, end_date: Optional[str] = None):
    """勤怠サマリーを取得（グラフ表示用）"""
    if start_date:
        start = datetime.fromisoformat(start_date).date()
    else:
        start = datetime.now().date() - timedelta(days=30)
    
    if end_date:
        end = datetime.fromisoformat(end_date).date()
    else:
        end = datetime.now().date()
    
    # ユーザーごと、日付ごとに集計
    summary = {}
    for record in attendance_data:
        if not (start <= record.timestamp.date() <= end):
            continue
        
        user_id = record.user_id
        date_str = record.timestamp.date().isoformat()
        
        if user_id not in summary:
            summary[user_id] = {}
        
        if date_str not in summary[user_id]:
            summary[user_id][date_str] = {
                "clock_in": None,
                "clock_out": None,
                "work_hours": 0
            }
        
        if record.action == "clock_in":
            summary[user_id][date_str]["clock_in"] = record.timestamp.isoformat()
        elif record.action == "clock_out":
            summary[user_id][date_str]["clock_out"] = record.timestamp.isoformat()
            
            # 勤務時間を計算
            if summary[user_id][date_str]["clock_in"]:
                clock_in = datetime.fromisoformat(summary[user_id][date_str]["clock_in"])
                clock_out = record.timestamp
                duration = (clock_out - clock_in).total_seconds() / 3600
                summary[user_id][date_str]["work_hours"] = round(duration, 2)
    
    return {
        "success": True,
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "data": summary
    }