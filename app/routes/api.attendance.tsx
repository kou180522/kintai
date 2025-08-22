import { json } from "react-router";

export async function loader() {
  // サンプル勤怠データ
  const attendanceData = {
    users: ['田中太郎', '佐藤花子', '鈴木一郎'],
    records: [
      { user: '田中太郎', date: '2025-01-22', in: '09:00', out: '18:00' },
      { user: '佐藤花子', date: '2025-01-22', in: '08:30', out: '17:30' },
      { user: '鈴木一郎', date: '2025-01-22', in: '09:15', out: '18:30' }
    ]
  };
  
  return json(attendanceData);
}