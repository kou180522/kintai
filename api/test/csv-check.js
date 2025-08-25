export default function handler(req, res) {
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
  
  const result = {
    paths_checked: [],
    csv_found: false,
    record_count: 0,
    sample_records: [],
    error: null
  };
  
  // Check multiple possible paths
  const paths = [
    path.join(process.cwd(), 'public', 'attendance_data.csv'),
    path.join(process.cwd(), 'data', 'attendance_data.csv'),
    '/var/task/public/attendance_data.csv',
    '/var/task/data/attendance_data.csv'
  ];
  
  let csvData = null;
  let foundPath = null;
  
  for (const p of paths) {
    result.paths_checked.push(p);
    try {
      csvData = fs.readFileSync(p, 'utf8');
      foundPath = p;
      result.csv_found = true;
      break;
    } catch (e) {
      // Continue to next path
    }
  }
  
  if (csvData) {
    try {
      const records = csv.parse(csvData, {
        columns: true,
        skip_empty_lines: true
      });
      
      result.record_count = records.length;
      result.found_at = foundPath;
      
      // Get sample records
      result.sample_records = records.slice(0, 5).map(r => ({
        user: r['ユーザー'] || '',
        date: r['日付'] || '',
        status: r['ステータス'] || '',
        time: r['時間'] || ''
      }));
      
      // Count users
      const users = new Set();
      records.forEach(r => {
        if (r['ユーザー']) users.add(r['ユーザー']);
      });
      result.unique_users = users.size;
      result.user_list = Array.from(users).slice(0, 10);
      
    } catch (e) {
      result.error = `Parse error: ${e.message}`;
    }
  } else {
    result.error = 'CSV file not found in any location';
  }
  
  res.status(200).json(result);
}