# Backend - バックエンドディレクトリ

## 概要
このディレクトリはFastAPIベースのバックエンドAPIサーバーのソースコードを含みます。
勤怠データの処理、集計、およびフロントエンドへのAPI提供を担当します。

## ディレクトリ構造（簡略化済み）

```
backend/
├── app/
│   ├── routers/              # 使用中のAPIエンドポイント
│   │   ├── subpage.py       # グラフデータAPI
│   │   ├── monitor.py       # Google Sheets監視
│   │   └── unused/          # 未使用のルーター（将来用）
│   ├── services/             # コアサービス
│   │   ├── csv_loader.py    # CSVデータ処理
│   │   ├── google_sheets.py # Sheets API連携
│   │   └── sheets_monitor.py # 監視サービス
│   └── main.py              # アプリケーションエントリーポイント
└── requirements.txt         # Python依存関係
```

## 主要機能

### APIエンドポイント
- `/subpage/daily-chart`: 日別グラフデータ（最大15人）
- `/subpage/monthly-by-user`: 月別ユーザー別データ
- `/monitor/start`: Google Sheets監視開始

### データ処理
- CSVファイルからの勤怠データ読み込み
- 日跨ぎ勤務の正確な計算
- ユーザー別・日別・月別の集計

## 起動方法

```bash
cd backend
python -m uvicorn app.main:app --reload --port 8001
```