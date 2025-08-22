import { json } from "react-router";

export async function loader() {
  return json({
    message: '勤怠管理システムAPI',
    timestamp: new Date().toISOString(),
    status: 'running'
  });
}