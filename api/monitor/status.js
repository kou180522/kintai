export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Mock response for monitoring status
  res.status(200).json({
    is_monitoring: false,
    check_interval: 30,
    sheet_id: "1TvP2c1wr4VTZxN9SG-mjX8SCEYBzGhNNOUaE8-WJU-A"
  });
}