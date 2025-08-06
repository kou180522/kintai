# プロジェクトセットアップガイド

## 必要な環境

- Node.js 18以上
- Bun（推奨）またはnpm/yarn

## セットアップ手順

### 1. 依存関係のインストール

```bash
bun install
# または
npm install
```

### 2. 開発サーバーの起動

```bash
bun run dev
# または
npm run dev
```

開発サーバーが起動したら、ブラウザで `http://localhost:5173` にアクセスしてください。

### 3. ビルド

本番環境向けのビルドを作成：

```bash
bun run build
# または
npm run build
```

### 4. 本番サーバーの起動

ビルド後、以下のコマンドで本番サーバーを起動：

```bash
bun run start
# または
npm run start
```

## スクリプト一覧

`package.json`に定義されているスクリプト：

- `dev` - 開発サーバーの起動（HMR対応）
- `build` - 本番ビルドの作成
- `start` - 本番サーバーの起動
- `typecheck` - TypeScriptの型チェック
- `lint` - ESLintによるコードチェック
- `lint:fix` - ESLintエラーの自動修正

## Docker を使用する場合

Dockerfileが含まれているため、Dockerコンテナとしても実行できます：

```bash
# イメージのビルド
docker build -t kintai-app .

# コンテナの起動
docker run -p 3000:3000 kintai-app
```

## 環境変数

必要に応じて、以下の環境変数を設定してください：

- `DATABASE_URL` - Prismaデータベース接続文字列（将来的に必要）
- `PORT` - サーバーポート（デフォルト: 3000）

## トラブルシューティング

### 依存関係のインストールでエラーが発生する場合

```bash
# キャッシュをクリアして再インストール
bun clean
bun install
```

### TypeScriptエラーが発生する場合

```bash
# 型定義の再生成
bun run typecheck
```