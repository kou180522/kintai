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
    // CSVファイルを読み込み
    const csvPath = path.join(process.cwd(), 'public', 'attendance_data.csv');
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
    
    // ユーザーごとの作業時間を集計
    const userWorkData = {};
    const userSessions = {};
    
    // レコードをソート
    records.sort((a, b) => {
      const dateA = `${a['日付']} ${a['時間']}`;
      const dateB = `${b['日付']} ${b['時間']}`;
      return dateA.localeCompare(dateB);
    });
    
    // 各レコードを処理
    records.forEach(record => {
      const userName = record['ユーザー'] || '';
      const date = record['日付'] || '';
      const time = record['時間'] || '';
      const status = (record['ステータス'] || '').toLowerCase().trim();
      const rawStatus = (record['生ステータス'] || '').toLowerCase().trim();
      
      if (!userName || !date) return;
      
      // ユーザーデータの初期化
      if (!userWorkData[userName]) {
        userWorkData[userName] = {};
      }
      
      // セッション管理
      const sessionKey = `${userName}-${date}`;
      
      if (status === 's' || status === '開始') {
        // 開始時刻と調整時間を記録
        const adjustment = parseAdjustment(rawStatus);
        userSessions[sessionKey] = {
          startTime: time,
          startAdjustment: adjustment
        };
      } else if ((status === 'f' || status === '終了') && userSessions[sessionKey]) {
        // 終了時刻で作業時間を計算
        const session = userSessions[sessionKey];
        const startTime = parseTime(session.startTime);
        const endTime = parseTime(time);
        const endAdjustment = parseAdjustment(rawStatus);
        
        if (startTime !== null && endTime !== null) {
          // 基本勤務時間を計算
          let workMinutes = endTime - startTime;
          if (workMinutes < 0) workMinutes += 24 * 60; // 日をまたぐ場合
          
          // 調整時間を適用（ガイドラインに従う）
          workMinutes += session.startAdjustment; // 開始時の調整
          workMinutes += endAdjustment; // 終了時の調整
          
          if (workMinutes > 0 && workMinutes < 24 * 60) {
            if (!userWorkData[userName][date]) {
              userWorkData[userName][date] = 0;
            }
            userWorkData[userName][date] += workMinutes;
          }
        }
        
        delete userSessions[sessionKey];
      }
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
    
    // 各月の合計時間でユーザーをランキング
    const userRankings = {};
    sortedMonths.forEach(month => {
      const monthRanking = [];
      Object.keys(monthlyTotals).forEach(userName => {
        const minutes = monthlyTotals[userName][month] || 0;
        if (minutes > 0) {
          monthRanking.push({ userName, minutes });
        }
      });
      monthRanking.sort((a, b) => b.minutes - a.minutes);
      userRankings[month] = monthRanking; // 全員を含む
    });
    
    // 全期間での合計でソートして上位ユーザーを取得
    const totalMinutes = {};
    Object.keys(monthlyTotals).forEach(userName => {
      totalMinutes[userName] = 0;
      sortedMonths.forEach(month => {
        totalMinutes[userName] += monthlyTotals[userName][month] || 0;
      });
    });
    
    const topUsers = Object.entries(totalMinutes)
      .filter(([_, total]) => total > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
    
    // グラフ用データを生成
    const monthlyData = sortedMonths.map(month => {
      const data = { month: month.replace('/', '-') };
      
      topUsers.forEach(userName => {
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
    
    // ユーザー設定を生成（色を拡張して多数のユーザーに対応）
    const colors = [
      '#84CC16', '#6366F1', '#EC4899', '#10B981', '#F97316',
      '#14B8A6', '#EF4444', '#06B6D4', '#FB7185', '#0EA5E9',
      '#EAB308', '#8B5CF6', '#4F46E5', '#F59E0B', '#A855F7',
      '#22D3EE', '#FACC15', '#A78BFA', '#FB923C', '#4ADE80',
      '#F87171', '#60A5FA', '#C084FC', '#FDE047', '#86EFAC',
      '#FCA5A5', '#93C5FD', '#D8B4FE', '#FDE68A', '#BBF7D0'
    ];
    
    const userConfigs = {};
    topUsers.forEach((userName, i) => {
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
      monthly_data: monthlyData.reverse(), // 古い順に並べ替え
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

function parseTime(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  return null;
}

function parseAdjustment(rawStatus) {
  if (!rawStatus) return 0;
  
  // s+60, f-30 のような形式から調整時間を抽出
  const adjustMatch = rawStatus.match(/[sf]([+-]\d+)/);
  if (adjustMatch) {
    return parseInt(adjustMatch[1]);
  }
  
  return 0;
}