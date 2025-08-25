export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    const fs = require('fs');
    const path = require('path');
    const csv = require('csv-parse/sync');
    
    // Read CSV file
    let csvData = null;
    const paths = [
      path.join(process.cwd(), 'public', 'attendance_data.csv'),
      path.join(process.cwd(), 'data', 'attendance_data.csv'),
      '/var/task/public/attendance_data.csv',
      '/var/task/data/attendance_data.csv'
    ];
    
    for (const p of paths) {
      try {
        csvData = fs.readFileSync(p, 'utf8');
        console.log(`CSV loaded from: ${p}`);
        break;
      } catch (e) {
        // Continue
      }
    }
    
    if (!csvData) {
      return res.status(200).json({
        success: false,
        message: 'CSV file not found',
        chart_data: [],
        user_configs: {}
      });
    }
    
    // Parse CSV
    const records = csv.parse(csvData, {
      columns: true,
      skip_empty_lines: true
    });
    
    // シンプルな処理：2025年8月のデータを直接集計
    const august2025Data = {};
    
    records.forEach(record => {
      const userName = record['ユーザー'] || '';
      const date = record['日付'] || '';
      const status = (record['ステータス'] || '').toLowerCase();
      const workHours = record['合計稼働時間'] || '';
      
      // 2025年8月のデータのみ処理
      if (!date.startsWith('2025/08/')) return;
      if (!userName) return;
      
      // 終了レコードで稼働時間がある場合のみ処理
      if (status === 'f' || status === '終了') {
        if (!august2025Data[userName]) {
          august2025Data[userName] = {
            totalMinutes: 0,
            dailyMinutes: {}
          };
        }
        
        // 稼働時間をパース
        let minutes = 0;
        if (workHours && workHours.includes(':')) {
          const parts = workHours.split(':');
          minutes = (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
        }
        
        if (minutes > 0) {
          august2025Data[userName].totalMinutes += minutes;
          
          // 日付ごとに集計
          const day = date.split('/')[2];
          if (!august2025Data[userName].dailyMinutes[day]) {
            august2025Data[userName].dailyMinutes[day] = 0;
          }
          august2025Data[userName].dailyMinutes[day] += minutes;
        }
      }
    });
    
    // 上位5ユーザーを取得
    const sortedUsers = Object.entries(august2025Data)
      .sort((a, b) => b[1].totalMinutes - a[1].totalMinutes)
      .slice(0, 5)
      .map(([name]) => name);
    
    // グラフデータを生成（1日～31日）
    const chartData = [];
    for (let day = 1; day <= 31; day++) {
      const dayStr = String(day).padStart(2, '0');
      const dayData = { date: dayStr };
      
      sortedUsers.forEach(userName => {
        const minutes = august2025Data[userName]?.dailyMinutes[dayStr] || 0;
        if (minutes > 0) {
          dayData[userName] = Math.round((minutes / 60) * 10) / 10;
        } else {
          dayData[userName] = null;
        }
      });
      
      chartData.push(dayData);
    }
    
    // ユーザー設定
    const userConfigs = {};
    const colors = ['hsl(265, 70%, 50%)', 'hsl(340, 70%, 50%)', 'hsl(45, 70%, 50%)', 'hsl(120, 70%, 50%)', 'hsl(200, 70%, 50%)'];
    
    sortedUsers.forEach((userName, i) => {
      userConfigs[userName] = {
        label: userName,
        color: colors[i]
      };
    });
    
    res.status(200).json({
      success: true,
      chart_data: chartData,
      user_configs: userConfigs,
      debug: {
        total_records: records.length,
        august_users: Object.keys(august2025Data).length,
        top_users: sortedUsers,
        sample_data: chartData.slice(0, 5)
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      chart_data: [],
      user_configs: {}
    });
  }
}