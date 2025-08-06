# prisma ディレクトリ

このディレクトリには、Prisma ORMのデータベーススキーマ定義が含まれています。

## ファイル構成

```
prisma/
└── schema.prisma    # データベーススキーマ定義ファイル
```

## schema.prisma

このファイルは、アプリケーションのデータベーススキーマを定義します。現在はまだ実装されていませんが、今後以下のようなモデルが追加される予定です：

### 予定されているモデル

1. **User（ユーザー）モデル**
   - 従業員情報
   - 名前、部署、メールアドレスなど
   
2. **TimeRecord（勤怠記録）モデル**
   - 出勤・退勤時刻
   - ユーザーとの関連付け
   - 勤務時間の計算

3. **Department（部署）モデル**
   - 部署情報
   - 部署に所属する従業員の管理

## generated ディレクトリとの関係

`prisma generate` コマンドを実行すると、schema.prismaに基づいてTypeScriptの型定義とPrismaクライアントが `/generated/prisma/` ディレクトリに自動生成されます。

## 使用方法

1. スキーマの編集後、以下のコマンドを実行：
   ```bash
   bunx prisma generate  # Prismaクライアントの生成
   bunx prisma migrate dev  # マイグレーションの作成と適用
   ```

2. アプリケーションでの使用：
   ```typescript
   import { PrismaClient } from '../generated/prisma'
   const prisma = new PrismaClient()
   ```