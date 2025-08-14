# Slack連携セットアップガイド

## 📋 概要
勤怠管理システムとSlackを連携し、Slackから打刻を行い、データをグラフ化するための設定手順です。

## 🚀 Slack App作成手順

### 1. Slack Appを作成

1. [Slack API](https://api.slack.com/apps) にアクセス
2. 「Create New App」をクリック
3. 「From scratch」を選択
4. App名: `勤怠管理Bot` など任意の名前
5. ワークスペースを選択して「Create App」

### 2. 基本設定

#### Signing Secret の取得
1. 「Basic Information」ページ
2. 「App Credentials」セクションの「Signing Secret」をコピー
3. `.env`ファイルに追加:
```env
SLACK_SIGNING_SECRET=your_signing_secret_here
```

### 3. スラッシュコマンドの設定

1. サイドバーの「Slash Commands」をクリック
2. 「Create New Command」をクリック
3. 以下のコマンドを作成:

#### /出勤 コマンド
- Command: `/出勤`
- Request URL: `https://your-domain.com/slack/slash-command`
- Short Description: 出勤を記録します
- Usage Hint: `/出勤 [メモ]`

#### /退勤 コマンド
- Command: `/退勤`
- Request URL: `https://your-domain.com/slack/slash-command`
- Short Description: 退勤を記録します
- Usage Hint: `/退勤 [メモ]`

#### /勤怠状況 コマンド
- Command: `/勤怠状況`
- Request URL: `https://your-domain.com/slack/slash-command`
- Short Description: 本日の勤怠状況を確認
- Usage Hint: `/勤怠状況`

#### /attendance コマンド（英語版）
- Command: `/attendance`
- Request URL: `https://your-domain.com/slack/slash-command`
- Short Description: Record attendance
- Usage Hint: `/attendance in|out [note]`

### 4. Event Subscriptionsの設定（オプション）

メッセージから自動で打刻を検出する場合:

1. サイドバーの「Event Subscriptions」をクリック
2. 「Enable Events」をONに
3. Request URL: `https://your-domain.com/slack/events`
4. Subscribe to bot events:
   - `message.channels`
   - `message.groups`
   - `message.im`
   - `message.mpim`

### 5. OAuth & Permissions

1. サイドバーの「OAuth & Permissions」をクリック
2. Bot Token Scopesに以下を追加:
   - `chat:write` - メッセージ送信用
   - `commands` - スラッシュコマンド用
   - `channels:history` - チャンネルメッセージ読み取り（Event使用時）
   - `groups:history` - プライベートチャンネル読み取り（Event使用時）
   - `im:history` - DM読み取り（Event使用時）
   - `mpim:history` - グループDM読み取り（Event使用時）

3. 「Install to Workspace」をクリック
4. 権限を確認して「Allow」
5. 「Bot User OAuth Token」をコピー
6. `.env`ファイルに追加:
```env
SLACK_BOT_TOKEN=xoxb-your-token-here
```

## 🔧 環境変数の設定

`backend_fastapi/.env`ファイルに以下を追加:

```env
# Slack設定
SLACK_SIGNING_SECRET=your_signing_secret_here
SLACK_BOT_TOKEN=xoxb-your-bot-token-here

# 既存の設定
GOOGLE_SPREADSHEET_ID=1YxafvPVXQ2D3YAJqHTE_2tMhDgo_ZJrhE9nX_aZv2c4
GOOGLE_SCRIPT_URL=
HOST=0.0.0.0
PORT=8000
```

## 📊 使用方法

### Slackからの打刻

#### スラッシュコマンドを使用
```
/出勤
/出勤 在宅勤務
/退勤
/退勤 本日の作業完了
/勤怠状況
```

#### メッセージで打刻（Event Subscriptions設定時）
以下のキーワードを含むメッセージを送信:
- 出勤: 「出勤」「出社」「おはよう」「始業」
- 退勤: 「退勤」「退社」「お疲れ様」「終業」

### APIエンドポイント

#### 勤怠データ取得
```bash
# 全データ取得
curl http://localhost:8000/slack/attendance-data

# 特定ユーザーのデータ
curl "http://localhost:8000/slack/attendance-data?user_id=U12345678"

# 特定日のデータ
curl "http://localhost:8000/slack/attendance-data?date=2024-01-15"
```

#### 勤怠サマリー取得（グラフ用）
```bash
# 過去30日間のサマリー
curl http://localhost:8000/slack/attendance-summary

# 期間指定
curl "http://localhost:8000/slack/attendance-summary?start_date=2024-01-01&end_date=2024-01-31"
```

## 📈 グラフ表示の実装

取得したデータを使用してフロントエンドでグラフを表示:

### データ形式

#### attendance-data レスポンス
```json
{
  "success": true,
  "data": [
    {
      "user_id": "U12345678",
      "user_name": "山田太郎",
      "timestamp": "2024-01-15T09:00:00",
      "action": "clock_in",
      "message": "在宅勤務"
    },
    {
      "user_id": "U12345678",
      "user_name": "山田太郎",
      "timestamp": "2024-01-15T18:30:00",
      "action": "clock_out",
      "message": "本日の作業完了"
    }
  ]
}
```

#### attendance-summary レスポンス
```json
{
  "success": true,
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "data": {
    "U12345678": {
      "2024-01-15": {
        "clock_in": "2024-01-15T09:00:00",
        "clock_out": "2024-01-15T18:30:00",
        "work_hours": 9.5
      },
      "2024-01-16": {
        "clock_in": "2024-01-16T08:45:00",
        "clock_out": "2024-01-16T17:45:00",
        "work_hours": 9.0
      }
    }
  }
}
```

## 🔄 データの永続化

現在の実装はメモリ内でデータを保存しています。本番環境では以下の対応が必要:

1. **データベース導入**
   - PostgreSQL、MySQL、MongoDBなど
   - SQLAlchemyやMongoEngineなどのORMを使用

2. **Google Spreadsheetsとの同期**
   - 既存の`google_sheets.py`サービスを活用
   - Slack打刻時に自動でスプレッドシートに記録

3. **バックアップ**
   - 定期的なデータエクスポート
   - 複数の保存先への冗長化

## 🛠️ トラブルシューティング

### エラー: "Invalid signature"
- Signing Secretが正しく設定されているか確認
- 環境変数が読み込まれているか確認

### エラー: "Command not found"
- スラッシュコマンドのRequest URLが正しいか確認
- ngrokなどを使用している場合はURLを更新

### イベントが受信されない
- Event SubscriptionsのURLが正しいか確認
- URL検証（challenge）が成功しているか確認

## 🔒 セキュリティ注意事項

1. **本番環境では必ず署名検証を有効化**
2. **HTTPSを使用**
3. **トークンは環境変数で管理**
4. **アクセス権限を最小限に**
5. **定期的なトークンのローテーション**

## 📝 次のステップ

1. フロントエンドでグラフコンポーネントを実装
2. データベースを導入して永続化
3. 詳細な勤怠レポート機能の追加
4. 管理者向けダッシュボードの作成
5. 勤務時間の自動集計とアラート機能