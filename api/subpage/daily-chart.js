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
    
    // Process data using the same logic as Python backend
    const result = processAttendanceData(records, parseInt(days), parseInt(top_users), parseInt(month_offset));
    
    res.status(200).json(result);
    
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

function processAttendanceData(records, days, topUsers, monthOffset) {
  // Step 1: Collect all timestamps by user
  const userAllTimestamps = {};
  
  records.forEach(record => {
    const userName = record['ユーザー'] || '';
    const date = record['日付'] || '';
    const time = record['時間'] || '';
    const status = record['ステータス'] || '';
    const message = record['メッセージ'] || '';
    const workingHours = record['合計稼働時間'] || '';
    
    if (!userName || !date || !time || !status) return;
    
    if (!userAllTimestamps[userName]) {
      userAllTimestamps[userName] = [];
    }
    
    // Store timestamp
    userAllTimestamps[userName].push({
      date,
      time,
      status: status.toLowerCase().trim(),
      message,
      workingHours,
      datetimeStr: `${date} ${time.padStart(5, '0')}`  // For sorting
    });
  });
  
  // Step 2: Process each user's timestamps
  const userTimeData = {};
  
  Object.keys(userAllTimestamps).forEach(userName => {
    const timestamps = userAllTimestamps[userName];
    
    // Sort chronologically
    timestamps.sort((a, b) => a.datetimeStr.localeCompare(b.datetimeStr));
    
    // Initialize user data
    userTimeData[userName] = {
      dailyHours: {},
      monthlyHours: {},
      totalMinutes: 0,
      workDays: 0
    };
    
    // Process start/end pairs
    let currentStart = null;
    
    for (let i = 0; i < timestamps.length; i++) {
      const ts = timestamps[i];
      
      if (ts.status === 's' || ts.status === '開始' || ts.status === 'start') {
        currentStart = ts;
      } else if (ts.status === 'f' || ts.status === '終了' || ts.status === 'end') {
        let workMinutes = 0;
        
        // Check for pre-calculated hours first
        if (ts.workingHours && ts.workingHours.trim()) {
          if (ts.workingHours.includes(':')) {
            // Format: "H:MM:SS"
            const parts = ts.workingHours.split(':');
            workMinutes = (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
          } else {
            // Pure minutes format
            workMinutes = parseInt(ts.workingHours) || 0;
          }
          
          // Use the work date
          const workDate = currentStart ? currentStart.date : ts.date;
          
          if (workMinutes > 0 && workMinutes < 24 * 60) {
            addWorkMinutes(userTimeData[userName], workDate, workMinutes);
          }
          
          currentStart = null;
        } else if (currentStart) {
          // Calculate from start/end times
          const startTime = parseTime(currentStart.time);
          const endTime = parseTime(ts.time);
          
          if (startTime !== null && endTime !== null) {
            // Handle day crossing
            if (currentStart.date !== ts.date || endTime < startTime) {
              workMinutes = (24 * 60 - startTime) + endTime;
            } else {
              workMinutes = endTime - startTime;
            }
            
            if (workMinutes > 0 && workMinutes < 24 * 60) {
              addWorkMinutes(userTimeData[userName], currentStart.date, workMinutes);
            }
          }
          
          currentStart = null;
        }
      }
    }
  });
  
  // Step 3: Calculate target month
  const now = new Date();
  let targetYear = now.getFullYear();
  let targetMonth = now.getMonth() + 1;
  
  // Apply month offset
  if (monthOffset > 0) {
    targetMonth -= monthOffset;
    while (targetMonth <= 0) {
      targetMonth += 12;
      targetYear--;
    }
  }
  
  // Current month string for filtering
  const currentMonthStr = `${targetYear}/${String(targetMonth).padStart(2, '0')}`;
  
  // Step 4: Calculate monthly work minutes for current month
  const userMonthlyWorkMinutes = {};
  
  Object.keys(userTimeData).forEach(userName => {
    let totalMinutesThisMonth = 0;
    
    // Sum up work minutes for dates in current month
    Object.keys(userTimeData[userName].dailyHours).forEach(dateStr => {
      if (dateStr.startsWith(currentMonthStr)) {
        totalMinutesThisMonth += userTimeData[userName].dailyHours[dateStr].workMinutes;
      }
    });
    
    userMonthlyWorkMinutes[userName] = totalMinutesThisMonth;
  });
  
  // Step 5: Sort users by monthly work time (matching Python backend logic)
  const sortedUsers = Object.keys(userTimeData)
    .filter(user => userMonthlyWorkMinutes[user] > 0)
    .sort((a, b) => userMonthlyWorkMinutes[b] - userMonthlyWorkMinutes[a])
    .slice(0, topUsers);
  
  console.log(`Top users for ${currentMonthStr}:`, sortedUsers.slice(0, 5));
  
  // Step 6: Generate date list
  let startDate, endDate;
  
  if (monthOffset > 0 || days === 31) {
    // Show full month
    startDate = new Date(targetYear, targetMonth - 1, 1);
    if (targetMonth === 12) {
      endDate = new Date(targetYear, 11, 31);
    } else {
      endDate = new Date(targetYear, targetMonth, 0); // Last day of month
    }
  } else {
    // Show last N days
    endDate = now;
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
  }
  
  // Step 7: Generate chart data
  const chartData = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dateKey = `${currentDate.getFullYear()}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getDate()).padStart(2, '0')}`;
    const displayDate = (days === 31 && startDate.getDate() === 1) 
      ? String(currentDate.getDate()).padStart(2, '0')
      : `${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getDate()).padStart(2, '0')}`;
    
    const dayData = { 
      date: displayDate
    };
    
    sortedUsers.forEach(userName => {
      const dayInfo = userTimeData[userName]?.dailyHours[dateKey];
      const minutes = dayInfo ? dayInfo.workMinutes : 0;
      
      if (minutes > 0) {
        const hours = minutes / 60;
        dayData[userName] = Math.round(hours * 10) / 10;
        
        const wholeHours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        dayData[`${userName}_formatted`] = mins > 0 
          ? `${wholeHours}時間${mins}分`
          : `${wholeHours}時間`;
      } else {
        dayData[userName] = null;
        dayData[`${userName}_formatted`] = null;
      }
    });
    
    chartData.push(dayData);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Step 8: Generate user configs with colors
  const userConfigs = {};
  const colors = [
    'hsl(265, 70%, 50%)', 'hsl(340, 70%, 50%)', 'hsl(45, 70%, 50%)',
    'hsl(120, 70%, 50%)', 'hsl(200, 70%, 50%)', 'hsl(15, 70%, 50%)',
    'hsl(300, 70%, 50%)', 'hsl(180, 70%, 50%)', 'hsl(60, 70%, 50%)',
    'hsl(240, 70%, 50%)', 'hsl(90, 70%, 50%)', 'hsl(150, 70%, 50%)',
    'hsl(30, 70%, 50%)', 'hsl(270, 70%, 50%)', 'hsl(330, 70%, 50%)'
  ];
  
  sortedUsers.forEach((userName, i) => {
    const totalMinutes = userMonthlyWorkMinutes[userName];
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    userConfigs[userName] = {
      label: userName,
      color: colors[i] || `hsl(${(i * 360 / topUsers)}, 70%, 50%)`,
      work_hours_this_month: minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`,
      work_minutes_this_month: totalMinutes
    };
  });
  
  return {
    success: true,
    chart_data: chartData,
    user_configs: userConfigs,
    period: days === 31 ? `${targetYear}年${targetMonth}月` : `過去${days}日間`,
    timestamp: new Date().toISOString()
  };
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

function addWorkMinutes(userData, date, minutes) {
  // Add to daily hours
  if (!userData.dailyHours[date]) {
    userData.dailyHours[date] = { workMinutes: 0 };
  }
  userData.dailyHours[date].workMinutes += minutes;
  
  // Add to monthly hours
  const [year, month] = date.split('/').slice(0, 2);
  const monthKey = `${year}-${parseInt(month)}`;  // Remove leading zero for consistency
  
  if (!userData.monthlyHours[monthKey]) {
    userData.monthlyHours[monthKey] = { workMinutes: 0 };
  }
  userData.monthlyHours[monthKey].workMinutes += minutes;
  
  userData.totalMinutes += minutes;
}