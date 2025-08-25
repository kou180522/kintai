export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // シンプルなテストデータを返す
  const testData = {
    success: true,
    chart_data: [
      { date: "01", user1: 5.5, user2: 7.2, user3: 3.1 },
      { date: "02", user1: 6.0, user2: null, user3: 4.5 },
      { date: "03", user1: null, user2: 8.1, user3: 2.9 },
      { date: "04", user1: 4.8, user2: 6.5, user3: null },
      { date: "05", user1: 7.2, user2: 5.9, user3: 3.8 }
    ],
    user_configs: {
      user1: { label: "User 1", color: "hsl(265, 70%, 50%)" },
      user2: { label: "User 2", color: "hsl(340, 70%, 50%)" },
      user3: { label: "User 3", color: "hsl(45, 70%, 50%)" }
    }
  };
  
  res.status(200).json(testData);
}