import fs from 'fs';
import path from 'path';

// Google Sheetsの設定
const SHEET_ID = "1YxafvPVXQ2D3YAJqHTE_2tMhDgo_ZJrhE9nX_aZv2c4";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Google Sheetsから最新データを取得
    const response = await fetch(CSV_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch Google Sheets data');
    }
    
    const csvData = await response.text();
    
    // CSVファイルのパスを設定
    const csvPath = path.join(process.cwd(), 'data', 'attendance_data.csv');
    
    // 既存のCSVファイルを読み込んで比較
    let updated = false;
    try {
      const existingData = fs.readFileSync(csvPath, 'utf8');
      if (existingData !== csvData) {
        // データが変更されていれば更新
        fs.writeFileSync(csvPath, csvData, 'utf8');
        updated = true;
        console.log('CSV file updated from Google Sheets');
      }
    } catch (error) {
      // ファイルが存在しない場合は作成
      fs.writeFileSync(csvPath, csvData, 'utf8');
      updated = true;
      console.log('CSV file created from Google Sheets');
    }
    
    return res.status(200).json({
      success: true,
      updated: updated,
      message: updated ? 'データを更新しました' : '変更はありません',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Check now error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking for updates',
      error: error.message
    });
  }
}