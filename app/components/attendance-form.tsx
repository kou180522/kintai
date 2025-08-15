import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

interface AttendanceFormProps {
  onRefresh?: () => void;
}

export function AttendanceForm({ onRefresh }: AttendanceFormProps) {
  const [userName, setUserName] = useState("");
  const [status, setStatus] = useState("開始");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userName.trim()) {
      alert("ユーザー名を入力してください");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';
      const response = await fetch(`${apiUrl}/api/attendance/punch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_name: userName,
          status: status,
          message: message,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        alert(`${userName}の${status}を記録しました`);
        
        // フォームをリセット
        setMessage("");
        
        // データを再読み込み
        if (onRefresh) {
          setTimeout(onRefresh, 500); // 少し待ってから更新
        }
      }
    } catch (error) {
      console.error('打刻エラー:', error);
      alert('打刻の記録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 dark:bg-black/40 backdrop-blur-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
          勤怠打刻
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          出勤・退勤を記録します
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userName">ユーザー名</Label>
            <Input
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="山田太郎"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">ステータス</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={isSubmitting}
              className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:focus-visible:ring-gray-300"
            >
              <option value="開始">開始</option>
              <option value="終了">終了</option>
              <option value="s">s（開始）</option>
              <option value="f">f（終了）</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">
              メッセージ（オプション）
              <span className="text-xs text-gray-500 ml-2">
                例: s+60, f-30, s 18:00
              </span>
            </Label>
            <Input
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="s+60（60分前から開始）"
              disabled={isSubmitting}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                記録中...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                打刻する
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}