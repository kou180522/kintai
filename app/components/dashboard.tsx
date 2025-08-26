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
import { getApiUrl, fetchApi } from "~/lib/api-client"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Label } from "recharts"

const initialChartConfig = {} satisfies ChartConfig

export function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [chartData, setChartData] = useState<any[]>([])
  const [chartConfig, setChartConfig] = useState<ChartConfig>(initialChartConfig)
  const [isChartLoading, setIsChartLoading] = useState(false)
  const [topUsers, setTopUsers] = useState<string[]>([])
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [isMonitoring, setIsMonitoring] = useState(true)
  const [highlightedUser, setHighlightedUser] = useState<string | null>(null)
  const [userMonthlyTotal, setUserMonthlyTotal] = useState<{[key: string]: {hours: number, minutes: number}}>({})
  const [showPopup, setShowPopup] = useState(false)
  const [popupUser, setPopupUser] = useState<string | null>(null)
  const [monthOffset, setMonthOffset] = useState(0) // 0=今月, 1=先月, 2=先々月

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 100) // 100msごとに更新してスムーズな動きを実現

    return () => clearInterval(timer)
  }, [])

  // グラフデータを取得
  useEffect(() => {
    fetchChartData()
  }, [monthOffset]) // monthOffsetが変更されたら再取得

  // 自動更新（30秒ごと）
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      fetchChartData()
    }, 30000) // 30秒ごと
    
    return () => clearInterval(interval)
  }, [autoRefresh, monthOffset])

  const fetchChartData = async () => {
    setIsChartLoading(true)
    try {
      // 月オフセットから年月を計算
      const now = new Date()
      let targetYear = now.getFullYear()
      let targetMonth = now.getMonth() + 1 - monthOffset
      
      // 月が1未満になったら前年に調整
      while (targetMonth <= 0) {
        targetMonth += 12
        targetYear--
      }
      
      const data = await fetchApi(`/api/subpage/daily-chart?days=31&top_users=20&month_offset=${monthOffset}`)
      
      console.log('Chart data received:', data)
      console.log('Success:', data?.success)
      console.log('Chart data exists:', !!data?.chart_data)
      console.log('Chart data length:', data?.chart_data?.length)
      console.log('User configs:', data?.user_configs)
      console.log('First data point:', data?.chart_data?.[0])
      
      if (data && data.success === true) {
          const chartData = data.chart_data || []
          const userConfigs = data.user_configs || {}
          
          console.log('Setting chart data:', chartData)
          console.log('Setting user configs:', userConfigs)
          
          setChartData(chartData)
          setChartConfig(userConfigs)
          // トップユーザーのリストを取得
          setTopUsers(Object.keys(userConfigs))
          setLastUpdateTime(new Date())
          
          // 各ユーザーの表示中の月の合計時間を計算
          const monthlyTotals: {[key: string]: {hours: number, minutes: number}} = {}
          
          Object.keys(userConfigs).forEach(userName => {
            let totalHours = 0
            chartData.forEach((day: any) => {
              // 全データを集計（すでに月でフィルタされている）
              if (day[userName] !== null && day[userName] !== undefined) {
                totalHours += day[userName]
              }
            })
            const hours = Math.floor(totalHours)
            const minutes = Math.round((totalHours - hours) * 60)
            monthlyTotals[userName] = { hours, minutes }
          })
          setUserMonthlyTotal(monthlyTotals)
      } else {
          console.error('API returned invalid data or success=false:', data)
          setChartData([])
          setChartConfig({})
          setTopUsers([])
      }
    } catch (error) {
      console.error('グラフデータ取得エラー:', error)
      setChartData([])
      setChartConfig({})
      setTopUsers([])
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
      try {
        const data = await fetchApi('/api/monitor/start', {
          method: 'POST',
        })
        if (data.success) {
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
                  <Card className="border-0 bg-white/90 dark:bg-black/50 backdrop-blur-xl shadow-xl transition-all duration-500 hover:shadow-2xl">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        {/* デジタル時計 */}
                        <div className="flex-1 text-center">
                          <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                            {formatDate(currentTime)}
                          </div>
                          <div className="text-2xl font-bold tracking-wide bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-400 dark:to-emerald-500 bg-clip-text text-transparent mt-1">
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
                        <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                          ユーザー一覧（今月の勤務時間順）
                        </h3>
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
                          // APIから受け取った色を使用
                          const config = chartConfig[userName]
                          const color = config ? config.color : "#999999"
                          
                          return (
                            <div 
                              key={userName} 
                              className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-1 py-0.5 transition-colors"
                              onClick={() => {
                                setHighlightedUser(highlightedUser === userName ? null : userName)
                                setPopupUser(userName)
                                setShowPopup(true)
                                setTimeout(() => setShowPopup(false), 3000) // 3秒後に自動で閉じる
                              }}
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
            
            {/* ポップアップ */}
            {showPopup && popupUser && userMonthlyTotal[popupUser] && (() => {
              const config = chartConfig[popupUser]
              const userColor = config ? config.color : "#999999"
              
              return (
                <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                  <div 
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 border-3 pointer-events-auto transform transition-all duration-300 scale-100 animate-pulse"
                    style={{ borderColor: userColor, borderWidth: '3px' }}
                  >
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {popupUser}
                      </div>
                      <div 
                        className="text-3xl font-bold"
                        style={{ color: userColor }}
                      >
                        {userMonthlyTotal[popupUser].hours}時間{userMonthlyTotal[popupUser].minutes}分
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {(() => {
                          const now = new Date()
                          let targetMonth = now.getMonth() + 1 - monthOffset
                          let targetYear = now.getFullYear()
                          while (targetMonth <= 0) {
                            targetMonth += 12
                            targetYear--
                          }
                          return monthOffset === 0 ? '今月の累計勤務時間' : `${targetMonth}月の累計勤務時間`
                        })()}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPopup(false)}
                      className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-lg pointer-events-auto"
                      style={{ backgroundColor: userColor }}
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })()}
            
            {/* グラフヘッダー */}
            <CardHeader className="py-3 px-5 bg-gradient-to-r from-gray-100/50 to-gray-200/50 dark:from-slate-700/20 dark:to-slate-600/20 backdrop-blur-sm border-b border-gray-200/20 dark:border-white/10 transition-colors duration-300">
              <div className="grid grid-cols-3 items-center">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gray-800 dark:bg-white rounded-lg transition-colors duration-300">
                    <svg className="w-5 h-5 text-white dark:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                      {(() => {
                        const now = new Date()
                        const targetMonth = now.getMonth() + 1 - monthOffset
                        const targetYear = now.getFullYear() - Math.floor((monthOffset - (now.getMonth() - targetMonth + 1)) / 12)
                        return monthOffset === 0 ? '今月の日別勤務時間' : `${targetMonth}月の日別勤務時間`
                      })()}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 dark:text-gray-300">
                      {isChartLoading ? 'データ読み込み中...' : 
                       (() => {
                         const now = new Date()
                         let targetMonth = now.getMonth() + 1 - monthOffset
                         let targetYear = now.getFullYear()
                         while (targetMonth <= 0) {
                           targetMonth += 12
                           targetYear--
                         }
                         if (monthOffset === 0) {
                           // 今月の場合は今日まで表示
                           return topUsers.length > 0 ? `${targetMonth}月1日〜${now.getDate()}日（全${topUsers.length}人）` : '今月の日別勤務時間を表示しています'
                         } else {
                           // 前月の場合は月末まで表示
                           const lastDay = new Date(targetYear, targetMonth, 0).getDate()
                           return topUsers.length > 0 ? `${targetMonth}月1日〜${lastDay}日（全${topUsers.length}人）` : `${targetMonth}月の日別勤務時間を表示しています`
                         }
                       })()
                      }
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
                  {/* 月切り替えボタン */}
                  <div className="flex items-center gap-1 bg-white/80 dark:bg-gray-800/80 rounded-lg px-2">
                    <button
                      onClick={() => setMonthOffset(Math.min(monthOffset + 1, 24))}
                      disabled={monthOffset >= 24}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="前月"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[80px] text-center">
                      {(() => {
                        const now = new Date()
                        let targetMonth = now.getMonth() + 1 - monthOffset
                        let targetYear = now.getFullYear()
                        while (targetMonth <= 0) {
                          targetMonth += 12
                          targetYear--
                        }
                        return `${targetYear}年${targetMonth}月`
                      })()}
                    </span>
                    
                    <button
                      onClick={() => setMonthOffset(Math.max(monthOffset - 1, 0))}
                      disabled={monthOffset === 0}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="次月"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* 自動更新トグル */}
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className="relative group z-10"
                  >
                    <div className={`absolute -inset-0.5 rounded-lg blur-[1px] transition-all duration-300 group-hover:blur-[2px] ${
                      autoRefresh 
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400' 
                        : 'bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-gray-300 opacity-50'
                    }`}></div>
                    <div className="relative z-10 flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-gray-900 rounded-lg leading-none transition-all duration-500 ease-in-out border-0">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition duration-200">
                        {autoRefresh ? '自動更新' : '手動'}
                      </span>
                      <div className={`w-5 h-5 rounded-full transition-all duration-300 ${
                        autoRefresh 
                          ? 'bg-green-500 animate-pulse' 
                          : 'bg-gray-400'
                      }`} />
                    </div>
                  </button>
                  
                  {/* 手動更新ボタン */}
                  <button
                    onClick={handleRefresh}
                    disabled={isChartLoading}
                    className="relative group z-10"
                  >
                    <div className={`absolute -inset-0.5 rounded-lg blur-[1px] transition-all duration-300 group-hover:blur-[2px] ${
                      isChartLoading 
                        ? 'bg-gradient-to-r from-sky-400 to-sky-500 dark:from-sky-300 dark:to-sky-400 animate-pulse' 
                        : 'bg-gradient-to-r from-sky-500 to-cyan-500 dark:from-sky-400 dark:to-cyan-400'
                    }`}></div>
                    <div className="relative z-10 flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-gray-900 rounded-lg leading-none transition-all duration-500 ease-in-out border-0">
                      <span className={`text-sm font-medium transition duration-200 ${
                        isChartLoading 
                          ? 'text-sky-600 dark:text-sky-400' 
                          : 'text-sky-600 dark:text-sky-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400'
                      }`}>
                        {isChartLoading ? '更新中' : '更新'}
                      </span>
                      <svg 
                        className={`w-5 h-5 transition-all duration-300 ${
                          isChartLoading 
                            ? 'animate-spin text-sky-600 dark:text-sky-400' 
                            : 'text-sky-600 dark:text-sky-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 group-hover:rotate-180'
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                  </button>
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
                        tickFormatter={(value) => `${value}`}
                        tick={{ fontSize: 9 }}
                      >
                        <Label value="Hours" angle={-90} position="insideLeft" style={{ fontSize: 12, fontWeight: 600 }} fill="#4b5563" className="dark:fill-gray-300" />
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
                                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.stroke }}></span>
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
                        
                        // APIから受け取った色を使用
                        const color = config.color
                        
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