from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.routers import test, attendance, sheets, colab_api, slack, users, time_data
from app.services.csv_loader import csv_loader

# .envファイルから環境変数を読み込み
load_dotenv()

# アプリケーション起動時にCSVデータを読み込み
print("アプリケーション起動: CSVデータを読み込み中...")
csv_loader.load_data()

app = FastAPI(
    title="勤怠管理システムAPI",
    version="1.0.0",
    description="勤怠管理システムのバックエンドAPI"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:8000", "file://", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "勤怠管理システムAPI",
        "version": "1.0.0",
        "endpoints": {
            "test": "/test",
            "attendance": "/attendance",
            "sheets": "/sheets",
            "colab": "/colab",
            "health": "/health",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

app.include_router(test.router, prefix="/test", tags=["test"])
app.include_router(attendance.router, prefix="/attendance", tags=["attendance"])
app.include_router(sheets.router, prefix="/sheets", tags=["sheets"])
app.include_router(colab_api.router, prefix="/colab", tags=["colab"])
app.include_router(slack.router, prefix="/slack", tags=["slack"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(time_data.router, prefix="/time-data", tags=["time-data"])