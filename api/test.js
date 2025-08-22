export default function handler(req, res) {
  res.status(200).json({
    message: '勤怠管理システムAPI',
    endpoint: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
}