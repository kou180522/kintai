#!/usr/bin/env python3
import os
import sys
sys.path.append('.')

from app.services.google_sheets_sync import GoogleSheetsSync

def main():
    """手動でGoogleスプレッドシートとの同期を実行"""
    
    # スプレッドシートIDを設定
    sheet_id = "1YxafvPVXQ2D3YAJqHTE_2tMhDgo_ZJrhE9nX_aZv2c4"
    
    # CSVファイルのパスを設定
    csv_path = "../public/attendance_data.csv"
    
    print(f"スプレッドシートID: {sheet_id}")
    print(f"CSVファイルパス: {csv_path}")
    print("同期を開始します...")
    
    # 同期を実行
    sync = GoogleSheetsSync(sheet_id, csv_path)
    result = sync.sync_to_csv()
    
    if result:
        print(f"✅ 同期が完了しました！")
        print(f"   新しいレコード数: {result.get('new_records', 0)}")
        print(f"   総レコード数: {result.get('total_records', 0)}")
        
        # 最新のレコードを表示
        import csv
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            lines = list(reader)
            print("\n最新の5件のレコード:")
            for line in lines[-5:]:
                print("  ", ",".join(line[:5]))  # 最初の5列のみ表示
    else:
        print("❌ 同期に失敗しました")

if __name__ == "__main__":
    main()