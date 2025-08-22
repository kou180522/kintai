import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api")
async def root():
    return {
        "message": "勤怠管理システムAPI on Vercel",
        "status": "running"
    }

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "platform": "vercel"}

# Vercel用のハンドラー
handler = app