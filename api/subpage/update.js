export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Mock response for update endpoint
  const now = new Date();
  const currentMonth = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  res.status(200).json({
    success: true,
    message: "データを更新しました",
    timestamp: now.toISOString(),
    current_month: currentMonth,
    monthly_summary: [
      {
        month: currentMonth,
        total_hours: 150,
        total_minutes: 30,
        total_time_formatted: "150時間30分",
        users_count: 15,
        work_days: 20
      }
    ]
  });
}