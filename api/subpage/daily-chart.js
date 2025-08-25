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
  let targetMonth = now.getMonth() + 1 - monthOffset;
  
  // Adjust for month boundaries
  while (targetMonth <= 0) {
    targetMonth += 12;
    targetYear--;
  }
  
  // For now, use August 2025 as the latest data
  if (monthOffset === 0 && targetYear === 2024) {
    targetYear = 2025;
    targetMonth = 8;
  }
  
  const targetMonthKey = `${targetYear}-${targetMonth}`;
  console.log(`Target month: ${targetMonthKey}`);
  
  // Step 4: Get monthly totals for sorting
  const userMonthlyMinutes = {};
  
  Object.keys(userTimeData).forEach(userName => {
    const monthData = userTimeData[userName].monthlyHours[targetMonthKey];
    userMonthlyMinutes[userName] = monthData ? monthData.workMinutes : 0;
  });
  
  // Step 5: Sort users by monthly work time
  const sortedUsers = Object.keys(userTimeData)
    .filter(user => userMonthlyMinutes[user] > 0)
    .sort((a, b) => userMonthlyMinutes[b] - userMonthlyMinutes[a])
    .slice(0, topUsers);
  
  console.log(`Top users for ${targetMonthKey}:`, sortedUsers.slice(0, 5));
  
  // Step 6: Generate chart data
  const chartData = [];
  const lastDay = new Date(targetYear, targetMonth, 0).getDate();
  
  for (let day = 1; day <= Math.min(lastDay, days); day++) {
    const dateKey = `${targetYear}/${String(targetMonth).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    const dayData = { 
      date: String(day).padStart(2, '0')
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
  }
  
  // Step 7: Generate user configs
  const userConfigs = {};
  const colors = [
    'hsl(265, 70%, 50%)', 'hsl(340, 70%, 50%)', 'hsl(45, 70%, 50%)',
    'hsl(120, 70%, 50%)', 'hsl(200, 70%, 50%)', 'hsl(15, 70%, 50%)',
    'hsl(300, 70%, 50%)', 'hsl(180, 70%, 50%)', 'hsl(60, 70%, 50%)',
    'hsl(240, 70%, 50%)', 'hsl(90, 70%, 50%)', 'hsl(150, 70%, 50%)',
    'hsl(30, 70%, 50%)', 'hsl(270, 70%, 50%)', 'hsl(330, 70%, 50%)'
  ];
  
  sortedUsers.forEach((userName, i) => {
    userConfigs[userName] = {
      label: userName,
      color: colors[i] || `hsl(${(i * 360 / topUsers)}, 70%, 50%)`
    };
  });
  
  return {
    success: true,
    chart_data: chartData,
    user_configs: userConfigs
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
  const monthKey = `${year}-${month}`;
  
  if (!userData.monthlyHours[monthKey]) {
    userData.monthlyHours[monthKey] = { workMinutes: 0 };
  }
  userData.monthlyHours[monthKey].workMinutes += minutes;
  
  userData.totalMinutes += minutes;
}