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
  const [dataError, setDataError] = useState<string | null>(null);
  const [monthlyChartData, setMonthlyChartData] = useState<any[]>([]);
  const [userMonthlyData, setUserMonthlyData] = useState<any[]>([]);
  const [userConfigs, setUserConfigs] = useState<any>({});
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [highlightedUser, setHighlightedUser] = useState<string | null>(null);

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
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';
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
      
      // データ取得成功（alertは削除）
    } catch (error) {
      console.error('APIエラー:', error);
      setError(error instanceof Error ? error.message : 'API呼び出しエラー');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserMonthlyData = async () => {
    try {
      setDataError(null);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';
      console.log('Fetching user monthly data from:', `${apiUrl}/subpage/monthly-by-user?top_users=15&months=12`);
      
      const response = await fetch(`${apiUrl}/subpage/monthly-by-user?top_users=15&months=12`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('User monthly data received:', data);
        
        if (data.success) {
          setUserMonthlyData(data.chart_data || []);
          setUserConfigs(data.user_configs || {});
          // デフォルトで全ユーザーを選択
          const userKeys = Object.keys(data.user_configs || {});
          setSelectedUsers(userKeys);
          console.log('Selected users:', userKeys);
        } else {
          setDataError('データの取得に失敗しました');
        }
      } else {
        setDataError(`サーバーエラー: ${response.status}`);
      }
    } catch (error) {
      console.error('ユーザー別月別データ取得エラー:', error);
      setDataError(error instanceof Error ? error.message : 'データ取得エラー');
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
          <CardHeader className="py-3 px-5 bg-gradient-to-r from-gray-100/50 to-gray-200/50 dark:from-slate-700/20 dark:to-slate-600/20 backdrop-blur-sm border-b border-gray-200/20 dark:border-white/10 transition-all duration-500 ease-in-out">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 dark:from-slate-600 dark:to-slate-700 rounded-lg transition-colors duration-300">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                    月別勤務時間推移
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                    {userMonthlyData.length > 0 
                      ? `${userMonthlyData[0]?.month} 〜 ${userMonthlyData[userMonthlyData.length - 1]?.month} (全${Object.keys(userConfigs).length}人のユーザー)`
                      : '過去12ヶ月の月別勤務時間'}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* 最終更新時刻 */}
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  最終更新: {lastUpdateTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                </span>
                
                {/* 自動更新トグル */}
                <Button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className="relative group h-10 px-4 overflow-hidden rounded-lg transition-all duration-300"
                  variant="outline"
                >
                  <div className={`absolute inset-0 transition-all duration-300 ${autoRefresh ? 'bg-gradient-to-r from-blue-400 to-blue-500' : 'bg-gradient-to-r from-gray-400 to-gray-500'}`}></div>
                  <div className="relative flex items-center gap-2 text-white font-semibold">
                    <svg className={`w-5 h-5 ${autoRefresh ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-sm font-medium">{autoRefresh ? '自動更新ON' : '自動更新OFF'}</span>
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                    <span className="text-sm font-medium">{isLoading ? '処理中...' : 'データ更新'}</span>
                  </div>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2 flex-1 overflow-hidden">
            {dataError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                <strong>エラー:</strong> {dataError}
              </div>
            )}
            <div className="w-full h-full">
              {/* console.log('Chart data:', userMonthlyData, 'Selected users:', selectedUsers) */}
              {userMonthlyData.length === 0 && !isLoading && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-gray-500 mb-4">データを読み込み中...</p>
                    <Button onClick={fetchUserMonthlyData} variant="outline">
                      データを再読み込み
                    </Button>
                  </div>
                </div>
              )}
              {userMonthlyData.length > 0 && (
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
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-white/10" strokeOpacity={0.5} />
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
                      tickFormatter={(value) => `${Math.round(value)}`}
                      tick={{ fontSize: 11 }}
                    >
                      <Label value="Hours" angle={-90} position="insideLeft" style={{ fontSize: 13, fontWeight: 600 }} fill="#4b5563" className="dark:fill-gray-300" />
                    </YAxis>
                    <ChartTooltip
                      cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length > 0) {
                          // その月の全ユーザーのデータを取得（値がある場合のみ）
                          const monthData = [];
                          
                          for (const entry of payload) {
                            if (entry.value !== null && entry.value !== undefined && typeof entry.value === 'number' && entry.value > 0) {
                              monthData.push(entry);
                            }
                          }
                          
                          if (monthData.length === 0) return null;
                          
                          // 値でソート（降順）
                          monthData.sort((a: any, b: any) => b.value - a.value);
                          
                          // 合計時間を計算
                          const totalHours = monthData.reduce((sum: number, entry: any) => 
                            sum + (entry.value || 0), 0
                          );
                          
                          return (
                            <div className="bg-white/95 dark:bg-gray-800/95 p-3 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm max-h-[350px] overflow-y-auto min-w-[200px]">
                              <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 sticky top-0 bg-white/95 dark:bg-gray-800/95">
                                {label}
                              </p>
                              <div className="space-y-1">
                                {monthData.map((entry: any, index: number) => {
                                  const formattedKey = `${entry.dataKey}_formatted`;
                                  const formattedValue = entry.payload[formattedKey];
                                  
                                  return (
                                    <div key={entry.dataKey} className="flex items-center justify-between text-xs py-0.5">
                                      <span className="flex items-center gap-1">
                                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 w-4">{index + 1}.</span>
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                                        <span className="font-medium truncate max-w-[120px]">{entry.dataKey}:</span>
                                      </span>
                                      <span className="font-bold ml-2">{formattedValue || `${entry.value.toFixed(1)}時間`}</span>
                                    </div>
                                  );
                                })}
                              </div>
                              {monthData.length > 1 && (
                                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-medium text-gray-600 dark:text-gray-400">月間合計:</span>
                                    <span className="font-bold text-gray-800 dark:text-gray-200">
                                      {totalHours.toFixed(1)}時間
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                                    <span>平均/人:</span>
                                    <span>{(totalHours / monthData.length).toFixed(1)}時間</span>
                                  </div>
                                </div>
                              )}
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
                      
                      const isHighlighted = highlightedUser === userName;
                      const isOtherHighlighted = highlightedUser && highlightedUser !== userName;
                      
                      return (
                        <Line
                          key={userName}
                          type="monotone"
                          dataKey={userName}
                          stroke={config.color}
                          strokeWidth={isHighlighted ? 6 : isOtherHighlighted ? 1.5 : 3}
                          strokeOpacity={isOtherHighlighted ? 0.3 : 1}
                          dot={{ 
                            r: isHighlighted ? 5 : isOtherHighlighted ? 2 : 4, 
                            fill: config.color, 
                            fillOpacity: isOtherHighlighted ? 0.3 : 1,
                            strokeWidth: isHighlighted ? 2 : 1, 
                            stroke: "white"
                          }}
                          activeDot={{ 
                            r: isHighlighted ? 8 : 6, 
                            strokeWidth: 2, 
                            stroke: config.color, 
                            fill: "white"
                          }}
                          connectNulls={false}
                          onClick={() => setHighlightedUser(highlightedUser === userName ? null : userName)}
                          style={{ cursor: 'pointer' }}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
              )}
            </div>
            
            {/* ユーザー凡例 */}
            {Object.keys(userConfigs).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3 justify-center">
                {Object.entries(userConfigs).map(([userName, config]: [string, any]) => {
                  const isHighlighted = highlightedUser === userName;
                  const isOtherHighlighted = highlightedUser && highlightedUser !== userName;
                  
                  return (
                    <div 
                      key={userName} 
                      className={`flex items-center gap-2 cursor-pointer transition-all duration-200 px-2 py-1 rounded-md ${
                        isHighlighted ? 'bg-gray-100 dark:bg-gray-800 scale-110' : 
                        isOtherHighlighted ? 'opacity-40' : 'hover:bg-gray-50 dark:hover:bg-gray-900'
                      }`}
                      onClick={() => setHighlightedUser(highlightedUser === userName ? null : userName)}
                    >
                      <div 
                        className={`rounded-full transition-all duration-200 ${
                          isHighlighted ? 'w-4 h-4' : 'w-3 h-3'
                        }`}
                        style={{ 
                          backgroundColor: config.color,
                          opacity: isOtherHighlighted ? 0.3 : 1
                        }}
                      />
                      <span className={`text-xs transition-all duration-200 ${
                        isHighlighted ? 'font-bold text-gray-900 dark:text-white' : 
                        'text-gray-700 dark:text-gray-300'
                      }`}>
                        {userName}
                      </span>
                      <span className={`text-xs transition-all duration-200 ${
                        isHighlighted ? 'font-semibold text-gray-700 dark:text-gray-200' :
                        'text-gray-500 dark:text-gray-400'
                      }`}>
                        ({config.total})
                      </span>
                    </div>
                  );
                })}
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