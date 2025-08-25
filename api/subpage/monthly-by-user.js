export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const { top_users = 15, months = 12 } = req.query;
  
  try {
    const fs = require('fs');
    const path = require('path');
    const csv = require('csv-parse/sync');
    
    // Read CSV
    const csvPath = path.join(process.cwd(), 'public', 'attendance_data.csv');
    let csvData;
    
    try {
      csvData = fs.readFileSync(csvPath, 'utf8');
    } catch (e) {
      // Try alternative path
      const altPath = path.join(process.cwd(), 'data', 'attendance_data.csv');
      csvData = fs.readFileSync(altPath, 'utf8');
    }
    
    // Parse CSV
    const records = csv.parse(csvData, {
      columns: true,
      skip_empty_lines: true
    });
    
    // Process monthly data by user
    const userMonthlyData = {};
    
    // Step 1: Collect all timestamps by user
    const userAllTimestamps = {};
    
    records.forEach(record => {
      const userName = record['ユーザー'] || '';
      const date = record['日付'] || '';
      const time = record['時間'] || '';
      const status = record['ステータス'] || '';
      const workingHours = record['合計稼働時間'] || '';
      
      if (!userName || !date || !time || !status) return;
      
      if (!userAllTimestamps[userName]) {
        userAllTimestamps[userName] = [];
      }
      
      userAllTimestamps[userName].push({
        date,
        time,
        status: status.toLowerCase().trim(),
        workingHours,
        datetimeStr: `${date} ${time.padStart(5, '0')}`
      });
    });
    
    // Step 2: Process each user's timestamps
    Object.keys(userAllTimestamps).forEach(userName => {
      const timestamps = userAllTimestamps[userName];
      timestamps.sort((a, b) => a.datetimeStr.localeCompare(b.datetimeStr));
      
      if (!userMonthlyData[userName]) {
        userMonthlyData[userName] = {
          totalMinutes: 0,
          monthlyMinutes: {}
        };
      }
      
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
              const parts = ts.workingHours.split(':');
              workMinutes = (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
            } else {
              workMinutes = parseInt(ts.workingHours) || 0;
            }
            
            const workDate = currentStart ? currentStart.date : ts.date;
            const [year, month] = workDate.split('/').slice(0, 2);
            const monthKey = `${year}/${String(month).padStart(2, '0')}`;
            
            if (workMinutes > 0 && workMinutes < 24 * 60) {
              if (!userMonthlyData[userName].monthlyMinutes[monthKey]) {
                userMonthlyData[userName].monthlyMinutes[monthKey] = 0;
              }
              userMonthlyData[userName].monthlyMinutes[monthKey] += workMinutes;
              userMonthlyData[userName].totalMinutes += workMinutes;
            }
            
            currentStart = null;
          } else if (currentStart) {
            // Calculate from start/end times
            const startTime = parseTime(currentStart.time);
            const endTime = parseTime(ts.time);
            
            if (startTime !== null && endTime !== null) {
              if (currentStart.date !== ts.date || endTime < startTime) {
                workMinutes = (24 * 60 - startTime) + endTime;
              } else {
                workMinutes = endTime - startTime;
              }
              
              const [year, month] = currentStart.date.split('/').slice(0, 2);
              const monthKey = `${year}/${String(month).padStart(2, '0')}`;
              
              if (workMinutes > 0 && workMinutes < 24 * 60) {
                if (!userMonthlyData[userName].monthlyMinutes[monthKey]) {
                  userMonthlyData[userName].monthlyMinutes[monthKey] = 0;
                }
                userMonthlyData[userName].monthlyMinutes[monthKey] += workMinutes;
                userMonthlyData[userName].totalMinutes += workMinutes;
              }
            }
            
            currentStart = null;
          }
        }
      }
    });
    
    // Calculate totals and sort users
    const userTotals = Object.entries(userMonthlyData)
      .map(([user, data]) => ({
        user,
        totalMinutes: data.totalMinutes
      }))
      .sort((a, b) => b.totalMinutes - a.totalMinutes)
      .slice(0, parseInt(top_users));
    
    // Get all months
    const allMonths = new Set();
    Object.values(userMonthlyData).forEach(userData => {
      Object.keys(userData.monthlyMinutes).forEach(month => {
        allMonths.add(month);
      });
    });
    
    // Sort months and take last N months
    const sortedMonths = Array.from(allMonths).sort().slice(-parseInt(months));
    
    // Generate chart data
    const chartData = [];
    
    sortedMonths.forEach(monthKey => {
      const dataPoint = { month: monthKey };
      
      userTotals.forEach(({ user }) => {
        const minutes = userMonthlyData[user]?.monthlyMinutes[monthKey] || 0;
        const hours = minutes / 60;
        dataPoint[user] = Math.round(hours * 10) / 10;
        
        const wholeHours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        dataPoint[`${user}_formatted`] = mins > 0 
          ? `${wholeHours}時間${mins}分`
          : `${wholeHours}時間`;
      });
      
      chartData.push(dataPoint);
    });
    
    // Generate user configs
    const userConfigs = {};
    const colors = [
      'hsl(265, 70%, 50%)', 'hsl(340, 70%, 50%)', 'hsl(45, 70%, 50%)',
      'hsl(120, 70%, 50%)', 'hsl(200, 70%, 50%)', 'hsl(15, 70%, 50%)',
      'hsl(300, 70%, 50%)', 'hsl(180, 70%, 50%)', 'hsl(60, 70%, 50%)',
      'hsl(240, 70%, 50%)', 'hsl(90, 70%, 50%)', 'hsl(150, 70%, 50%)',
      'hsl(30, 70%, 50%)', 'hsl(270, 70%, 50%)', 'hsl(330, 70%, 50%)'
    ];
    
    userTotals.forEach(({ user }, i) => {
      const totalMinutes = userMonthlyData[user].totalMinutes;
      const totalHours = Math.floor(totalMinutes / 60);
      const totalMins = totalMinutes % 60;
      
      userConfigs[user] = {
        label: user,
        color: colors[i] || `hsl(${(i * 360 / parseInt(top_users))}, 70%, 50%)`,
        total: `${totalHours}時間${totalMins}分`
      };
    });
    
    res.status(200).json({
      success: true,
      chart_data: chartData,
      user_configs: userConfigs,
      period: sortedMonths.length > 0 
        ? `${sortedMonths[0]} 〜 ${sortedMonths[sortedMonths.length - 1]}`
        : ''
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
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