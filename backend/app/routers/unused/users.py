from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import csv
import io
import os
from datetime import datetime
import httpx
from app.services.csv_loader import csv_loader

router = APIRouter()

# メモリ内にユーザーデータを保存
cached_users_data = {
    "users": [],
    "attendance_records": [],
    "last_updated": None
}

class UserInfo(BaseModel):
    employee_id: str
    name: str
    department: Optional[str] = None
    email: Optional[str] = None
    position: Optional[str] = None

class UsersResponse(BaseModel):
    success: bool
    data: List[UserInfo]
    total_count: int
    timestamp: str

class CSVUploadResponse(BaseModel):
    success: bool
    message: str
    processed_count: int
    users: List[UserInfo]
    timestamp: str

@router.post("/upload-csv", response_model=CSVUploadResponse)
async def upload_user_csv(file: UploadFile = File(...)):
    """
    CSVファイルからユーザー情報を読み込むエンドポイント
    CSVフォーマット: employee_id, name, department, email, position
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=400, 
            detail="CSVファイルをアップロードしてください"
        )
    
    try:
        contents = await file.read()
        decoded = contents.decode('utf-8-sig')
        csv_reader = csv.DictReader(io.StringIO(decoded))
        
        users = []
        for row in csv_reader:
            user_info = UserInfo(
                employee_id=row.get('employee_id', row.get('社員ID', '')),
                name=row.get('name', row.get('氏名', '')),
                department=row.get('department', row.get('部署', '')),
                email=row.get('email', row.get('メール', '')),
                position=row.get('position', row.get('役職', ''))
            )
            users.append(user_info)
        
        return CSVUploadResponse(
            success=True,
            message=f"{len(users)}件のユーザー情報を読み込みました",
            processed_count=len(users),
            users=users,
            timestamp=datetime.now().isoformat()
        )
        
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="CSVファイルのエンコーディングエラー。UTF-8またはShift-JISを使用してください"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"CSVファイルの処理中にエラーが発生しました: {str(e)}"
        )

@router.get("/list", response_model=UsersResponse)
async def get_users():
    """
    保存されたユーザー情報を取得するエンドポイント
    （トップページ更新用）
    """
    # csv_loaderから直接ユーザー情報を取得
    users = csv_loader.get_users()
    
    if users:
        # UserInfoオブジェクトに変換
        user_info_list = [
            UserInfo(
                employee_id=user["employee_id"],
                name=user["name"],
                department=user.get("department", "未設定"),
                email=user.get("email", ""),
                position=user.get("position", "一般社員")
            )
            for user in users
        ]
        
        return UsersResponse(
            success=True,
            data=user_info_list,
            total_count=len(user_info_list),
            timestamp=datetime.now().isoformat()
        )
    else:
        # データがない場合はCSVを再読み込み
        csv_loader.reload_data()
        users = csv_loader.get_users()
        
        if users:
            user_info_list = [
                UserInfo(
                    employee_id=user["employee_id"],
                    name=user["name"],
                    department=user.get("department", "未設定"),
                    email=user.get("email", ""),
                    position=user.get("position", "一般社員")
                )
                for user in users
            ]
            
            return UsersResponse(
                success=True,
                data=user_info_list,
                total_count=len(user_info_list),
                timestamp=datetime.now().isoformat()
            )
        else:
            # フォールバック
            return UsersResponse(
                success=True,
                data=[],
                total_count=0,
                timestamp=datetime.now().isoformat()
            )

@router.get("/user/{employee_id}", response_model=UserInfo)
async def get_user_by_id(employee_id: str):
    """
    特定のユーザー情報を取得するエンドポイント
    """
    sample_users = {
        "001": UserInfo(
            employee_id="001",
            name="田中太郎",
            department="開発部",
            email="tanaka@example.com",
            position="エンジニア"
        ),
        "002": UserInfo(
            employee_id="002",
            name="佐藤花子",
            department="営業部", 
            email="sato@example.com",
            position="マネージャー"
        ),
        "003": UserInfo(
            employee_id="003",
            name="鈴木一郎",
            department="管理部",
            email="suzuki@example.com",
            position="部長"
        )
    }
    
    if employee_id not in sample_users:
        raise HTTPException(
            status_code=404,
            detail=f"社員ID {employee_id} のユーザーが見つかりません"
        )
    
    return sample_users[employee_id]

@router.get("/import-from-csv")
async def import_from_csv_file():
    """
    ローカルのCSVファイルから勤怠データを取り込むエンドポイント
    """
    csv_file_path = "attendance_data.csv"
    
    try:
        # CSVファイルを読み込み
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            csv_content = file.read()
            csv_reader = csv.DictReader(io.StringIO(csv_content))
            
            # 勤怠データから一意のユーザーを抽出
            unique_users = {}
            attendance_records = []
            
            for row in csv_reader:
                # 勤怠データの形式に対応
                user_name = row.get('ユーザー', row.get('user', row.get('名前', '')))
                date = row.get('日付', row.get('date', ''))
                time = row.get('時間', row.get('time', ''))
                status = row.get('ステータス', row.get('status', ''))
                message = row.get('メッセージ', row.get('message', ''))
                working_hours = row.get('合計稼働時間', row.get('working_hours', ''))
                
                # ユーザー名が存在する場合、データを記録
                if user_name and user_name.strip():
                    attendance_record = {
                        "user": user_name,
                        "date": date,
                        "time": time,
                        "status": status,
                        "message": message,
                        "working_hours": working_hours
                    }
                    attendance_records.append(attendance_record)
                    
                    # ユーザー情報を抽出（一意のユーザーのみ）
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
            
            # ユーザー情報をUserInfoオブジェクトに変換
            users = [UserInfo(**user_data) for user_data in unique_users.values()]
            
            # キャッシュを更新
            cached_users_data["users"] = users
            cached_users_data["attendance_records"] = attendance_records
            cached_users_data["last_updated"] = datetime.now().isoformat()
            
            return {
                "success": True,
                "message": f"CSVファイルから{len(users)}人のユーザーと{len(attendance_records)}件の勤怠データを取り込みました",
                "users": users,
                "attendance_records": attendance_records[:10],  # 最初の10件のみ返す
                "processed_count": len(attendance_records),
                "timestamp": datetime.now().isoformat()
            }
            
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"CSVファイル '{csv_file_path}' が見つかりません"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"CSVファイルの処理中にエラーが発生しました: {str(e)}"
        )

@router.get("/import-from-sheets")
async def import_from_google_sheets():
    """
    Google Spreadsheetsから勤怠データをCSVとして取り込むエンドポイント
    """
    spreadsheet_id = os.getenv("GOOGLE_SPREADSHEET_ID")
    
    if not spreadsheet_id:
        raise HTTPException(
            status_code=400,
            detail="Google Spreadsheet IDが設定されていません"
        )
    
    try:
        # Google SheetsをCSV形式でエクスポート
        export_url = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=csv"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(export_url, follow_redirects=True)
            response.raise_for_status()
            
            # CSVデータをパース
            csv_content = response.text
            csv_reader = csv.DictReader(io.StringIO(csv_content))
            
            # 勤怠データから一意のユーザーを抽出
            unique_users = {}
            attendance_records = []
            
            for row in csv_reader:
                # 勤怠データの形式に対応
                user_name = row.get('ユーザー', row.get('user', row.get('名前', '')))
                date = row.get('日付', row.get('date', ''))
                time = row.get('時間', row.get('time', ''))
                status = row.get('ステータス', row.get('status', ''))
                message = row.get('メッセージ', row.get('message', ''))
                working_hours = row.get('合計稼働時間', row.get('working_hours', ''))
                
                # ユーザー名が存在する場合、データを記録
                if user_name and user_name.strip():
                    attendance_record = {
                        "user": user_name,
                        "date": date,
                        "time": time,
                        "status": status,
                        "message": message,
                        "working_hours": working_hours
                    }
                    attendance_records.append(attendance_record)
                    
                    # ユーザー情報を抽出（一意のユーザーのみ）
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
            
            # ユーザー情報をUserInfoオブジェクトに変換
            users = [UserInfo(**user_data) for user_data in unique_users.values()]
            
            return {
                "success": True,
                "message": f"Google Sheetsから{len(users)}人のユーザーと{len(attendance_records)}件の勤怠データを取り込みました",
                "users": users,
                "attendance_records": attendance_records,
                "processed_count": len(attendance_records),
                "timestamp": datetime.now().isoformat()
            }
            
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Google Sheetsからのデータ取得に失敗しました: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"データ処理中にエラーが発生しました: {str(e)}"
        )