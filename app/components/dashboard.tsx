"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { Separator } from "~/components/ui/separator"
import { Button } from "~/components/ui/button"
import { Textarea } from "~/components/ui/textarea"
import type { ChartConfig } from "~/components/ui/chart"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

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
    }, 1000)

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

  // アナログ時計用の計算
  const hours = currentTime.getHours() % 12
  const minutes = currentTime.getMinutes()
  const seconds = currentTime.getSeconds()
  
  const hourDegrees = (hours * 30) + (minutes * 0.5)
  const minuteDegrees = minutes * 6
  const secondDegrees = seconds * 6

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(100,100,120,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(100,100,120,0.3),transparent_50%)]"></div>
      </div>
      <div className="container mx-auto p-4 relative z-10">
        <div className="flex flex-col gap-0">
          {/* 統合カード */}
          <Card className="w-full shadow-2xl border-0 bg-black/40 backdrop-blur-xl overflow-hidden">
            {/* 打刻セクション */}
            <div className="bg-gradient-to-r from-slate-700/30 to-slate-600/30 backdrop-blur-sm p-4 border-b border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div className="flex gap-3 items-center justify-center">
                  {/* デジタル時計 */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative text-center space-y-1 bg-black/50 backdrop-blur-md rounded-xl py-3 px-4 border border-white/20">
                      <div className="text-xs font-medium text-gray-300">
                        {formatDate(currentTime)}
                      </div>
                      <div className="text-2xl font-bold tracking-wider text-white">
                        {formatTime(currentTime)}
                      </div>
                    </div>
                  </div>
                  
                  {/* アナログ時計 */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative w-24 h-24 bg-black/50 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center">
                      <svg className="w-20 h-20" viewBox="0 0 100 100">
                        {/* 時計の文字盤 */}
                        <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2"/>
                        {/* 時間のマーカー */}
                        {[...Array(12)].map((_, i) => (
                          <line
                            key={i}
                            x1="50"
                            y1="5"
                            x2="50"
                            y2="10"
                            stroke="rgba(255,255,255,0.5)"
                            strokeWidth="2"
                            transform={`rotate(${i * 30} 50 50)`}
                          />
                        ))}
                        {/* 時針 */}
                        <line
                          x1="50"
                          y1="50"
                          x2="50"
                          y2="25"
                          stroke="rgba(255,255,255,0.8)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          transform={`rotate(${hourDegrees} 50 50)`}
                        />
                        {/* 分針 */}
                        <line
                          x1="50"
                          y1="50"
                          x2="50"
                          y2="15"
                          stroke="rgba(255,255,255,0.9)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          transform={`rotate(${minuteDegrees} 50 50)`}
                        />
                        {/* 秒針 */}
                        <line
                          x1="50"
                          y1="50"
                          x2="50"
                          y2="10"
                          stroke="#ef4444"
                          strokeWidth="1"
                          strokeLinecap="round"
                          transform={`rotate(${secondDegrees} 50 50)`}
                        />
                        {/* 中心点 */}
                        <circle cx="50" cy="50" r="3" fill="rgba(255,255,255,0.9)"/>
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-3 flex gap-3 items-center">
                  <div className="grid grid-cols-2 gap-3 flex-grow-0" style={{ minWidth: '280px' }}>
                    <Button 
                      onClick={handleClockIn}
                      className="relative group w-full h-16 text-base font-bold overflow-hidden rounded-xl transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-700 to-slate-800 transition-all duration-300 group-hover:from-slate-600 group-hover:to-slate-700"></div>
                      <div className="relative flex items-center justify-center gap-2 text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        出勤
                      </div>
                    </Button>
                    <Button 
                      onClick={handleClockOut}
                      className="relative group w-full h-16 text-base font-bold overflow-hidden rounded-xl transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-600 to-slate-700 transition-all duration-300 group-hover:from-slate-500 group-hover:to-slate-600"></div>
                      <div className="relative flex items-center justify-center gap-2 text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        退勤
                      </div>
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-grow">
                    <label className="text-xs font-medium text-gray-300 whitespace-nowrap">コメント:</label>
                    <Textarea
                      placeholder="打刻時間の打ち忘れ"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="resize-none bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs h-10 py-2 rounded-xl backdrop-blur-sm w-full"
                      rows={1}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* グラフヘッダー */}
            <CardHeader className="py-4 px-6 bg-gradient-to-r from-slate-700/20 to-slate-600/20 backdrop-blur-sm border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-slate-600 to-slate-700 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-white">
                    勤務時間推移
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-300 mt-0.5">
                    日別の勤務時間を表示しています
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="w-full overflow-x-auto">
                <ChartContainer config={chartConfig} className="h-[calc(100vh-280px)]" style={{ minWidth: '1400px', minHeight: '400px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 30,
                        bottom: 60,
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
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        dataKey="date"
                        stroke="rgba(255,255,255,0.5)"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getDate()}`;
                        }}
                        interval={0}
                        angle={0}
                        textAnchor="middle"
                        tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.7)' }}
                        label={{ value: 'Date', position: 'insideBottom', offset: -5, style: { fill: 'rgba(255,255,255,0.7)' } }}
                      />
                      <YAxis
                        stroke="rgba(255,255,255,0.5)"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fill: 'rgba(255,255,255,0.7)' } }}
                        domain={[0, 12]}
                        ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
                        tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.7)' }}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent />}
                      />
                      <Line
                        type="monotone"
                        dataKey="田中"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ r: 5, fill: "#3B82F6", strokeWidth: 2, stroke: "rgba(255,255,255,0.8)" }}
                        connectNulls={true}
                        activeDot={{ r: 7, strokeWidth: 0 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="佐藤"
                        stroke="#10B981"
                        strokeWidth={3}
                        dot={{ r: 5, fill: "#10B981", strokeWidth: 2, stroke: "rgba(255,255,255,0.8)" }}
                        connectNulls={true}
                        activeDot={{ r: 7, strokeWidth: 0 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="山田"
                        stroke="#F59E0B"
                        strokeWidth={3}
                        dot={{ r: 5, fill: "#F59E0B", strokeWidth: 2, stroke: "rgba(255,255,255,0.8)" }}
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