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
        continue;
      }
    }
    
    if (!csvData) {
      return res.status(500).json({
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
        userSessions[userName] = {};
      }
      
      // Extract date key for session tracking
      const dateKey = date.replace(/\//g, '-');
      
      // Process start/end pairs
      if (status === 's' || status === '開始') {
        // Start session
        userSessions[userName][dateKey] = { date, time };
      } else if (status === 'f' || status === '終了') {
        // End session - calculate work time
        if (userSessions[userName][dateKey]) {
          const startTime = parseTime(userSessions[userName][dateKey].time);
          const endTime = parseTime(time);
          
          if (startTime !== null && endTime !== null) {
            let workMinutes = 0;
            
            // Handle day crossing or reversed times
            if (endTime < startTime) {
              workMinutes = (24 * 60 - startTime) + endTime;
            } else {
              workMinutes = endTime - startTime;
            }
            
            // Add to daily total
            if (workMinutes > 0 && workMinutes < 24 * 60) {
              if (!userTimeData[userName].dailyMinutes[date]) {
                userTimeData[userName].dailyMinutes[date] = 0;
              }
              userTimeData[userName].dailyMinutes[date] += workMinutes;
              userTimeData[userName].totalMinutes += workMinutes;
            }
          }
          
          delete userSessions[userName][dateKey];
        }
      }
    });
    
    // Calculate target month
    const now = new Date();
    let targetYear = now.getFullYear();
    let targetMonth = now.getMonth() + 1;
    
    // Apply month offset
    if (month_offset && parseInt(month_offset) > 0) {
      targetMonth -= parseInt(month_offset);
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
    
    // Sort users by monthly total and get top N
    const sortedUsers = Object.keys(monthlyTotals)
      .filter(user => monthlyTotals[user] > 0)
      .sort((a, b) => monthlyTotals[b] - monthlyTotals[a])
      .slice(0, parseInt(top_users));
    
    console.log(`Top ${sortedUsers.length} users for ${targetMonthStr}:`, sortedUsers.slice(0, 5));
    
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
          // Convert to decimal hours (e.g., 7.18 for 7h11m)
          dayData[userName] = Math.round((minutes / 60) * 100) / 100;
          
          // Format as string (e.g., "7時間11分")
          const hours = Math.floor(minutes / 60);
          const mins = Math.round(minutes % 60);
          dayData[`${userName}_formatted`] = mins > 0 
            ? `${hours}時間${mins}分`
            : `${hours}時間0分`;
        } else {
          dayData[userName] = null;
          dayData[`${userName}_formatted`] = null;
        }
      });
      
      chartData.push(dayData);
    }
    
    // Generate user configs with colors
    const userConfigs = {};
    
    // Define colors matching Python backend
    const colors = [
      '#84CC16', // Lime
      '#6366F1', // Indigo
      '#EC4899', // Pink
      '#10B981', // Emerald
      '#F97316', // Orange
      '#14B8A6', // Teal
      '#EF4444', // Red
      '#06B6D4', // Cyan
      '#FB7185', // Rose
      '#0EA5E9', // Sky
      '#EAB308', // Yellow
      '#8B5CF6', // Violet
      '#4F46E5', // Indigo dark
      '#F59E0B', // Amber
      '#A855F7'  // Purple
    ];
    
    sortedUsers.forEach((userName, i) => {
      const totalMinutes = monthlyTotals[userName] || 0;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = Math.round(totalMinutes % 60);
      
      userConfigs[userName] = {
        label: userName,
        color: colors[i % colors.length],
        work_hours_this_month: minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`,
        work_minutes_this_month: totalMinutes
      };
    });
    
    // Return response
    return res.status(200).json({
      success: true,
      chart_data: chartData,
      user_configs: userConfigs,
      period: '過去31日間',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error processing attendance data:', error);
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