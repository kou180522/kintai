# 勤怠Pro Backend - FastAPI

## 概要
勤怠Pro のバックエンドAPIサーバー。CSVベースの勤怠データを処理し、フロントエンドに提供します。

## ディレクトリ構造

```
backend/
├── app/                        # アプリケーションメインコード
│   ├── routers/               # APIエンドポイント
│   │   ├── attendance.py      # 勤怠データAPI
│   │   ├── monitor.py         # モニタリングAPI
│   │   ├── sheets_sync.py     # Google Sheets同期API
│   │   ├── subpage.py         # サブページ用API
│   │   ├── users.py           # ユーザー管理API
│   │   └── unused/            # 未使用のルーター（参考用）
│   └── services/              # ビジネスロジック
│       ├── csv_loader.py      # CSV処理の中核モジュール
│       ├── google_sheets.py   # Google Sheets連携
│       └── sheets_monitor.py  # Sheets監視サービス
├── tests/                      # テストファイル
│   ├── test_adjustment_logic.py    # 時間調整ロジックのテスト
│   ├── test_duplicate_logic.py     # 重複パターンのテスト
│   ├── test_specific_time.py       # 特定時刻指定のテスト
│   └── test_api.html                # APIテスト用HTML
├── utils/                      # ユーティリティツール
│   ├── check_aug11.py         # 8月11日データチェック
│   └── verify_hours.py        # 時間検証ツール
├── backups/                    # バックアップファイル
├── main.py                     # FastAPIアプリケーションエントリポイント
├── requirements.txt            # Python依存関係
└── attendance_data.csv        # 勤怠データ（CSV）
```

## 主要機能

### 1. CSVデータ処理 (`app/services/csv_loader.py`)
- 勤怠データの読み込み・解析
- 時間調整機能（s+60, f-30など）
- 特定時刻指定（s18:00, f19:30）
- 重複パターン処理（s/s/f, s/f/f）
- 日跨ぎ勤務の自動処理

### 2. APIエンドポイント

#### 勤怠データ (`/api/attendance/`)
- `GET /check-in` - 勤怠データ取得
- `POST /reload-data` - データ再読み込み

#### サブページ (`/api/subpage/`)
- `GET /update` - ユーザーサマリー取得
- `GET /daily-chart` - 日別グラフデータ（月単位表示対応）
- `GET /monthly-by-user` - 月別ユーザー別データ
- `GET /user/{user_name}/monthly` - 特定ユーザーの月別データ

#### ユーザー管理 (`/api/users/`)
- `GET /list` - ユーザー一覧
- `POST /add` - ユーザー追加
- `DELETE /delete/{name}` - ユーザー削除

## セットアップ

### 1. Python環境
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. サーバー起動
```bash
python -m uvicorn main:app --reload --port 8001
```

### 3. API確認
```bash
# ヘルスチェック
curl http://localhost:8001/health

# 勤怠データ取得
curl http://localhost:8001/api/attendance/check-in
```