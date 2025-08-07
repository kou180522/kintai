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

const chartData = [
  { date: "2025-01-01", 田中: null, 佐藤: null, 山田: null },
  { date: "2025-01-02", 田中: null, 佐藤: null, 山田: null },
  { date: "2025-01-03", 田中: null, 佐藤: null, 山田: null },
  { date: "2025-01-04", 田中: null, 佐藤: null, 山田: null },
  { date: "2025-01-05", 田中: null, 佐藤: null, 山田: null },
  { date: "2025-01-06", 田中: null, 佐藤: null, 山田: null },
  { date: "2025-01-07", 田中: null, 佐藤: null, 山田: null },
  { date: "2025-01-08", 田中: null, 佐藤: null, 山田: null },
  { date: "2025-01-09", 田中: null, 佐藤: null, 山田: null },
  { date: "2025-01-10", 田中: null, 佐藤: null, 山田: null },
  { date: "2025-01-11", 田中: null, 佐藤: null, 山田: null },
  { date: "2025-01-12", 田中: null, 佐藤: null, 山田: null },
  { date: "2025-01-13", 田中: null, 佐藤: null, 山田: null },
  { date: "2025-01-14", 田中: null, 佐藤: null, 山田: null },
  { date: "2025-01-15", 田中: null, 佐藤: null, 山田: null },
  { date: "2025-01-16", 田中: null, 佐藤: null, 山田: null },
  { date: "2025-01-17", 田中: null, 佐藤: null, 山田: null },
  { date: "2025-01-18", 田中: null, 佐藤: null, 山田: null },
  { date: "2025-01-19", 田中: null, 佐藤: null, 山田: null },
  { date: "2025-01-20", 田中: null, 佐藤: null, 山田: null },
  { date: "2025-01-21", 田中: null, 佐藤: null, 山田: null },
  { date: "2025-01-22", 田中: null, 佐藤: null, 山田: null },
  { date: "2025-01-23", 田中: null, 佐藤: null, 山田: null },
  { date: "2025-01-24", 田中: null, 佐藤: null, 山田: null },
  { date: "2025-01-25", 田中: null, 佐藤: null, 山田: null },
  { date: "2025-01-26", 田中: null, 佐藤: null, 山田: null },
  { date: "2025-01-27", 田中: null, 佐藤: null, 山田: null },
  { date: "2025-01-28", 田中: null, 佐藤: null, 山田: null },
  { date: "2025-01-29", 田中: null, 佐藤: null, 山田: null },
  { date: "2025-01-30", 田中: null, 佐藤: null, 山田: null },
  { date: "2025-01-31", 田中: null, 佐藤: null, 山田: null },
]

