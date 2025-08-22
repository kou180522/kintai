export default function handler(req, res) {
  // CORS対応
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    // サンプルデータ
    const attendanceData = {
      users: ['田中太郎', '佐藤花子', '鈴木一郎'],
      records: [
        { user: '田中太郎', date: '2025-01-22', in: '09:00', out: '18:00' },
        { user: '佐藤花子', date: '2025-01-22', in: '08:30', out: '17:30' },
        { user: '鈴木一郎', date: '2025-01-22', in: '09:15', out: '18:30' }
      ]
    };
    
    res.status(200).json(attendanceData);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}