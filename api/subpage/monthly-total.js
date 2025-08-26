import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // クエリパラメータから期間を取得（デフォルトは過去12ヶ月）
  const { months = 12 } = req.query;
  
  try {
    // CSVファイルを読み込み (dataディレクトリから読み込み、Pythonバックエンドと統一)
    const csvPath = path.join(process.cwd(), 'data', 'attendance_data.csv');
    let csvData;
    
    try {
      csvData = fs.readFileSync(csvPath, 'utf8');
    } catch (error) {
      console.error('CSV read error:', error);
      return res.status(200).json({
        success: false,
        message: 'CSV file not found',
        monthly_data: [],
        user_configs: {}
      });
    }
    
    // CSV解析
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true
    });
    
    // ガイドラインに従った計算ロジック（Pythonバックエンドと同じ）
    const userAllTimestamps = {};
    
    // すべてのレコードをユーザーごとにグループ化
    records.forEach(record => {
      const userName = record['ユーザー'] || '';
      const date = record['日付'] || '';
      const time = record['時間'] || '';
      const status = record['ステータス'] || '';
      const rawStatus = record['生ステータス'] || '';
      const message = record['メッセージ'] || rawStatus || '';
      
      if (!userName || !date || !time) return;
      
      if (!userAllTimestamps[userName]) {
        userAllTimestamps[userName] = [];
      }
      
      // ステータスを正規化
      const normalizedStatus = parseStatus(status, message);
      if (!normalizedStatus) return;
      
      // 特定時刻の指定があるかチェック
      const specificTime = parseSpecificTimeFromMessage(message);
      
      // 実際の時刻を決定
      let actualTime;
      let adjustmentMinutes = null;
      
      if (specificTime) {
        actualTime = specificTime;
        adjustmentMinutes = null; // 特定時刻指定の場合は調整なし
      } else {
        actualTime = time;
        // 調整時間を取得
        adjustmentMinutes = parseAdjustmentFromMessage(message);
      }
      
      // タイムスタンプを記録
      userAllTimestamps[userName].push({
        date: date,
        time: actualTime,
        status: normalizedStatus,
        adjustmentMinutes: adjustmentMinutes,
        originalStatus: status,
        message: message,
        datetimeStr: `${date} ${actualTime.padStart(5, '0')}`
      });
    });
    
    // 各ユーザーの勤務時間を計算
    const userWorkData = {};
    
    Object.keys(userAllTimestamps).forEach(userName => {
      const timestamps = userAllTimestamps[userName];
      
      // タイムスタンプを時系列順にソート
      timestamps.sort((a, b) => a.datetimeStr.localeCompare(b.datetimeStr));
      
      // 勤務セッションを抽出
      const workSessions = [];
      let currentStart = null;
      
      for (let i = 0; i < timestamps.length; i++) {
        const ts = timestamps[i];
        
        if (ts.status === 'start') {
          // 連続する開始時刻の場合、前のを無視
          if (currentStart) {
            console.log(`警告: ${userName} - 連続する開始時刻を検出`);
          }
          currentStart = ts;
        } else if (ts.status === 'end') {
          if (!currentStart) {
            console.log(`警告: ${userName} - 開始時刻なしの終了`);
            continue;
          }
          
          // 勤務時間を計算
          const startTime = parseTime(currentStart.time);
          const endTime = parseTime(ts.time);
          
          if (startTime !== null && endTime !== null) {
            // 基本の勤務時間を計算
            let workMinutes = endTime - startTime;
            
            // 日跨ぎの処理
            if (currentStart.date !== ts.date) {
              const startDate = new Date(currentStart.date.replace(/\//g, '-'));
              const endDate = new Date(ts.date.replace(/\//g, '-'));
              const daysDiff = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
              
              if (daysDiff > 0) {
                workMinutes += daysDiff * 24 * 60;
              }
            } else if (workMinutes < 0) {
              // 同日でも終了が開始より前 = 日跨ぎ
              workMinutes += 24 * 60;
            }
            
            // 調整時間を適用（ガイドラインに従う）
            if (currentStart.adjustmentMinutes !== null) {
              workMinutes += currentStart.adjustmentMinutes;
            }
            if (ts.adjustmentMinutes !== null) {
              workMinutes += ts.adjustmentMinutes;
            }
            
            // 異常値チェック
            if (workMinutes > 0 && workMinutes < 24 * 60) {
              workSessions.push({
                date: currentStart.date,
                workMinutes: workMinutes
              });
            }
          }
          
          currentStart = null;
        }
      }
      
      // セッションを日付ごとに集計
      if (!userWorkData[userName]) {
        userWorkData[userName] = {};
      }
      
      workSessions.forEach(session => {
        if (!userWorkData[userName][session.date]) {
          userWorkData[userName][session.date] = 0;
        }
        userWorkData[userName][session.date] += session.workMinutes;
      });
    });
    
    // 月ごとの集計データを作成
    const monthlyTotals = {};
    const allMonths = new Set();
    
    Object.keys(userWorkData).forEach(userName => {
      if (!monthlyTotals[userName]) {
        monthlyTotals[userName] = {};
      }
      
      Object.keys(userWorkData[userName]).forEach(date => {
        const monthKey = date.substring(0, 7); // YYYY/MM形式
        allMonths.add(monthKey);
        
        if (!monthlyTotals[userName][monthKey]) {
          monthlyTotals[userName][monthKey] = 0;
        }
        monthlyTotals[userName][monthKey] += userWorkData[userName][date];
      });
    });
    
    // 月リストをソート（新しい順）
    const sortedMonths = Array.from(allMonths).sort().reverse().slice(0, parseInt(months));
    
    // 全期間での合計でソートして上位ユーザーを取得
    const totalMinutes = {};
    Object.keys(monthlyTotals).forEach(userName => {
      totalMinutes[userName] = 0;
      sortedMonths.forEach(month => {
        totalMinutes[userName] += monthlyTotals[userName][month] || 0;
      });
    });
    
    // アクティブユーザーのみを抽出
    const activeUsers = Object.entries(totalMinutes)
      .filter(([_, total]) => total > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
    
    // グラフ用データを生成
    const monthlyData = sortedMonths.map(month => {
      const data = { month: month.replace('/', '-') };
      
      activeUsers.forEach(userName => {
        const minutes = monthlyTotals[userName]?.[month] || 0;
        if (minutes > 0) {
          data[userName] = Math.round((minutes / 60) * 10) / 10; // 時間に変換（小数第1位まで）
          const hours = Math.floor(minutes / 60);
          const mins = Math.round(minutes % 60);
          data[`${userName}_formatted`] = `${hours}時間${mins}分`;
        } else {
          data[userName] = 0;
          data[`${userName}_formatted`] = null;
        }
      });
      
      return data;
    });
    
    // ユーザー設定を生成
    const colors = [
      '#84CC16', '#6366F1', '#EC4899', '#10B981', '#F97316',
      '#14B8A6', '#EF4444', '#06B6D4', '#FB7185', '#0EA5E9',
      '#EAB308', '#8B5CF6', '#4F46E5', '#F59E0B', '#A855F7',
      '#22D3EE', '#FACC15', '#A78BFA', '#FB923C', '#4ADE80',
      '#F87171', '#60A5FA', '#C084FC', '#FDE047', '#86EFAC',
      '#FCA5A5', '#93C5FD', '#D8B4FE', '#FDE68A', '#BBF7D0'
    ];
    
    const userConfigs = {};
    activeUsers.forEach((userName, i) => {
      const total = totalMinutes[userName] || 0;
      const hours = Math.floor(total / 60);
      const mins = Math.round(total % 60);
      
      userConfigs[userName] = {
        label: userName,
        color: colors[i % colors.length],
        total_hours: `${hours}h${mins}m`,
        total_minutes: total
      };
    });
    
    return res.status(200).json({
      success: true,
      chart_data: monthlyData.reverse(), // 古い順に並べ替え（フロントエンド用にchart_dataとして返す）
      monthly_data: monthlyData, // 互換性のため
      user_configs: userConfigs,
      period: `過去${sortedMonths.length}ヶ月`,
      months: sortedMonths.reverse(),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      monthly_data: [],
      user_configs: {}
    });
  }
}

// 時刻を分に変換
function parseTime(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  return null;
}

// ステータスを正規化
function parseStatus(status, message) {
  if (!status) return null;
  
  const statusLower = status.toLowerCase().trim();
  const messageLower = (message || '').toLowerCase().trim();
  
  // ステータスから判定
  if (statusLower === 's' || statusLower === '開始' || statusLower === 'start') {
    return 'start';
  }
  if (statusLower === 'f' || statusLower === '終了' || statusLower === 'end') {
    return 'end';
  }
  
  // メッセージから判定
  if (messageLower.startsWith('s')) return 'start';
  if (messageLower.startsWith('f')) return 'end';
  
  return null;
}

// メッセージから特定時刻を抽出
function parseSpecificTimeFromMessage(message) {
  if (!message) return null;
  
  const messageLower = message.toLowerCase().trim();
  
  // 特定時刻のパターンをチェック（s/fの後に時刻）
  const match = messageLower.match(/[sf]?\s*(\d{1,2}):(\d{2})/);
  if (match) {
    const hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return `${hour}:${minute.toString().padStart(2, '0')}`;
    }
  }
  
  return null;
}

// メッセージから調整時間を抽出
function parseAdjustmentFromMessage(message) {
  if (!message) return null;
  
  const messageLower = message.toLowerCase().trim();
  
  // 特定時刻指定がある場合は調整時間なし
  if (parseSpecificTimeFromMessage(message)) {
    return null;
  }
  
  // 調整パターンをチェック
  const match = messageLower.match(/[sf]?\s*([+-])\s*(\d+)/);
  if (match) {
    const sign = match[1];
    const value = parseInt(match[2]);
    return sign === '+' ? value : -value;
  }
  
  return null;
}