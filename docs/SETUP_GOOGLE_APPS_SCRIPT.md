# Google Apps Script セットアップガイド

## 📋 概要
Google SpreadsheetsとFastAPIを連携するためのGoogle Apps Script設定手順です。

## 🚀 セットアップ手順

### 1. Google Spreadsheetsを開く
提供されたスプレッドシートを開きます：
https://docs.google.com/spreadsheets/d/1YxafvPVXQ2D3YAJqHTE_2tMhDgo_ZJrhE9nX_aZv2c4

### 2. Apps Scriptエディタを開く
1. スプレッドシートのメニューから「拡張機能」→「Apps Script」をクリック
2. 新しいタブでApps Scriptエディタが開きます

### 3. スクリプトコードを設定
以下のコードをApps Scriptエディタに貼り付けます：

```javascript
// 勤怠管理システム用 Google Apps Script

// CORS対応のレスポンスヘッダーを設定
function setCorsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

// GETリクエストの処理
function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const action = e.parameter.action || 'getAttendance';
  
  let result = {};
  
  switch(action) {
    case 'getAttendance':
      result = getAttendanceRecords(sheet, e.parameter);
      break;
    case 'test':
      result = { status: 'success', message: 'Google Apps Script is working!' };
      break;
    default:
      result = { status: 'error', message: 'Unknown action' };
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// POSTリクエストの処理
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  
  let result = {};
  
  switch(action) {
    case 'addAttendance':
      result = addAttendanceRecord(sheet, data.data);
      break;
    case 'updateAttendance':
      result = updateAttendanceRecord(sheet, data);
      break;
    default:
      result = { status: 'error', message: 'Unknown action' };
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// 出勤記録を追加
function addAttendanceRecord(sheet, data) {
  try {
    // ヘッダー行を確認（なければ作成）
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        '日付', '社員ID', '社員名', '出勤時刻', '退勤時刻', 
        '勤務時間', '残業時間', 'コメント', 'ステータス'
      ]);
    }
    
    // 新しい行を追加
    sheet.appendRow([
      data.date || new Date().toLocaleDateString('ja-JP'),
      data.employeeId,
      data.employeeName,
      data.clockInTime,
      data.clockOutTime || '',
      data.workingHours || '',
      data.overtimeHours || '',
      data.comment || '',
      data.status || '勤務中'
    ]);
    
    return { status: 'success', message: '出勤記録を追加しました' };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

// 退勤記録を更新
function updateAttendanceRecord(sheet, data) {
  try {
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // 該当する行を探す
    for (let i = 1; i < values.length; i++) {
      if (values[i][1] === data.employeeId && values[i][0] === data.date) {
        // 退勤時刻と関連データを更新
        if (data.data.clockOutTime) sheet.getRange(i + 1, 5).setValue(data.data.clockOutTime);
        if (data.data.workingHours) sheet.getRange(i + 1, 6).setValue(data.data.workingHours);
        if (data.data.overtimeHours) sheet.getRange(i + 1, 7).setValue(data.data.overtimeHours);
        if (data.data.comment) sheet.getRange(i + 1, 8).setValue(data.data.comment);
        if (data.data.status) sheet.getRange(i + 1, 9).setValue(data.data.status);
        
        return { status: 'success', message: '退勤記録を更新しました' };
      }
    }
    
    return { status: 'error', message: '該当する記録が見つかりません' };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

// 出勤記録を取得
function getAttendanceRecords(sheet, params) {
  try {
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    if (values.length <= 1) {
      return { status: 'success', data: [] };
    }
    
    const headers = values[0];
    const records = [];
    
    for (let i = 1; i < values.length; i++) {
      const record = {};
      for (let j = 0; j < headers.length; j++) {
        record[headers[j]] = values[i][j];
      }
      
      // フィルタリング
      if (params.employeeId && record['社員ID'] !== params.employeeId) continue;
      if (params.date && record['日付'] !== params.date) continue;
      
      records.push(record);
    }
    
    return { status: 'success', data: records };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

// OPTIONSリクエストの処理（CORS対応）
function doOptions() {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}
```

### 4. スクリプトをデプロイ
1. Apps Scriptエディタで「デプロイ」→「新しいデプロイ」をクリック
2. 歯車アイコンをクリックし、「ウェブアプリ」を選択
3. 以下の設定を行います：
   - **説明**: 勤怠管理システムAPI
   - **次のユーザーとして実行**: 自分
   - **アクセスできるユーザー**: 全員
4. 「デプロイ」をクリック

### 5. Web App URLを取得
デプロイ完了後、表示される「ウェブアプリのURL」をコピーします。
URLは以下のような形式です：
```
https://script.google.com/macros/s/[SCRIPT_ID]/exec
```

### 6. FastAPIの環境変数に設定
取得したURLを`backend_fastapi/.env`ファイルに追加します：

```env
# Google Sheets設定
GOOGLE_SPREADSHEET_ID=1YxafvPVXQ2D3YAJqHTE_2tMhDgo_ZJrhE9nX_aZv2c4
GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/[YOUR_SCRIPT_ID]/exec

# APIサーバー設定
HOST=0.0.0.0
PORT=8000
```

### 7. FastAPIサーバーを再起動
```bash
# サーバーを再起動して設定を反映
uvicorn main:app --reload --port 8000
```

## 🧪 動作確認

### 接続テスト
```bash
curl http://localhost:8000/sheets/test
```

成功すると以下のようなレスポンスが返ります：
```json
{
  "success": true,
  "message": "Google Apps Script接続テスト成功",
  "scriptResponse": {
    "status": "success",
    "message": "Google Apps Script is working!"
  }
}
```

## ⚠️ 注意事項

1. **権限の確認**: 初回実行時に権限の承認が必要な場合があります
2. **URLの更新**: スクリプトを再デプロイした場合、新しいURLが生成されることがあります
3. **エラー処理**: スプレッドシートの構造を変更する場合は、スクリプトの調整が必要です

## 🔧 トラブルシューティング

### エラー: "認証が必要です"
→ Apps Scriptの実行権限を「全員」に設定してください

### エラー: "スクリプトが見つかりません"
→ URLが正しくコピーされているか確認してください

### エラー: "CORS エラー"
→ Apps ScriptのdoGet/doPost関数でCORSヘッダーが正しく設定されているか確認してください