"""
Google Sheetsの変更を監視して自動的にCSVを更新するサービス
"""

import asyncio
import aiohttp
from datetime import datetime
import hashlib
import os

class GoogleSheetsMonitor:
    def __init__(self):
        self.sheet_id = "1YxafvPVXQ2D3YAJqHTE_2tMhDgo_ZJrhE9nX_aZv2c4"
        self.csv_url = f"https://docs.google.com/spreadsheets/d/{self.sheet_id}/export?format=csv"
        self.csv_path = "attendance_data.csv"
        self.check_interval = 30  # 30秒ごとにチェック
        self.last_hash = None
        self.is_monitoring = False
        
    async def get_sheet_data(self):
        """Google Sheetsからデータを取得"""
        async with aiohttp.ClientSession() as session:
            async with session.get(self.csv_url) as response:
                return await response.text()
    
    def calculate_hash(self, data):
        """データのハッシュ値を計算"""
        return hashlib.md5(data.encode()).hexdigest()
    
    async def check_for_updates(self):
        """更新をチェック"""
        try:
            # Google Sheetsからデータ取得
            csv_data = await self.get_sheet_data()
            current_hash = self.calculate_hash(csv_data)
            
            # ハッシュ値が変わっていれば更新
            if self.last_hash is None or current_hash != self.last_hash:
                # CSVファイルを更新
                with open(self.csv_path, 'w', encoding='utf-8') as f:
                    f.write(csv_data)
                
                self.last_hash = current_hash
                
                # データを再読み込み
                from app.services.csv_loader import csv_loader
                csv_loader.reload_data()
                
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Google Sheetsのデータが更新されました")
                return True
            
            return False
            
        except Exception as e:
            print(f"更新チェックエラー: {e}")
            return False
    
    async def start_monitoring(self):
        """監視を開始"""
        self.is_monitoring = True
        print(f"Google Sheets監視を開始しました（{self.check_interval}秒間隔）")
        
        while self.is_monitoring:
            await self.check_for_updates()
            await asyncio.sleep(self.check_interval)
    
    def stop_monitoring(self):
        """監視を停止"""
        self.is_monitoring = False
        print("Google Sheets監視を停止しました")

# シングルトンインスタンス
sheets_monitor = GoogleSheetsMonitor()