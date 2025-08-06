# 勤怠管理システム (TimeSync Pro) - プロジェクト構造ドキュメント

このドキュメントは、勤怠管理システムのプロジェクト構造と各ディレクトリ・ファイルの役割について説明します。

## プロジェクト概要

TimeSync Proは、React RouterとTypeScriptを使用して構築された勤怠管理システムです。従業員の出勤・退勤時間を記録し、勤務状況を管理するWebアプリケーションです。

## ディレクトリ構造

```
kintai/
├── app/                    # アプリケーションのメインソースコード
├── doc/                    # プロジェクトドキュメント
├── generated/              # 自動生成されたファイル（Prisma）
├── node_modules/           # npmパッケージ
├── prisma/                 # データベーススキーマ定義
├── public/                 # 静的ファイル
└── .react-router/          # React Router関連の自動生成ファイル
```

## 主要な設定ファイル

- `package.json` - プロジェクトの依存関係と設定
- `tsconfig.json` - TypeScriptコンパイラ設定
- `vite.config.ts` - Viteビルドツール設定
- `react-router.config.ts` - React Routerの設定
- `components.json` - UIコンポーネントライブラリ（shadcn/ui）の設定
- `Dockerfile` - Dockerコンテナの設定

## 各ディレクトリの詳細

各ディレクトリの詳細な説明は、それぞれのディレクトリ内のREADME.mdファイルを参照してください：

- [app/README.md](../app/README.md) - アプリケーションコード
- [prisma/README.md](../prisma/README.md) - データベース関連
- [public/README.md](../public/README.md) - 静的ファイル