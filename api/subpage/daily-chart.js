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
  
  // クエリパラメータから取得
  const { days = 31, top_users = 20, month_offset = 0 } = req.query;
  const daysNum = parseInt(days);
  const topUsersNum = parseInt(top_users);
  const monthOffsetNum = parseInt(month_offset);
  
  try {
    // CSVファイルを読み込み (dataディレクトリから読み込み)
    const csvPath = path.join(process.cwd(), 'data', 'attendance_data.csv');
    let csvData;
    
    try {
      csvData = fs.readFileSync(csvPath, 'utf8');
    } catch (error) {
      console.error('CSV read error:', error);
      return res.status(200).json({
        success: false,
        message: 'CSV file not found',
        chart_data: [],
        user_configs: {}
      });
    }
    
    // CSV解析
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true
    });
    
    // ガイドラインに従った計算ロジック
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
        adjustmentMinutes = null;
      } else {
        actualTime = time;
        adjustmentMinutes = parseAdjustmentFromMessage(message);
      }
      
      // タイムスタンプを記録
      userAllTimestamps[userName].push({
        date: date,
        time: actualTime,
        status: normalizedStatus,
        adjustmentMinutes: adjustmentMinutes,
        datetimeStr: `${date} ${actualTime.padStart(5, '0')}`
      });
    });
    
    // 各ユーザーの日別勤務時間を計算
    const userDailyData = {};
    
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
          currentStart = ts;
        } else if (ts.status === 'end' && currentStart) {
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
              workMinutes += 24 * 60;
            }
            
            // 調整時間を適用
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
      if (!userDailyData[userName]) {
        userDailyData[userName] = {};
      }
      
      workSessions.forEach(session => {
        if (!userDailyData[userName][session.date]) {
          userDailyData[userName][session.date] = 0;
        }
        userDailyData[userName][session.date] += session.workMinutes;
      });
    });
    
    // 月別の合計を計算してトップユーザーを選定
    const now = new Date();
    let targetYear = now.getFullYear();
    let targetMonth = now.getMonth() + 1 - monthOffsetNum;
    
    while (targetMonth <= 0) {
      targetMonth += 12;
      targetYear--;
    }
    
    const targetMonthStr = `${targetYear}/${targetMonth.toString().padStart(2, '0')}`;
    
    // 該当月の合計時間でユーザーをソート
    const monthlyTotals = {};
    Object.keys(userDailyData).forEach(userName => {
      monthlyTotals[userName] = 0;
      Object.keys(userDailyData[userName]).forEach(date => {
        if (date.startsWith(targetMonthStr)) {
          monthlyTotals[userName] += userDailyData[userName][date];
        }
      });
    });
    
    // トップユーザーを選定
    const sortedUsers = Object.entries(monthlyTotals)
      .filter(([_, total]) => total > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topUsersNum)
      .map(([name]) => name);
    
    // 日付リストを作成
    const dateList = [];
    if (daysNum === 31 && monthOffsetNum >= 0) {
      // 月単位表示
      let lastDay;
      
      // 今月の場合は今日まで、過去の月は月末まで
      if (monthOffsetNum === 0) {
        // 今月の場合は現在の日付まで
        const now = new Date();
        // 現在の年月と対象の年月が一致しているか確認
        if (targetYear === now.getFullYear() && targetMonth === now.getMonth() + 1) {
          lastDay = now.getDate(); // 今日の日付番号を使用
        } else {
          // もし対象月が現在月と異なる場合は月末まで
          lastDay = new Date(targetYear, targetMonth, 0).getDate();
        }
      } else {
        // 過去の月は月末まで
        lastDay = new Date(targetYear, targetMonth, 0).getDate();
      }
      
      // ログ出力して確認
      console.log(`Target: ${targetYear}/${targetMonth}, LastDay: ${lastDay}, Now: ${new Date().toISOString()}`);
      
      for (let d = 1; d <= lastDay; d++) {
        const dateStr = `${targetYear}/${targetMonth.toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}`;
        dateList.push({ display: d.toString(), full: dateStr });
      }
    } else {
      // 指定日数分
      for (let i = daysNum - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
        dateList.push({ display: `${date.getMonth() + 1}/${date.getDate()}`, full: dateStr });
      }
    }
    
    // グラフデータを作成
    const chartData = [];
    dateList.forEach(({ display, full }) => {
      const dataPoint = { date: display };
      
      sortedUsers.forEach(userName => {
        const minutes = userDailyData[userName]?.[full] || 0;
        if (minutes > 0) {
          const hours = minutes / 60;
          dataPoint[userName] = Math.round(hours * 100) / 100;
          const h = Math.floor(minutes / 60);
          const m = Math.round(minutes % 60);
          dataPoint[`${userName}_formatted`] = `${h}時間${m}分`;
        } else {
          dataPoint[userName] = null;
          dataPoint[`${userName}_formatted`] = null;
        }
      });
      
      chartData.push(dataPoint);
    });
    
    // ユーザー設定を生成
    const colors = [
      '#84CC16', '#6366F1', '#EC4899', '#10B981', '#F97316',
      '#14B8A6', '#EF4444', '#06B6D4', '#FB7185', '#0EA5E9',
      '#EAB308', '#8B5CF6', '#4F46E5', '#F59E0B', '#A855F7',
      '#22D3EE', '#FACC15', '#A78BFA', '#FB923C', '#4ADE80',
      '#F87171', '#60A5FA', '#C084FC', '#FDE047', '#86EFAC'
    ];
    
    const userConfigs = {};
    sortedUsers.forEach((userName, i) => {
      const totalMinutes = monthlyTotals[userName];
      const hours = Math.floor(totalMinutes / 60);
      const mins = Math.round(totalMinutes % 60);
      
      userConfigs[userName] = {
        label: userName,
        color: colors[i % colors.length],
        work_hours_this_month: `${hours}h${mins}m`,
        work_minutes_this_month: totalMinutes
      };
    });
    
    return res.status(200).json({
      success: true,
      chart_data: chartData,
      user_configs: userConfigs,
      period: monthOffsetNum === 0 ? '今月' : `${Math.abs(monthOffsetNum)}ヶ月前`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      chart_data: [],
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
  
  if (statusLower === 's' || statusLower === '開始' || statusLower === 'start') {
    return 'start';
  }
  if (statusLower === 'f' || statusLower === '終了' || statusLower === 'end') {
    return 'end';
  }
  
  if (messageLower.startsWith('s')) return 'start';
  if (messageLower.startsWith('f')) return 'end';
  
  return null;
}

// メッセージから特定時刻を抽出
function parseSpecificTimeFromMessage(message) {
  if (!message) return null;
  
  const messageLower = message.toLowerCase().trim();
  
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
  
  if (parseSpecificTimeFromMessage(message)) {
    return null;
  }
  
  const match = messageLower.match(/[sf]?\s*([+-])\s*(\d+)/);
  if (match) {
    const sign = match[1];
    const value = parseInt(match[2]);
    return sign === '+' ? value : -value;
  }
  
  return null;
}