import fs from 'fs';
import path from 'path';

// Google Sheetsの設定
const SHEET_ID = "1YxafvPVXQ2D3YAJqHTE_2tMhDgo_ZJrhE9nX_aZv2c4";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

// 監視状態を管理する変数（実際の本番環境では別の方法で永続化が必要）
let lastCheckTime = null;

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
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
    let needsUpdate = false;
    try {
      const existingData = fs.readFileSync(csvPath, 'utf8');
      if (existingData !== csvData) {
        needsUpdate = true;
      }
    } catch (error) {
      // ファイルが存在しない場合は更新が必要
      needsUpdate = true;
    }
    
    // データが変更されていれば更新
    if (needsUpdate) {
      fs.writeFileSync(csvPath, csvData, 'utf8');
      console.log('CSV file updated from Google Sheets');
    }
    
    // 監視状態を更新
    lastCheckTime = new Date().toISOString();
    
    return res.status(200).json({
      success: true,
      message: needsUpdate ? 'データを更新しました' : '監視を開始しました',
      updated: needsUpdate,
      isMonitoring: true,
      lastCheckTime: lastCheckTime,
      interval: 30
    });
    
  } catch (error) {
    console.error('Monitor start error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error starting monitor',
      error: error.message
    });
  }
}