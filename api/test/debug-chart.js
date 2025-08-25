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
    
    const debug = {
      step: 'start',
      csv_loading: {},
      record_analysis: {},
      user_processing: {},
      chart_generation: {},
      final_result: {}
    };
    
    // Step 1: Load CSV
    debug.step = 'csv_loading';
    let csvData = null;
    const paths = [
      path.join(process.cwd(), 'public', 'attendance_data.csv'),
      path.join(process.cwd(), 'data', 'attendance_data.csv'),
      '/var/task/public/attendance_data.csv',
      '/var/task/data/attendance_data.csv'
    ];
    
    debug.csv_loading.paths_checked = paths;
    
    for (const p of paths) {
      try {
        csvData = fs.readFileSync(p, 'utf8');
        debug.csv_loading.found_at = p;
        debug.csv_loading.file_size = csvData.length;
        break;
      } catch (e) {
        // Continue
      }
    }
    
    if (!csvData) {
      debug.csv_loading.error = 'CSV file not found';
      return res.status(200).json(debug);
    }
    
    // Step 2: Parse CSV
    debug.step = 'parsing';
    const records = csv.parse(csvData, {
      columns: true,
      skip_empty_lines: true
    });
    
    debug.record_analysis.total_records = records.length;
    debug.record_analysis.sample_records = records.slice(0, 3).map(r => ({
      user: r['ユーザー'],
      date: r['日付'],
      time: r['時間'],
      status: r['ステータス'],
      workHours: r['合計稼働時間']
    }));
    
    // Step 3: Analyze users and dates
    debug.step = 'analyzing';
    const users = new Set();
    const statuses = new Set();
    const dates = new Set();
    let recordsWithWorkHours = 0;
    let recordsWithStartStatus = 0;
    let recordsWithEndStatus = 0;
    
    records.forEach(r => {
      if (r['ユーザー']) users.add(r['ユーザー']);
      if (r['ステータス']) {
        statuses.add(r['ステータス']);
        const status = r['ステータス'].toLowerCase().trim();
        if (status === 's' || status === '開始' || status === 'start') {
          recordsWithStartStatus++;
        } else if (status === 'f' || status === '終了' || status === 'end') {
          recordsWithEndStatus++;
        }
      }
      if (r['日付']) dates.add(r['日付']);
      if (r['合計稼働時間'] && r['合計稼働時間'].trim()) {
        recordsWithWorkHours++;
      }
    });
    
    debug.record_analysis.unique_users = users.size;
    debug.record_analysis.user_list = Array.from(users).slice(0, 10);
    debug.record_analysis.unique_statuses = Array.from(statuses);
    debug.record_analysis.date_range = {
      earliest: Array.from(dates).sort()[0],
      latest: Array.from(dates).sort().pop()
    };
    debug.record_analysis.records_with_work_hours = recordsWithWorkHours;
    debug.record_analysis.records_with_start_status = recordsWithStartStatus;
    debug.record_analysis.records_with_end_status = recordsWithEndStatus;
    
    // Step 4: Process attendance data
    debug.step = 'processing';
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
    
    debug.user_processing.users_with_timestamps = Object.keys(userAllTimestamps).length;
    debug.user_processing.sample_user_data = {};
    
    // Process first few users for debugging
    const sampleUsers = Object.keys(userAllTimestamps).slice(0, 3);
    sampleUsers.forEach(userName => {
      const timestamps = userAllTimestamps[userName];
      timestamps.sort((a, b) => a.datetimeStr.localeCompare(b.datetimeStr));
      
      debug.user_processing.sample_user_data[userName] = {
        total_timestamps: timestamps.length,
        first_5_timestamps: timestamps.slice(0, 5),
        last_5_timestamps: timestamps.slice(-5)
      };
    });
    
    // Step 5: Calculate work hours
    debug.step = 'calculating_hours';
    const userTimeData = {};
    
    Object.keys(userAllTimestamps).forEach(userName => {
      const timestamps = userAllTimestamps[userName];
      timestamps.sort((a, b) => a.datetimeStr.localeCompare(b.datetimeStr));
      
      userTimeData[userName] = {
        dailyHours: {},
        monthlyHours: {},
        totalMinutes: 0,
        workDays: 0
      };
      
      let currentStart = null;
      let pairsProcessed = 0;
      let preCalculatedUsed = 0;
      
      for (let i = 0; i < timestamps.length; i++) {
        const ts = timestamps[i];
        
        if (ts.status === 's' || ts.status === '開始' || ts.status === 'start') {
          currentStart = ts;
        } else if (ts.status === 'f' || ts.status === '終了' || ts.status === 'end') {
          let workMinutes = 0;
          
          if (ts.workingHours && ts.workingHours.trim()) {
            if (ts.workingHours.includes(':')) {
              const parts = ts.workingHours.split(':');
              workMinutes = (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
            } else {
              workMinutes = parseInt(ts.workingHours) || 0;
            }
            
            if (workMinutes > 0 && workMinutes < 24 * 60) {
              const workDate = currentStart ? currentStart.date : ts.date;
              addWorkMinutes(userTimeData[userName], workDate, workMinutes);
              preCalculatedUsed++;
            }
            
            currentStart = null;
          } else if (currentStart) {
            const startTime = parseTime(currentStart.time);
            const endTime = parseTime(ts.time);
            
            if (startTime !== null && endTime !== null) {
              if (currentStart.date !== ts.date || endTime < startTime) {
                workMinutes = (24 * 60 - startTime) + endTime;
              } else {
                workMinutes = endTime - startTime;
              }
              
              if (workMinutes > 0 && workMinutes < 24 * 60) {
                addWorkMinutes(userTimeData[userName], currentStart.date, workMinutes);
                pairsProcessed++;
              }
            }
            
            currentStart = null;
          }
        }
      }
      
      userTimeData[userName].pairsProcessed = pairsProcessed;
      userTimeData[userName].preCalculatedUsed = preCalculatedUsed;
      userTimeData[userName].workDays = Object.keys(userTimeData[userName].dailyHours).length;
    });
    
    debug.user_processing.work_summary = {};
    Object.keys(userTimeData).slice(0, 5).forEach(userName => {
      debug.user_processing.work_summary[userName] = {
        totalMinutes: userTimeData[userName].totalMinutes,
        workDays: userTimeData[userName].workDays,
        pairsProcessed: userTimeData[userName].pairsProcessed,
        preCalculatedUsed: userTimeData[userName].preCalculatedUsed,
        monthlyData: userTimeData[userName].monthlyHours
      };
    });
    
    // Step 6: Generate chart data for target month
    debug.step = 'chart_generation';
    const now = new Date();
    let targetYear = now.getFullYear();
    let targetMonth = now.getMonth() + 1 - parseInt(month_offset);
    
    while (targetMonth <= 0) {
      targetMonth += 12;
      targetYear--;
    }
    
    // Use August 2025 as latest
    if (parseInt(month_offset) === 0 && targetYear === 2024) {
      targetYear = 2025;
      targetMonth = 8;
    }
    
    const targetMonthKey = `${targetYear}-${targetMonth}`;
    debug.chart_generation.target_month = targetMonthKey;
    
    // Get monthly totals
    const userMonthlyMinutes = {};
    Object.keys(userTimeData).forEach(userName => {
      const monthData = userTimeData[userName].monthlyHours[targetMonthKey];
      userMonthlyMinutes[userName] = monthData ? monthData.workMinutes : 0;
    });
    
    // Sort users
    const sortedUsers = Object.keys(userTimeData)
      .filter(user => userMonthlyMinutes[user] > 0)
      .sort((a, b) => userMonthlyMinutes[b] - userMonthlyMinutes[a])
      .slice(0, parseInt(top_users));
    
    debug.chart_generation.top_users = sortedUsers.map(user => ({
      user,
      monthlyMinutes: userMonthlyMinutes[user],
      monthlyHours: Math.round(userMonthlyMinutes[user] / 60 * 10) / 10
    }));
    
    // Generate chart data
    const chartData = [];
    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    
    for (let day = 1; day <= Math.min(lastDay, parseInt(days)); day++) {
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
        } else {
          dayData[userName] = null;
        }
      });
      
      chartData.push(dayData);
    }
    
    debug.chart_generation.chart_data_sample = chartData.slice(0, 5);
    debug.chart_generation.chart_data_length = chartData.length;
    
    // Final result
    debug.final_result = {
      success: true,
      chart_data_count: chartData.length,
      user_count: sortedUsers.length,
      has_data: chartData.some(d => Object.keys(d).some(k => k !== 'date' && d[k] !== null))
    };
    
    res.status(200).json(debug);
    
  } catch (error) {
    console.error('Error:', error);
    res.status(200).json({
      error: error.message,
      stack: error.stack
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

function addWorkMinutes(userData, date, minutes) {
  // Add to daily hours
  if (!userData.dailyHours[date]) {
    userData.dailyHours[date] = { workMinutes: 0 };
  }
  userData.dailyHours[date].workMinutes += minutes;
  
  // Add to monthly hours
  const [year, month] = date.split('/').slice(0, 2);
  const monthKey = `${year}-${parseInt(month)}`;
  
  if (!userData.monthlyHours[monthKey]) {
    userData.monthlyHours[monthKey] = { workMinutes: 0 };
  }
  userData.monthlyHours[monthKey].workMinutes += minutes;
  
  userData.totalMinutes += minutes;
}