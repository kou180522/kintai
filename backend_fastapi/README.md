# 勤怠管理システム - FastAPI Backend

FastAPIを使用した勤怠管理システムのバックエンドAPIです。

## セットアップ

### 1. 依存関係のインストール

```bash
cd backend_fastapi
pip install -r requirements.txt
```

### 2. 環境変数の設定

`.env.example`をコピーして`.env`ファイルを作成し、必要な環境変数を設定してください。

```bash
cp .env.example .env
```

### 3. サーバーの起動

```bash
# 開発サーバー
uvicorn main:app --reload --port 8000

# 本番サーバー
uvicorn main:app --host 0.0.0.0 --port 8000
```

## APIエンドポイント

### ルートエンドポイント
- `GET /` - APIの基本情報を表示
- `GET /health` - ヘルスチェック

### テストAPI
- `GET /test` - テストAPI（GET）
- `POST /test` - テストAPI（POST）
- `GET /test/{test_id}` - IDによるテストデータ取得

### 勤怠管理API
- `POST /attendance/clock-in` - 出勤打刻
- `POST /attendance/clock-out` - 退勤打刻
- `GET /attendance/status` - 勤務状態の確認

### Google Sheets連携API
- `GET /sheets/url` - スプレッドシートURLの取得
- `GET /sheets/test` - Google Apps Script接続テスト

## APIドキュメント

FastAPIの自動生成ドキュメントは以下のURLで確認できます：
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## ディレクトリ構造

```
backend_fastapi/
├── main.py              # メインアプリケーション
├── requirements.txt     # 依存関係
├── .env.example        # 環境変数のサンプル
├── README.md           # このファイル
└── app/
    ├── __init__.py
    ├── routers/        # APIルーター
    │   ├── __init__.py
    │   ├── test.py
    │   ├── attendance.py
    │   └── sheets.py
    ├── services/       # ビジネスロジック
    │   ├── __init__.py
    │   └── google_sheets.py
    ├── models/         # データモデル
    └── config/         # 設定ファイル
```