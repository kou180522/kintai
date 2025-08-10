import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Textarea } from "~/components/ui/textarea"
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
  const [comment, setComment] = useState("")
  const [chartData, setChartData] = useState(initialChartData)
  const [chartConfig, setChartConfig] = useState<ChartConfig>(initialChartConfig)
  const [isChartLoading, setIsChartLoading] = useState(false)
  const [topUsers, setTopUsers] = useState<string[]>([])
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [isMonitoring, setIsMonitoring] = useState(false)

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
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
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

  const toggleMonitoring = async () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    const endpoint = isMonitoring ? '/monitor/stop' : '/monitor/start'
    
    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
      })
      
      if (response.ok) {
        const data = await response.json()
        setIsMonitoring(!isMonitoring)
        console.log('監視状態:', data.message)
      }
    } catch (error) {
      console.error('監視状態変更エラー:', error)
    }
  }

  // 起動時に監視状態を確認
  useEffect(() => {
    const checkMonitorStatus = async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      try {
        const response = await fetch(`${apiUrl}/monitor/status`)
        if (response.ok) {
          const data = await response.json()
          setIsMonitoring(data.is_monitoring)
        }
      } catch (error) {
        console.error('監視状態取得エラー:', error)
      }
    }
    checkMonitorStatus()
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

  const handleClockIn = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/attendance/clock-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: currentTime.toISOString(),
          comment: comment
        }),
      });
      
      const data = await response.json();
      console.log("出勤打刻:", formatTime(currentTime), "コメント:", comment);
      alert('出勤打刻が完了しました');
      setComment('');
    } catch (error) {
      console.error('出勤打刻エラー:', error);
      alert('出勤打刻に失敗しました');
    }
  }

  const handleClockOut = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/attendance/clock-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: currentTime.toISOString(),
          comment: comment
        }),
      });
      
      const data = await response.json();
      console.log("退勤打刻:", formatTime(currentTime), "コメント:", comment);
      alert('退勤打刻が完了しました');
      setComment('');
    } catch (error) {
      console.error('退勤打刻エラー:', error);
      alert('退勤打刻に失敗しました');
    }
  }

  const handleCommentSubmit = () => {
    console.log("コメント送信:", comment)
    setComment("") // 送信後にコメントをクリア
  }

  const handleApiTest = async () => {
    try {
      // バックエンドのテスト用APIエンドポイントを呼び出す（GETメソッドに変更）
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const fullUrl = `${apiUrl}/test/`;
      
      console.log('API呼び出し開始:', fullUrl);
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json()
      console.log('APIレスポンス成功:', data)
      
      // ユーザー情報と稼働時間を整形して表示
      if (data.success && data.data) {
        const users = data.data.users || [];
        const totalUsers = data.data.total_users || 0;
        const totalRecords = data.data.total_records || 0;
        const timeData = data.data.time_data;
        
        let message = `✅ APIテスト成功！\n\n`;
        message += `📊 データ概要\n`;
        message += `────────────────────\n`;
        message += `ユーザー総数: ${totalUsers}人\n`;
        message += `勤怠レコード総数: ${totalRecords}件\n`;
        
        // 統計情報
        if (timeData && timeData.statistics) {
          message += `総稼働時間: ${timeData.statistics.total_work_time}\n`;
          message += `アクティブユーザー: ${timeData.statistics.active_users}/${timeData.statistics.total_users}人\n`;
        }
        message += `\n`;
        
        // 全15人の稼働時間データ
        if (timeData && timeData.summary && timeData.summary.length > 0) {
          message += `⏱️ 全ユーザーの稼働時間一覧（${timeData.summary.length}人）\n`;
          message += `════════════════════════════════\n`;
          
          timeData.summary.forEach((user, index) => {
            const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${(index + 1).toString().padStart(2, ' ')}.`;
            const timeStr = user.total_time || '0時間0分';
            const daysStr = user.work_days > 0 ? `${user.work_days}日` : '未勤務';
            
            // 稼働時間がある人は強調
            if (user.total_hours > 0 || user.total_minutes > 0) {
              message += `${rankEmoji} ${user.name}\n`;
              message += `    ⏰ 総計: ${timeStr} / 📅 ${daysStr}\n`;
              
              // 月別勤務時間を表示
              if (user.monthly_hours && Object.keys(user.monthly_hours).length > 0) {
                message += `    📊 月別勤務時間:\n`;
                const sortedMonths = Object.keys(user.monthly_hours).sort().reverse();
                sortedMonths.slice(0, 3).forEach(month => {
                  const monthData = user.monthly_hours[month];
                  message += `       ${month}: ${monthData.formatted} (${monthData.work_days}日)\n`;
                });
              }
              
              // 最近の日別勤務時間を表示（最新3日分）
              if (user.daily_hours && Object.keys(user.daily_hours).length > 0) {
                const sortedDates = Object.keys(user.daily_hours).sort().reverse();
                if (sortedDates.length > 0) {
                  message += `    📅 最近の勤務:\n`;
                  sortedDates.slice(0, 3).forEach(date => {
                    const dayData = user.daily_hours[date];
                    message += `       ${date}: ${dayData.formatted}\n`;
                  });
                }
              }
            } else {
              message += `${rankEmoji} ${user.name}: 稼働記録なし\n`;
            }
          });
          message += `\n`;
        }
        
        // 全ユーザー情報リスト
        if (users.length > 0) {
          message += `👥 登録ユーザー詳細（全${users.length}人）\n`;
          message += `════════════════════════════════\n`;
          users.forEach((user, index) => {
            message += `${(index + 1).toString().padStart(2, ' ')}. ${user.name}\n`;
            message += `    ID: ${user.employee_id}\n`;
            message += `    📧 ${user.email}\n`;
            if (user.department !== "未設定") {
              message += `    🏢 ${user.department} / ${user.position}\n`;
            }
          });
        }
        
        alert(message);
      } else {
        alert(`APIテスト成功！\nレスポンス: ${JSON.stringify(data, null, 2)}`)
      }
    } catch (error) {
      console.error('APIエラー詳細:', error)
      if (error instanceof Error) {
        alert(`APIテスト失敗: ${error.message}\n\n詳細はブラウザのコンソールを確認してください。`)
      } else {
        alert(`APIテスト失敗: ${error}`)
      }
    }
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
      <div className="w-full px-2 py-2 relative z-10 h-[calc(100vh-64px)]">
        <div className="flex flex-col gap-0 h-full">
          {/* 統合カード */}
          <Card className="w-full shadow-2xl border-0 bg-white/80 dark:bg-black/40 backdrop-blur-xl overflow-hidden flex flex-col h-full transition-all duration-500 ease-in-out">
            {/* 打刻セクション */}
            <div className="bg-gradient-to-r from-gray-100/50 to-gray-200/50 dark:from-slate-700/30 dark:to-slate-600/30 backdrop-blur-sm p-1.5 border-b border-gray-200/20 dark:border-white/10 transition-all duration-500 ease-in-out">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                <div className="flex gap-3 items-center justify-center md:col-span-1">
                  {/* 時計カード */}
                  <Card className="border-0 bg-white/90 dark:bg-black/50 backdrop-blur-xl shadow-xl transition-all duration-300 hover:shadow-2xl">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-4">
                        {/* デジタル時計 */}
                        <div className="flex-1 text-center">
                          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {formatDate(currentTime)}
                          </div>
                          <div className="text-2xl font-bold tracking-wider bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mt-1">
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
                
                <div className="md:col-span-3 flex gap-3 items-center">
                  <div className="grid grid-cols-2 gap-2 flex-grow-0" style={{ minWidth: '280px' }}>
                    <Button 
                      onClick={handleClockIn}
                      className="relative group w-full h-12 text-base font-bold overflow-hidden rounded-lg transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 dark:from-blue-600 dark:to-blue-700 transition-all duration-300 group-hover:from-blue-500 group-hover:to-blue-600 dark:group-hover:from-blue-500 dark:group-hover:to-blue-600"></div>
                      <div className="relative flex items-center justify-center gap-2 text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        出勤
                      </div>
                    </Button>
                    <Button 
                      onClick={handleClockOut}
                      className="relative group w-full h-12 text-base font-bold overflow-hidden rounded-lg transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-500 dark:from-red-600 dark:to-red-700 transition-all duration-300 group-hover:from-red-500 group-hover:to-red-600 dark:group-hover:from-red-500 dark:group-hover:to-red-600"></div>
                      <div className="relative flex items-center justify-center gap-2 text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        退勤
                      </div>
                    </Button>
                  </div>
                  
                  <div className="relative flex-1 group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400/50 to-purple-400/50 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
                    <div className="relative">
                      <Textarea
                        placeholder="コメント入力 (任意)"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="resize-none bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-600 hover:border-blue-400 dark:hover:border-blue-500 text-gray-900 dark:text-white placeholder:text-blue-400 dark:placeholder:text-blue-300 focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent text-sm h-9 py-2 pr-10 rounded-lg shadow-sm hover:shadow-md w-full transition-all duration-300 ease-in-out"
                        rows={1}
                      />
                      <Button
                        onClick={handleCommentSubmit}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors duration-200"
                        variant="ghost"
                        size="sm"
                      >
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* グラフヘッダー */}
            <CardHeader className="py-1.5 px-4 bg-gradient-to-r from-gray-100/50 to-gray-200/50 dark:from-slate-700/20 dark:to-slate-600/20 backdrop-blur-sm border-b border-gray-200/20 dark:border-white/10 transition-colors duration-300">
              <div className="grid grid-cols-3 items-center">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-gradient-to-r from-blue-500 to-purple-500 dark:from-slate-600 dark:to-slate-700 rounded-lg transition-colors duration-300">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-gray-900 dark:text-white">
                      勤務時間推移
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-600 dark:text-gray-300">
                      {isChartLoading ? 'データ読み込み中...' : 
                       topUsers.length > 0 ? `全${topUsers.length}人のユーザーを表示中` : 
                       '日別の勤務時間を表示しています'}
                      {!isChartLoading && (
                        <span className="ml-2 text-xs">
                          最終更新: {lastUpdateTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                
                {/* 累計時間表示（中央） */}
                <div className="flex gap-3 justify-center">
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg blur opacity-60 group-hover:opacity-80 transition duration-300"></div>
                    <div className="relative bg-white/90 dark:bg-gray-900/80 backdrop-blur-md rounded-lg px-4 py-2 border-2 border-blue-300 dark:border-blue-500 shadow-lg transition-all duration-300">
                      <div className="text-sm text-blue-700 dark:text-blue-300 font-bold text-center mb-0.5">今日累計</div>
                      <div className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-800 dark:from-blue-300 dark:to-blue-400 bg-clip-text text-transparent">0:00</div>
                    </div>
                  </div>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg blur opacity-60 group-hover:opacity-80 transition duration-300"></div>
                    <div className="relative bg-white/90 dark:bg-gray-900/80 backdrop-blur-md rounded-lg px-4 py-2 border-2 border-purple-300 dark:border-purple-500 shadow-lg transition-all duration-300">
                      <div className="text-sm text-purple-700 dark:text-purple-300 font-bold text-center mb-0.5">今月累計</div>
                      <div className="text-xl font-bold bg-gradient-to-r from-purple-700 to-purple-800 dark:from-purple-300 dark:to-purple-400 bg-clip-text text-transparent">0:00</div>
                    </div>
                  </div>
                </div>
                
                {/* APIテストボタンと更新ボタン（右側） */}
                <div className="flex justify-end gap-2">
                  {/* Google Sheets監視ボタン */}
                  <Button
                    onClick={toggleMonitoring}
                    className={`relative group h-10 px-3 overflow-hidden rounded-lg transition-all duration-300`}
                    variant="outline"
                  >
                    <div className={`absolute inset-0 transition-all duration-300 ${isMonitoring ? 'bg-gradient-to-r from-green-400 to-green-500 animate-pulse' : 'bg-gradient-to-r from-gray-400 to-gray-500'}`}></div>
                    <div className="relative flex items-center gap-2 text-white font-semibold">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {isMonitoring ? 'Sheets監視中' : 'Sheets監視OFF'}
                    </div>
                  </Button>
                  
                  {/* 自動更新トグル */}
                  <Button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`relative group h-10 px-3 overflow-hidden rounded-lg transition-all duration-300`}
                    variant="outline"
                  >
                    <div className={`absolute inset-0 transition-all duration-300 ${autoRefresh ? 'bg-gradient-to-r from-blue-400 to-blue-500' : 'bg-gradient-to-r from-gray-400 to-gray-500'}`}></div>
                    <div className="relative flex items-center gap-2 text-white font-semibold">
                      <svg className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {autoRefresh ? '自動更新ON' : '自動更新OFF'}
                    </div>
                  </Button>
                  
                  {/* 手動更新ボタン */}
                  <Button
                    onClick={handleRefresh}
                    disabled={isChartLoading}
                    className="relative group h-10 px-3 overflow-hidden rounded-lg transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-500 dark:from-purple-600 dark:to-purple-700 transition-all duration-300 group-hover:from-purple-500 group-hover:to-purple-600"></div>
                    <div className="relative flex items-center gap-2 text-white font-semibold">
                      <svg className={`w-4 h-4 ${isChartLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {isChartLoading ? '更新中...' : '更新'}
                    </div>
                  </Button>
                  
                  {/* APIテストボタン */}
                  <Button
                    onClick={handleApiTest}
                    className="relative group h-10 px-4 overflow-hidden rounded-lg transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 dark:from-green-600 dark:to-green-700 transition-all duration-300 group-hover:from-green-500 group-hover:to-green-600 dark:group-hover:from-green-500 dark:group-hover:to-green-600"></div>
                    <div className="relative flex items-center gap-2 text-white font-semibold">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      APIテスト
                    </div>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 flex-1 overflow-hidden">
              <div className="w-full h-full">
                <ChartContainer config={chartConfig} className="h-full" style={{ minWidth: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{
                        top: 10,
                        right: 20,
                        left: 35,
                        bottom: 45,
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
                        domain={[0, 12]}
                        ticks={[0, 2, 4, 6, 8, 10, 12]}
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
                              if (entry.value !== null && entry.value !== undefined && entry.value > 0) {
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
                        
                        return (
                          <Line
                            key={userName}
                            type="monotone"
                            dataKey={userName}
                            stroke={color}
                            strokeWidth={1.5}
                            dot={{ 
                              r: 3, 
                              fill: color, 
                              strokeWidth: 1, 
                              stroke: "white"
                            }}
                            connectNulls={true}
                            activeDot={{ 
                              r: 6, 
                              strokeWidth: 2, 
                              stroke: color, 
                              fill: "white"
                            }}
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