# Data Directory

## 概要
このディレクトリには勤怠管理システムのデータファイルを格納します。

## ファイル構成

### メインファイル
- `attendance_data.csv` - 勤怠記録のマスターデータ
  - Google スプレッドシートと同期
  - 全ユーザーの出退勤記録を保存

### ディレクトリ
- `archives/` - 過去の分析ファイルやバックアップを保存
  - 分析スクリプト（.py）
  - 分析結果（.json, .md）
  - その他一時ファイル

## データ形式

### attendance_data.csv
```csv
date,time,user,status,message,...
2025/08/12,09:00,username,s,開始,...
2025/08/12,18:00,username,f,終了,...
```

- **date**: 日付（YYYY/MM/DD形式）
- **time**: 時刻（HH:MM形式）
- **user**: ユーザー名
- **status**: ステータス（s=開始, f=終了）
- **message**: メッセージ（時刻調整など）

## 注意事項
- `attendance_data.csv`は手動で編集しないでください
- バックアップは定期的に`archives/`に保存されます
- Google スプレッドシートが正式なデータソースです