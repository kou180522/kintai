# UIコンポーネントライブラリ (shadcn/ui)

このプロジェクトでは、[shadcn/ui](https://ui.shadcn.com/)を使用してUIコンポーネントを構築しています。

## shadcn/uiとは

shadcn/uiは、Radix UIとTailwind CSSを基に構築された、コピー&ペースト可能なReactコンポーネントのコレクションです。npmパッケージとしてインストールするのではなく、必要なコンポーネントのソースコードを直接プロジェクトにコピーして使用します。

## 利用可能なコンポーネント

`app/components/ui/`ディレクトリには、以下のコンポーネントが含まれています：

### レイアウト系
- **Card** - コンテンツをグループ化するカードレイアウト
- **Separator** - セクション間の区切り線
- **Aspect Ratio** - アスペクト比を維持するコンテナ

### フォーム系
- **Button** - ボタンコンポーネント（複数のバリアント対応）
- **Input** - テキスト入力フィールド
- **Textarea** - 複数行のテキスト入力
- **Select** - ドロップダウン選択
- **Checkbox** - チェックボックス
- **Radio Group** - ラジオボタングループ
- **Switch** - オン/オフスイッチ
- **Slider** - スライダーコントロール
- **Form** - React Hook Formと統合されたフォームコンポーネント

### フィードバック系
- **Alert** - アラートメッセージ
- **Alert Dialog** - 確認ダイアログ
- **Dialog** - モーダルダイアログ
- **Drawer** - スライドインパネル
- **Popover** - ポップオーバー
- **Tooltip** - ツールチップ
- **Toast** (Sonner) - トースト通知

### ナビゲーション系
- **Breadcrumb** - パンくずリスト
- **Navigation Menu** - ナビゲーションメニュー
- **Dropdown Menu** - ドロップダウンメニュー
- **Context Menu** - コンテキストメニュー
- **Menubar** - メニューバー
- **Tabs** - タブインターフェース

### データ表示系
- **Table** - テーブルコンポーネント
- **Badge** - バッジ/ラベル
- **Avatar** - アバター画像
- **Progress** - プログレスバー
- **Skeleton** - ローディングスケルトン

### その他
- **Calendar** - カレンダーコンポーネント
- **Carousel** - カルーセル/スライダー
- **Chart** - チャートコンポーネント
- **Command** - コマンドパレット
- **Pagination** - ページネーション
- **Resizable** - リサイズ可能なパネル
- **Scroll Area** - カスタムスクロールエリア
- **Sidebar** - サイドバー
- **Toggle** - トグルボタン
- **Toggle Group** - トグルボタングループ

## 使用例

```tsx
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"

function ExampleComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>勤怠管理</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="default">出勤</Button>
      </CardContent>
    </Card>
  )
}
```

## カスタマイズ

各コンポーネントは、プロジェクトのニーズに合わせて自由にカスタマイズできます。Tailwind CSSクラスを使用してスタイルを調整したり、コンポーネントのロジックを変更したりできます。