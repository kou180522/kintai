export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const fs = require('fs');
  const path = require('path');
  const csv = require('csv-parse/sync');
  
  const debug = {
    environment: {
      cwd: process.cwd(),
      nodeVersion: process.version,
      platform: process.platform,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV
      }
    },
    csv: {
      paths_checked: [],
      found: false,
      data: null,
      error: null
    },
    processing: {
      records: 0,
      users: [],
      dates: [],
      sample: null
    }
  };
  
  try {
    // Check CSV file locations
    const paths = [
      path.join(process.cwd(), 'public', 'attendance_data.csv'),
      path.join(process.cwd(), 'data', 'attendance_data.csv'),
      '/var/task/public/attendance_data.csv',
      '/var/task/data/attendance_data.csv'
    ];
    
    let csvData = null;
    for (const p of paths) {
      debug.csv.paths_checked.push(p);
      try {
        const exists = fs.existsSync(p);
        if (exists) {
          csvData = fs.readFileSync(p, 'utf8');
          debug.csv.found = true;
          debug.csv.foundAt = p;
          debug.csv.size = csvData.length;
          break;
        }
      } catch (e) {
        debug.csv.error = e.message;
      }
    }
    
    if (csvData) {
      // Parse CSV
      const records = csv.parse(csvData, {
        columns: true,
        skip_empty_lines: true
      });
      
      debug.processing.records = records.length;
      
      // Get unique users and dates
      const users = new Set();
      const dates = new Set();
      
      records.forEach(r => {
        if (r['ユーザー']) users.add(r['ユーザー']);
        if (r['日付']) dates.add(r['日付']);
      });
      
      debug.processing.users = Array.from(users).slice(0, 10);
      debug.processing.userCount = users.size;
      debug.processing.dates = Array.from(dates).sort().slice(-10);
      debug.processing.sample = records.slice(0, 3);
      
      // Test processing
      const testResult = processSimpleData(records);
      debug.processing.testResult = testResult;
    }
    
    res.status(200).json(debug);
    
  } catch (error) {
    res.status(200).json({
      error: error.message,
      stack: error.stack,
      debug
    });
  }
}

function processSimpleData(records) {
  const userWorkMinutes = {};
  
  records.forEach(record => {
    const userName = record['ユーザー'] || '';
    const status = record['ステータス'] || '';
    const workHours = record['合計稼働時間'] || '';
    
    if (userName && status.toLowerCase() === 'f' && workHours) {
      if (!userWorkMinutes[userName]) {
        userWorkMinutes[userName] = 0;
      }
      
      // Parse work hours
      if (workHours.includes(':')) {
        const parts = workHours.split(':');
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        userWorkMinutes[userName] += hours * 60 + minutes;
      }
    }
  });
  
  // Get top 5 users
  const topUsers = Object.entries(userWorkMinutes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([user, minutes]) => ({
      user,
      totalMinutes: minutes,
      totalHours: Math.floor(minutes / 60),
      remainingMinutes: minutes % 60
    }));
  
  return {
    totalUsers: Object.keys(userWorkMinutes).length,
    topUsers
  };
}