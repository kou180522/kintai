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
  const [monthlyChartData, setMonthlyChartData] = useState<any[]>([]);
  const [userMonthlyData, setUserMonthlyData] = useState<any[]>([]);
  const [userConfigs, setUserConfigs] = useState<any>({});
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // ページ読み込み時にデータを取得
  useEffect(() => {
    handleApiCall();
    fetchUserMonthlyData();
  }, []);

  // 自動更新（30秒ごと）
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      handleApiCall();
      fetchUserMonthlyData();
      console.log('月別データを自動更新しました:', new Date().toLocaleTimeString());
    }, 30000); // 30秒ごと
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

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
      setLastUpdateTime(new Date());
      
      // 月別データをグラフ用に変換
      if (data.monthly_summary) {
        const chartData = data.monthly_summary.map((month: any) => ({
          month: month.month,
          hours: month.total_hours + (month.total_minutes / 60),
          totalTime: month.total_time_formatted,
          users: month.users_count,
          days: month.work_days
        })).reverse(); // 古い月から新しい月の順にする
        setMonthlyChartData(chartData);
      }
      
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

  const fetchUserMonthlyData = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/subpage/monthly-by-user?top_users=15&months=12`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUserMonthlyData(data.chart_data);
          setUserConfigs(data.user_configs);
          // デフォルトで全ユーザーを選択
          setSelectedUsers(Object.keys(data.user_configs));
        }
      }
    } catch (error) {
      console.error('ユーザー別月別データ取得エラー:', error);
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
                    月別勤務時間推移
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                    {userMonthlyData.length > 0 
                      ? `${userMonthlyData[0]?.month} 〜 ${userMonthlyData[userMonthlyData.length - 1]?.month} (全${Object.keys(userConfigs).length}人のユーザー)`
                      : '過去12ヶ月の月別勤務時間'}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* 最終更新時刻 */}
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  最終更新: {lastUpdateTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                </span>
                
                {/* 自動更新トグル */}
                <Button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className="relative group h-10 px-3 overflow-hidden rounded-lg transition-all duration-300"
                  variant="outline"
                >
                  <div className={`absolute inset-0 transition-all duration-300 ${autoRefresh ? 'bg-gradient-to-r from-blue-400 to-blue-500' : 'bg-gradient-to-r from-gray-400 to-gray-500'}`}></div>
                  <div className="relative flex items-center gap-2 text-white font-semibold">
                    <svg className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {autoRefresh ? '自動ON' : '自動OFF'}
                  </div>
                </Button>
                
                {/* 手動更新ボタン */}
                <Button
                  onClick={() => {
                    handleApiCall();
                    fetchUserMonthlyData();
                  }}
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
            </div>
          </CardHeader>
          <CardContent className="p-2 flex-1 overflow-hidden">
            <div className="w-full h-full">
              <ChartContainer config={chartConfig} className="h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={userMonthlyData.length > 0 ? userMonthlyData : chartData}
                    margin={{
                      top: 10,
                      right: 30,
                      left: 50,
                      bottom: 70,
                    }}
                  >
                    <defs>
                      <linearGradient id="colorGradient1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.3}/>
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
                      domain={[0, 'auto']}
                      tickFormatter={(value) => `${Math.round(value)}h`}
                      tick={{ fontSize: 11 }}
                    >
                      <Label value="月別勤務時間" angle={-90} position="insideLeft" style={{ fontSize: 13, fontWeight: 600 }} fill="#4b5563" className="dark:fill-gray-300" />
                    </YAxis>
                    <ChartTooltip
                      cursor={false}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                              <p className="text-sm font-semibold mb-2">{label}</p>
                              {payload.map((entry: any, index: number) => {
                                const formattedKey = `${entry.dataKey}_formatted`;
                                const formattedValue = entry.payload[formattedKey];
                                if (entry.value !== null && entry.value > 0) {
                                  return (
                                    <p key={index} className="text-xs py-0.5" style={{ color: entry.color }}>
                                      {entry.dataKey}: {formattedValue || `${Math.round(entry.value)}時間`}
                                    </p>
                                  );
                                }
                                return null;
                              })}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {/* 各ユーザーの折れ線を動的に生成 */}
                    {selectedUsers.map((userName, index) => {
                      const config = userConfigs[userName];
                      if (!config) return null;
                      
                      return (
                        <Line
                          key={userName}
                          type="monotone"
                          dataKey={userName}
                          stroke={config.color}
                          strokeWidth={2}
                          dot={{ r: 3, fill: config.color }}
                          activeDot={{ r: 5 }}
                          connectNulls={false}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            
            {/* ユーザー凡例 */}
            {Object.keys(userConfigs).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3 justify-center">
                {Object.entries(userConfigs).map(([userName, config]: [string, any]) => (
                  <div key={userName} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      {userName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({config.total})
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            {/* 月別データサマリー */}
            {subpageData && subpageData.monthly_summary && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                {subpageData.monthly_summary.slice(0, 4).map((month: any, index: number) => (
                  <div key={month.month} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      {month.month}
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {month.total_time_formatted}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {month.work_days}日 / {month.users_count}人
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}