const chartConfig = {
  田中: {
    label: "田中",
    color: "hsl(var(--chart-1))",
  },
  佐藤: {
    label: "佐藤",
    color: "hsl(var(--chart-2))",
  },
  山田: {
    label: "山田",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [comment, setComment] = useState("")

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 100) // 100msごとに更新してスムーズな動きを実現

    return () => clearInterval(timer)
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

  const handleClockIn = () => {
    console.log("出勤打刻:", formatTime(currentTime), "コメント:", comment)
  }

  const handleClockOut = () => {
    console.log("退勤打刻:", formatTime(currentTime), "コメント:", comment)
  }

  const handleCommentSubmit = () => {
    console.log("コメント送信:", comment)
    setComment("") // 送信後にコメントをクリア
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
            <div className="bg-gradient-to-r from-gray-100/50 to-gray-200/50 dark:from-slate-700/30 dark:to-slate-600/30 backdrop-blur-sm p-2 border-b border-gray-200/20 dark:border-white/10 transition-all duration-500 ease-in-out">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                <div className="flex gap-3 items-center justify-center">
                  {/* デジタル時計 */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 dark:from-slate-600 dark:to-slate-700 rounded-xl blur-xl opacity-30 group-hover:opacity-50 transition-all duration-300"></div>
                    <div className="relative text-center space-y-0.5 bg-white/70 dark:bg-black/50 backdrop-blur-md rounded-lg py-2 px-3 border border-gray-300/50 dark:border-white/20 transition-all duration-500 ease-in-out">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
                        {formatDate(currentTime)}
                      </div>
                      <div className="text-xl font-bold tracking-wider text-gray-900 dark:text-white">
                        {formatTime(currentTime)}
                      </div>
                    </div>
                  </div>
                  
                  {/* アナログ時計 */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative w-20 h-20 bg-white/70 dark:bg-black/50 backdrop-blur-md rounded-full border border-gray-300/50 dark:border-white/20 flex items-center justify-center transition-all duration-500 ease-in-out">
                      <svg className="w-16 h-16" viewBox="0 0 100 100">
                        {/* 時計の文字盤 */}
                        <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" className="text-gray-300 dark:text-white/20" strokeWidth="2"/>
                        {/* 時間のマーカー */}
                        {[...Array(12)].map((_, i) => (
                          <line
                            key={i}
                            x1="50"
                            y1="5"
                            x2="50"
                            y2="10"
                            stroke="currentColor"
                            className="text-gray-400 dark:text-white/50"
                            strokeWidth="2"
                            transform={`rotate(${i * 30} 50 50)`}
                          />
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
                
                <div className="md:col-span-3 flex gap-3 items-center">
                  <div className="grid grid-cols-2 gap-2 flex-grow-0" style={{ minWidth: '240px' }}>
                    <Button 
                      onClick={handleClockIn}
                      className="relative group w-full h-12 text-sm font-bold overflow-hidden rounded-lg transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 dark:from-slate-700 dark:to-slate-800 transition-all duration-300 group-hover:from-blue-500 group-hover:to-blue-600 dark:group-hover:from-slate-600 dark:group-hover:to-slate-700"></div>
                      <div className="relative flex items-center justify-center gap-2 text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        出勤
                      </div>
                    </Button>
                    <Button 
                      onClick={handleClockOut}
                      className="relative group w-full h-12 text-sm font-bold overflow-hidden rounded-lg transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-500 dark:from-slate-600 dark:to-slate-700 transition-all duration-300 group-hover:from-red-500 group-hover:to-red-600 dark:group-hover:from-slate-500 dark:group-hover:to-slate-600"></div>
                      <div className="relative flex items-center justify-center gap-2 text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        退勤
                      </div>
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-1">
                    <div className="relative flex-1">
                      <Textarea
                        placeholder="コメント"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="resize-none bg-gray-100/50 dark:bg-white/10 border-gray-300/50 dark:border-white/20 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent text-sm h-12 py-3 pr-12 rounded-lg backdrop-blur-sm w-full transition-all duration-500 ease-in-out"
                        rows={1}
                      />
                      <Button
                        onClick={handleCommentSubmit}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
                        variant="ghost"
                        size="sm"
                      >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </Button>
                    </div>
                    
                    <Button 
                      onClick={() => console.log("編集申請")}
                      className="relative group h-12 px-6 text-sm font-bold overflow-hidden rounded-lg transition-all duration-300 whitespace-nowrap"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-500 dark:from-slate-600 dark:to-slate-700 transition-all duration-300 group-hover:from-gray-500 group-hover:to-gray-600 dark:group-hover:from-slate-500 dark:group-hover:to-slate-600"></div>
                      <div className="relative flex items-center justify-center gap-2 text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        編集申請
                      </div>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* グラフヘッダー */}
            <CardHeader className="py-2 px-4 bg-gradient-to-r from-gray-100/50 to-gray-200/50 dark:from-slate-700/20 dark:to-slate-600/20 backdrop-blur-sm border-b border-gray-200/20 dark:border-white/10 transition-colors duration-300">
              <div className="grid grid-cols-3 items-center">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-gradient-to-r from-blue-500 to-purple-500 dark:from-slate-600 dark:to-slate-700 rounded-lg transition-colors duration-300">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-gray-900 dark:text-white">
                      勤務時間推移
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-600 dark:text-gray-300">
                      日別の勤務時間を表示しています
                    </CardDescription>
                  </div>
                </div>
                
                {/* 累計時間表示（中央） */}
                <div className="flex gap-3 justify-center">
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                    <div className="relative bg-white/80 dark:bg-black/50 backdrop-blur-md rounded-lg px-4 py-1.5 border border-blue-200/50 dark:border-blue-400/30 transition-all duration-300">
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold text-center">今日累計</div>
                      <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">0:00</div>
                    </div>
                  </div>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-400 to-purple-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                    <div className="relative bg-white/80 dark:bg-black/50 backdrop-blur-md rounded-lg px-4 py-1.5 border border-purple-200/50 dark:border-purple-400/30 transition-all duration-300">
                      <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold text-center">今月累計</div>
                      <div className="text-lg font-bold bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-400 dark:to-purple-500 bg-clip-text text-transparent">0:00</div>
                    </div>
                  </div>
                </div>
                
                <div></div> {/* 右側の空きスペース */}
              </div>
            </CardHeader>
            <CardContent className="p-1 flex-1 overflow-hidden">
              <div className="w-full h-full">
                <ChartContainer config={chartConfig} className="h-full" style={{ minWidth: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{
                        top: 10,
                        right: 5,
                        left: 25,
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
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-300 dark:text-white/20" strokeOpacity={0.8} />
                      <XAxis
                        dataKey="date"
                        stroke="#6b7280"
                        className="dark:stroke-gray-400"
                        tickLine={true}
                        axisLine={true}
                        tickMargin={4}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getDate()}`;
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
                        ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
                        tick={{ fontSize: 9 }}
                      >
                        <Label value="Hours" angle={-90} position="insideLeft" style={{ fontSize: 12, fontWeight: 600 }} fill="#4b5563" className="dark:fill-gray-300" />
                      </YAxis>
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent />}
                      />
                      <Line
                        type="monotone"
                        dataKey="田中"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#3B82F6", strokeWidth: 1, stroke: "white" }}
                        connectNulls={true}
                        activeDot={{ r: 7, strokeWidth: 0 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="佐藤"
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#10B981", strokeWidth: 1, stroke: "white" }}
                        connectNulls={true}
                        activeDot={{ r: 7, strokeWidth: 0 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="山田"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#F59E0B", strokeWidth: 1, stroke: "white" }}
                        connectNulls={true}
                        activeDot={{ r: 7, strokeWidth: 0 }}
                      />
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