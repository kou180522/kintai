export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const { days = 31, top_users = 15, month_offset = 0 } = req.query;
  
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
    
    console.log(`Loaded ${records.length} records`);
    
    // Process attendance data
    const userTimeData = {};
    const userSessions = {}; // Track start times for each user
    
    // Sort records by date and time
    records.sort((a, b) => {
      const dateA = `${a['日付']} ${a['時間']}`;
      const dateB = `${b['日付']} ${b['時間']}`;
      return dateA.localeCompare(dateB);
    });
    
    // Process each record
    records.forEach(record => {
      const userName = record['ユーザー'] || '';
      const date = record['日付'] || '';
      const time = record['時間'] || '';
      const status = (record['ステータス'] || '').toLowerCase().trim();
      
      if (!userName || !date || !time) return;
      
      // Initialize user data
      if (!userTimeData[userName]) {
        userTimeData[userName] = {
          dailyMinutes: {},
          totalMinutes: 0
        };
      }
      
      if (!userSessions[userName]) {
        userSessions[userName] = null;
      }
      
      // Process start/end pairs
      if (status === 's' || status === '開始') {
        // Start session
        userSessions[userName] = { date, time };
      } else if (status === 'f' || status === '終了') {
        // End session - calculate work time
        if (userSessions[userName]) {
          const startTime = parseTime(userSessions[userName].time);
          const endTime = parseTime(time);
          
          if (startTime !== null && endTime !== null) {
            let workMinutes = 0;
            
            // Handle day crossing
            if (userSessions[userName].date !== date || endTime < startTime) {
              workMinutes = (24 * 60 - startTime) + endTime;
            } else {
              workMinutes = endTime - startTime;
            }
            
            // Add to daily total (use start date)
            if (workMinutes > 0 && workMinutes < 24 * 60) {
              const workDate = userSessions[userName].date;
              if (!userTimeData[userName].dailyMinutes[workDate]) {
                userTimeData[userName].dailyMinutes[workDate] = 0;
              }
              userTimeData[userName].dailyMinutes[workDate] += workMinutes;
              userTimeData[userName].totalMinutes += workMinutes;
            }
          }
          
          userSessions[userName] = null;
        }
      }
    });
    
    // Calculate target month
    const now = new Date();
    let targetYear = now.getFullYear();
    let targetMonth = now.getMonth() + 1;
    
    if (monthOffset > 0) {
      targetMonth -= monthOffset;
      while (targetMonth <= 0) {
        targetMonth += 12;
        targetYear--;
      }
    }
    
    const targetMonthStr = `${targetYear}/${String(targetMonth).padStart(2, '0')}`;
    console.log(`Target month: ${targetMonthStr}`);
    
    // Calculate monthly totals for target month
    const monthlyTotals = {};
    Object.keys(userTimeData).forEach(userName => {
      monthlyTotals[userName] = 0;
      Object.keys(userTimeData[userName].dailyMinutes).forEach(date => {
        if (date.startsWith(targetMonthStr)) {
          monthlyTotals[userName] += userTimeData[userName].dailyMinutes[date];
        }
      });
    });
    
    // Sort users by monthly total
    const sortedUsers = Object.keys(monthlyTotals)
      .filter(user => monthlyTotals[user] > 0)
      .sort((a, b) => monthlyTotals[b] - monthlyTotals[a])
      .slice(0, parseInt(top_users));
    
    console.log(`Top users for ${targetMonthStr}:`, sortedUsers.slice(0, 5));
    
    // Generate chart data
    const chartData = [];
    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    
    for (let day = 1; day <= Math.min(lastDay, parseInt(days)); day++) {
      const dateKey = `${targetYear}/${String(targetMonth).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
      const dayData = { 
        date: String(day).padStart(2, '0')
      };
      
      sortedUsers.forEach(userName => {
        const minutes = userTimeData[userName]?.dailyMinutes[dateKey] || 0;
        
        if (minutes > 0) {
          dayData[userName] = Math.round((minutes / 60) * 10) / 10;
          
          const hours = Math.floor(minutes / 60);
          const mins = minutes % 60;
          dayData[`${userName}_formatted`] = mins > 0 
            ? `${hours}時間${mins}分`
            : `${hours}時間`;
        } else {
          dayData[userName] = null;
          dayData[`${userName}_formatted`] = null;
        }
      });
      
      chartData.push(dayData);
    }
    
    // Generate user configs
    const userConfigs = {};
    const colors = [
      'hsl(265, 70%, 50%)', 'hsl(340, 70%, 50%)', 'hsl(45, 70%, 50%)',
      'hsl(120, 70%, 50%)', 'hsl(200, 70%, 50%)', 'hsl(15, 70%, 50%)',
      'hsl(300, 70%, 50%)', 'hsl(180, 70%, 50%)', 'hsl(60, 70%, 50%)',
      'hsl(240, 70%, 50%)', 'hsl(90, 70%, 50%)', 'hsl(150, 70%, 50%)',
      'hsl(30, 70%, 50%)', 'hsl(270, 70%, 50%)', 'hsl(330, 70%, 50%)'
    ];
    
    sortedUsers.forEach((userName, i) => {
      const totalMinutes = monthlyTotals[userName];
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      
      userConfigs[userName] = {
        label: userName,
        color: colors[i] || `hsl(${(i * 360 / topUsers)}, 70%, 50%)`,
        work_hours_this_month: minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`,
        work_minutes_this_month: totalMinutes
      };
    });
    
    return res.status(200).json({
      success: true,
      chart_data: chartData,
      user_configs: userConfigs,
      period: `${targetYear}年${targetMonth}月`,
      timestamp: new Date().toISOString()
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

function parseTime(timeStr) {
  if (!timeStr) return null;
  
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    return hours * 60 + minutes;
  }
  
  return null;
}