#!/usr/bin/env python3
import sys
import os
os.chdir('/Users/Owner/Atlas/kintai')
sys.path.append('backend_fastapi')
from app.services.csv_loader import csv_loader

print("CSVデータを再読み込み中...")
csv_loader.reload_data()
print("完了！")

# 統計情報を表示
users = csv_loader.get_users()
records = csv_loader.get_attendance_records()
print(f"ユーザー数: {len(users)}")
print(f"レコード数: {len(records)}")