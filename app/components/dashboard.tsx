import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import type { ChartConfig } from "~/components/ui/chart"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Label } from "recharts"

// 初期データ（APIから取得するまでの仮データ）
const initialChartData = [
  { date: "01/01" },
  { date: "01/02" },
  { date: "01/03" },
]

// 初期設定（APIから取得するまでの仮設定）
const initialChartConfig = {} satisfies ChartConfig

export function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [chartData, setChartData] = useState(initialChartData)
  const [chartConfig, setChartConfig] = useState<ChartConfig>(initialChartConfig)
  const [isChartLoading, setIsChartLoading] = useState(false)
  const [topUsers, setTopUsers] = useState<string[]>([])
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [isMonitoring, setIsMonitoring] = useState(true)
  const [highlightedUser, setHighlightedUser] = useState<string | null>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 100) // 100msごとに更新してスムーズな動きを実現

    return () => clearInterval(timer)
  }, [])

  // グラフデータを取得
  useEffect(() => {
    fetchChartData()
  }, [])

  // 自動更新（30秒ごと）
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      fetchChartData()
      console.log('データを自動更新しました:', new Date().toLocaleTimeString())
    }, 30000) // 30秒ごと
    
    return () => clearInterval(interval)
  }, [autoRefresh])

  const fetchChartData = async () => {
    setIsChartLoading(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001'
      const response = await fetch(`${apiUrl}/subpage/daily-chart?days=31&top_users=15`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setChartData(data.chart_data)
          setChartConfig(data.user_configs)
          // トップユーザーのリストを取得
          setTopUsers(Object.keys(data.user_configs))
          setLastUpdateTime(new Date())
        }
      }
    } catch (error) {
      console.error('グラフデータ取得エラー:', error)
    } finally {
      setIsChartLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchChartData()
  }


  // 起動時に監視を開始
  useEffect(() => {
    const startMonitoring = async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001'
      try {
        const response = await fetch(`${apiUrl}/monitor/start`, {
          method: 'POST',
        })
        if (response.ok) {
          console.log('Google Sheets監視を開始しました')
        }
      } catch (error) {
        console.error('監視開始エラー:', error)
      }
    }
    startMonitoring()
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    })
  }



  // アナログ時計用の計算
  const hours = currentTime.getHours() % 12
  const minutes = currentTime.getMinutes()
  const seconds = currentTime.getSeconds()
  const milliseconds = currentTime.getMilliseconds()
  
  // 時針: 1時間=30度、1分=0.5度
  const hourDegrees = (hours * 30) + (minutes * 0.5) + (seconds * 0.00833)
  // 分針: 1分=6度、1秒=0.1度
  const minuteDegrees = (minutes * 6) + (seconds * 0.1)
  // 秒針: 1秒=6度、ミリ秒も考慮してスムーズに
  const secondDegrees = (seconds * 6) + (milliseconds * 0.006)

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-500 ease-in-out">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.3),transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_80%,rgba(100,100,120,0.3),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.3),transparent_50%)] dark:bg-[radial-gradient(circle_at_80%_20%,rgba(100,100,120,0.3),transparent_50%)]"></div>
        </div>
      <div className="w-full px-4 py-3 relative z-10 h-[calc(100vh-64px)]">
        <div className="flex flex-col gap-0 h-full">
          {/* 統合カード */}
          <Card className="w-full shadow-2xl border-0 bg-white/80 dark:bg-black/40 backdrop-blur-xl overflow-hidden flex flex-col h-full transition-all duration-500 ease-in-out">
            {/* 時計セクション */}
            <div className="bg-gradient-to-r from-gray-100/50 to-gray-200/50 dark:from-slate-700/30 dark:to-slate-600/30 backdrop-blur-sm p-1.5 border-b border-gray-200/20 dark:border-white/10 transition-all duration-500 ease-in-out flex-shrink-0">
              <div className="grid grid-cols-12 gap-4 items-center px-3">
                {/* 時計カード - 左側3列 */}
                <div className="col-span-3">
                  <Card className="border-0 bg-white/90 dark:bg-black/50 backdrop-blur-xl shadow-xl transition-all duration-300 hover:shadow-2xl">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        {/* デジタル時計 */}
                        <div className="flex-1 text-center">
                          <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                            {formatDate(currentTime)}
                          </div>
                          <div className="text-2xl font-bold tracking-wide bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mt-1">
                            {formatTime(currentTime)}
                          </div>
                        </div>
                        
                        {/* 区切り線 */}
                        <div className="w-px h-16 bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
                        
                        {/* アナログ時計 */}
                        <div className="relative">
                          {/* 外側のカード風装飾 */}
                          <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur opacity-20"></div>
                          <div className="relative w-20 h-20 bg-white dark:bg-gray-900 rounded-full shadow-xl p-1.5">
                            <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-full shadow-inner flex items-center justify-center">
                      <svg className="w-14 h-14" viewBox="0 0 100 100">
                        {/* 時計の文字盤 */}
                        <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" className="text-gray-300 dark:text-white/20" strokeWidth="2"/>
                        {/* 時間のマーカー */}
                        {[...Array(12)].map((_, i) => (
                          <g key={i} transform={`rotate(${i * 30} 50 50)`}>
                            <line
                              x1="50"
                              y1="5"
                              x2="50"
                              y2="10"
                              stroke="currentColor"
                              className="text-gray-400 dark:text-white/50"
                              strokeWidth="2"
                            />
                            {/* 主要な時間（12, 3, 6, 9）にドット追加 */}
                            {i % 3 === 0 && (
                              <circle
                                cx="50"
                                cy="8"
                                r="1.5"
                                fill="currentColor"
                                className="text-blue-500 dark:text-blue-400"
                              />
                            )}
                          </g>
                        ))}
                        {/* 時針 */}
                        <g transform={`rotate(${hourDegrees} 50 50)`}>
                          <line
                            x1="50"
                            y1="50"
                            x2="50"
                            y2="25"
                            stroke="#374151"
                            strokeWidth="3"
                            strokeLinecap="round"
                            className="dark:stroke-white/80"
                          />
                        </g>
                        {/* 分針 */}
                        <g transform={`rotate(${minuteDegrees} 50 50)`}>
                          <line
                            x1="50"
                            y1="50"
                            x2="50"
                            y2="15"
                            stroke="#1f2937"
                            strokeWidth="2"
                            strokeLinecap="round"
                            className="dark:stroke-white/90"
                          />
                        </g>
                        {/* 秒針 */}
                        <g transform={`rotate(${secondDegrees} 50 50)`}>
                          <line
                            x1="50"
                            y1="50"
                            x2="50"
                            y2="10"
                            stroke="#ef4444"
                            strokeWidth="1"
                            strokeLinecap="round"
                          />
                        </g>
                        {/* 中心点 */}
                        <circle cx="50" cy="50" r="3" fill="#374151" className="dark:fill-white/90"/>
                      </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* ユーザー凡例 - 中央から右側9列 */}
                <div className="col-span-9">
                  <Card className="border-0 bg-white/90 dark:bg-black/50 backdrop-blur-xl shadow-lg">
                    <CardContent className="p-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400">ユーザー一覧（クリックで強調表示）</h3>
                        {highlightedUser && (
                          <button
                            onClick={() => setHighlightedUser(null)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            リセット
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-x-4 gap-y-1">
                        {topUsers.map((userName, index) => {
                          const colors = [
                            "#3B82F6", // 1. 青
                            "#10B981", // 2. 緑
                            "#F59E0B", // 3. オレンジ
                            "#8B5CF6", // 4. 紫
                            "#EF4444", // 5. 赤
                            "#06B6D4", // 6. シアン
                            "#8B5CF6", // 7. バイオレット
                            "#EC4899", // 8. ピンク
                            "#14B8A6", // 9. ティール
                            "#F59E0B", // 10. アンバー
                            "#84CC16", // 11. ライム
                            "#6366F1", // 12. インディゴ
                            "#F43F5E", // 13. ローズ
                            "#0EA5E9", // 14. スカイ
                            "#A855F7", // 15. パープル
                          ]
                          const color = colors[index % colors.length]
                          
                          return (
                            <div 
                              key={userName} 
                              className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-1 py-0.5 transition-colors"
                              onClick={() => setHighlightedUser(highlightedUser === userName ? null : userName)}
                            >
                              <div 
                                className={`w-4 h-4 rounded-full shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 flex-shrink-0 transition-all ${
                                  highlightedUser === userName ? 'ring-2 ring-offset-1 ring-blue-500 scale-125' : ''
                                }`}
                                style={{ backgroundColor: color }}
                              />
                              <span className={`text-sm font-medium truncate transition-all ${
                                highlightedUser === userName 
                                  ? 'text-blue-600 dark:text-blue-400 font-bold' 
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}>
                                {userName}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
            
            {/* グラフヘッダー */}
            <CardHeader className="py-3 px-5 bg-gradient-to-r from-gray-100/50 to-gray-200/50 dark:from-slate-700/20 dark:to-slate-600/20 backdrop-blur-sm border-b border-gray-200/20 dark:border-white/10 transition-colors duration-300">
              <div className="grid grid-cols-3 items-center">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 dark:from-slate-600 dark:to-slate-700 rounded-lg transition-colors duration-300">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                      勤務時間推移
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 dark:text-gray-300">
                      {isChartLoading ? 'データ読み込み中...' : 
                       topUsers.length > 0 ? `全${topUsers.length}人のユーザーを表示中` : 
                       '日別の勤務時間を表示しています'}
                      {!isChartLoading && (
                        <span className="ml-2 text-sm">
                          最終更新: {lastUpdateTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                
                {/* 中央スペース */}
                <div></div>
                
                {/* 更新ボタン（右側） */}
                <div className="flex justify-end gap-2">
                  {/* 自動更新トグル */}
                  <Button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`relative group h-10 px-4 overflow-hidden rounded-lg transition-all duration-300`}
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
                    onClick={handleRefresh}
                    disabled={isChartLoading}
                    className="relative group h-10 px-4 overflow-hidden rounded-lg transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-500 dark:from-purple-600 dark:to-purple-700 transition-all duration-300 group-hover:from-purple-500 group-hover:to-purple-600"></div>
                    <div className="relative flex items-center gap-2 text-white font-semibold">
                      <svg className={`w-5 h-5 ${isChartLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="text-sm font-medium">{isChartLoading ? '更新中...' : '更新'}</span>
                    </div>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2 flex-1 overflow-hidden">
              <div className="w-full h-full">
                <ChartContainer config={chartConfig} className="h-full" style={{ minWidth: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{
                        top: 15,
                        right: 20,
                        left: 45,
                        bottom: 55,
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
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-white/10" strokeOpacity={0.5} />
                      <XAxis
                        dataKey="date"
                        stroke="#6b7280"
                        className="dark:stroke-gray-400"
                        tickLine={true}
                        axisLine={true}
                        tickMargin={4}
                        tickFormatter={(value) => {
                          // valueは "01/15" のような形式なので、日付部分だけ取得
                          const parts = value.split('/');
                          return parts.length > 1 ? parts[1] : value;
                        }}
                        interval={0}
                        angle={-90}
                        textAnchor="end"
                        tick={{ fontSize: 9 }}
                      >
                        <Label value="Date" position="insideBottom" offset={-25} style={{ fontSize: 12, fontWeight: 600 }} fill="#4b5563" className="dark:fill-gray-300" />
                      </XAxis>
                      <YAxis
                        stroke="#6b7280"
                        className="dark:stroke-gray-400"
                        tickLine={true}
                        axisLine={true}
                        tickMargin={4}
                        domain={[0, 14]}
                        ticks={[0, 2, 4, 6, 8, 10, 12, 14]}
                        tickFormatter={(value) => `${value}h`}
                        tick={{ fontSize: 9 }}
                      >
                        <Label value="勤務時間" angle={-90} position="insideLeft" style={{ fontSize: 12, fontWeight: 600 }} fill="#4b5563" className="dark:fill-gray-300" />
                      </YAxis>
                      <ChartTooltip
                        cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length > 0) {
                            // その日の全ユーザーのデータを取得（値がある場合のみ）
                            const dayData = [];
                            
                            for (const entry of payload) {
                              if (entry.value !== null && entry.value !== undefined && typeof entry.value === 'number' && entry.value > 0) {
                                dayData.push(entry);
                              }
                            }
                            
                            if (dayData.length === 0) return null;
                            
                            // 値でソート（降順）
                            dayData.sort((a: any, b: any) => b.value - a.value);
                            
                            // 合計時間を計算
                            const totalHours = dayData.reduce((sum: number, entry: any) => 
                              sum + (entry.value || 0), 0
                            );
                            
                            return (
                              <div className="bg-white/95 dark:bg-gray-800/95 p-3 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm max-h-[300px] overflow-y-auto">
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 sticky top-0 bg-white/95 dark:bg-gray-800/95">
                                  {label}
                                </p>
                                <div className="space-y-1">
                                  {dayData.map((entry: any, index: number) => {
                                    const formattedKey = `${entry.dataKey}_formatted`;
                                    const formattedValue = entry.payload[formattedKey];
                                    
                                    return (
                                      <div key={entry.dataKey} className="flex items-center justify-between text-xs py-0.5">
                                        <span className="flex items-center gap-1.5">
                                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                                          <span className="font-medium">{entry.dataKey}:</span>
                                        </span>
                                        <span className="font-bold ml-2">{formattedValue || `${entry.value.toFixed(1)}時間`}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                                {dayData.length > 1 && (
                                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-medium text-gray-600 dark:text-gray-400">合計:</span>
                                      <span className="font-bold text-gray-800 dark:text-gray-200">
                                        {totalHours.toFixed(1)}時間
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                                      <span>人数:</span>
                                      <span>{dayData.length}人</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      {/* 動的にユーザーごとのLineを生成 */}
                      {topUsers.map((userName, index) => {
                        const config = chartConfig[userName]
                        if (!config) return null
                        
                        // 15人分の色の配列
                        const colors = [
                          "#3B82F6", // 1. 青
                          "#10B981", // 2. 緑
                          "#F59E0B", // 3. オレンジ
                          "#8B5CF6", // 4. 紫
                          "#EF4444", // 5. 赤
                          "#06B6D4", // 6. シアン
                          "#8B5CF6", // 7. バイオレット
                          "#EC4899", // 8. ピンク
                          "#14B8A6", // 9. ティール
                          "#F59E0B", // 10. アンバー
                          "#84CC16", // 11. ライム
                          "#6366F1", // 12. インディゴ
                          "#F43F5E", // 13. ローズ
                          "#0EA5E9", // 14. スカイ
                          "#A855F7", // 15. パープル
                        ]
                        const color = colors[index % colors.length]
                        
                        const isHighlighted = highlightedUser === userName
                        const isOtherHighlighted = highlightedUser && highlightedUser !== userName
                        
                        return (
                          <Line
                            key={userName}
                            type="monotone"
                            dataKey={userName}
                            stroke={color}
                            strokeWidth={isHighlighted ? 4 : isOtherHighlighted ? 1 : 2.5}
                            strokeOpacity={isOtherHighlighted ? 0.2 : 1}
                            dot={{ 
                              r: isHighlighted ? 5 : 3, 
                              fill: color, 
                              strokeWidth: 1, 
                              stroke: "white",
                              fillOpacity: isOtherHighlighted ? 0.2 : 1
                            }}
                            connectNulls={true}
                            activeDot={{ 
                              r: isHighlighted ? 8 : 6, 
                              strokeWidth: 2, 
                              stroke: color, 
                              fill: "white"
                            }}
                            className={`transition-all duration-300 ${
                              isHighlighted ? 'drop-shadow-lg' : ''
                            }`}
                          />
                        )
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}