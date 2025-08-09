import type { Route } from "./+types/page2";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import type { ChartConfig } from "~/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Label, BarChart, Bar } from "recharts";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "履歴" },
    { name: "description", content: "履歴ページ" },
  ];
}

// 過去12ヶ月の月別データを生成
const generateMonthlyData = () => {
  const data = [];
  const today = new Date();
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  
  for (let monthOffset = 11; monthOffset >= 0; monthOffset--) {
    const targetDate = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    
    data.push({
      month: `${year}年${monthNames[month]}`,
    });
  }
  
  return data;
};

const chartData = generateMonthlyData();

const chartConfig = {} satisfies ChartConfig;

export default function Page2() {
  const [isLoading, setIsLoading] = useState(false);
  const [subpageData, setSubpageData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApiCall = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/subpage/update?limit=15&months=12`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('サブページAPIレスポンス:', data);
      setSubpageData(data);
      
      // サマリー情報を表示
      if (data.success) {
        let message = '📊 勤務データ更新完了\n\n';
        
        // 統計情報
        if (data.statistics) {
          message += '【全体統計】\n';
          message += `総ユーザー数: ${data.statistics.total_users}人\n`;
          message += `アクティブユーザー: ${data.statistics.active_users}人\n`;
          message += `総勤務時間: ${data.statistics.total_work_time}\n`;
          message += `総勤務日数: ${data.statistics.total_work_days}日\n\n`;
        }
        
        // TOP5ユーザー
        if (data.users_summary && data.users_summary.length > 0) {
          message += '【勤務時間TOP5】\n';
          data.users_summary.slice(0, 5).forEach((user, index) => {
            const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            message += `${emoji} ${user.name}: ${user.total_time_formatted} (${user.work_days}日)\n`;
          });
          message += '\n';
        }
        
        // 月別サマリー（最新3ヶ月）
        if (data.monthly_summary && data.monthly_summary.length > 0) {
          message += '【月別勤務時間（最新3ヶ月）】\n';
          data.monthly_summary.slice(0, 3).forEach(month => {
            message += `${month.month}: ${month.total_time_formatted} (${month.users_count}人)\n`;
          });
        }
        
        alert(message);
      }
    } catch (error) {
      console.error('APIエラー:', error);
      setError(error instanceof Error ? error.message : 'API呼び出しエラー');
      alert(`APIエラー: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-500 ease-in-out">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.3),transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_80%,rgba(100,100,120,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.3),transparent_50%)] dark:bg-[radial-gradient(circle_at_80%_20%,rgba(100,100,120,0.3),transparent_50%)]"></div>
      </div>
      <div className="w-full max-w-6xl mx-auto px-4 py-1 relative z-10 h-[calc(100vh-64px)]">
        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-black/40 backdrop-blur-xl transition-all duration-500 ease-in-out h-full flex flex-col">
          <CardHeader className="py-3 px-4 bg-gradient-to-r from-gray-100/50 to-gray-200/50 dark:from-slate-700/20 dark:to-slate-600/20 backdrop-blur-sm border-b border-gray-200/20 dark:border-white/10 transition-all duration-500 ease-in-out">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-gradient-to-r from-blue-500 to-purple-500 dark:from-slate-600 dark:to-slate-700 rounded-lg transition-colors duration-300">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                    勤務履歴
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                    過去12ヶ月の月別勤務時間
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={handleApiCall}
                disabled={isLoading}
                className="relative group h-10 px-4 overflow-hidden rounded-lg transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-500 dark:from-purple-600 dark:to-purple-700 transition-all duration-300 group-hover:from-purple-500 group-hover:to-purple-600 dark:group-hover:from-purple-500 dark:group-hover:to-purple-600"></div>
                <div className="relative flex items-center gap-2 text-white font-semibold">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  {isLoading ? '処理中...' : 'データ更新'}
                </div>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-2 flex-1 overflow-hidden">
            <div className="w-full h-full">
              <ChartContainer config={chartConfig} className="h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{
                      top: 10,
                      right: 30,
                      left: 50,
                      bottom: 70,
                    }}
                  >
                    <defs>
                      <linearGradient id="colorGradient1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorGradient2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorGradient3" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-400 dark:text-white/10" strokeOpacity={0.8} />
                    <XAxis
                      dataKey="month"
                      stroke="#6b7280"
                      className="dark:stroke-gray-400"
                      tickLine={true}
                      axisLine={true}
                      tickMargin={8}
                      angle={-45}
                      textAnchor="end"
                      tick={{ fontSize: 11 }}
                    >
                      <Label value="Month" position="insideBottom" offset={-40} style={{ fontSize: 13, fontWeight: 600 }} fill="#4b5563" className="dark:fill-gray-300" />
                    </XAxis>
                    <YAxis
                      stroke="#6b7280"
                      className="dark:stroke-gray-400"
                      tickLine={true}
                      axisLine={true}
                      tickMargin={8}
                      domain={[0, 200]}
                      ticks={[0, 50, 100, 150, 200]}
                      tick={{ fontSize: 11 }}
                    >
                      <Label value="Hours" angle={-90} position="insideLeft" style={{ fontSize: 13, fontWeight: 600 }} fill="#4b5563" className="dark:fill-gray-300" />
                    </YAxis>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent />}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}