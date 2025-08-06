# public ディレクトリ

このディレクトリには、アプリケーションの静的ファイルが含まれています。これらのファイルは、ビルドプロセスを経ずに直接提供されます。

## ファイル構成

```
public/
└── favicon.ico    # ブラウザタブに表示されるアイコン
```

## 用途

- **favicon.ico**: Webサイトのアイコン。ブラウザのタブ、ブックマーク、履歴などで表示されます。

## 静的ファイルの追加

このディレクトリに配置されたファイルは、アプリケーションのルートパスから直接アクセスできます。例：

- `/public/favicon.ico` → `https://example.com/favicon.ico`
- `/public/images/logo.png` → `https://example.com/images/logo.png`

## 今後追加される可能性のあるファイル

- `manifest.json` - PWA（Progressive Web App）設定
- `robots.txt` - 検索エンジンクローラー向け設定
- `images/` - アプリケーションで使用する画像ファイル
- `fonts/` - カスタムフォントファイル