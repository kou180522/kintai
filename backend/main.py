from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.routers import subpage, monitor
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

app.include_router(subpage.router, prefix="/api/subpage", tags=["subpage"])
app.include_router(monitor.router, prefix="/api/monitor", tags=["monitor"])