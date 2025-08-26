import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import type { ChartConfig } from "~/components/ui/chart"
import { fetchApi } from "~/lib/api-client"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"

export function MonthlyChart() {
  const [chartData, setChartData] = useState<any[]>([])
  const [chartConfig, setChartConfig] = useState<ChartConfig>({})
  const [isLoading, setIsLoading] = useState(false)
  const [monthsToShow, setMonthsToShow] = useState(12)
  const [topUsers, setTopUsers] = useState<string[]>([])

  useEffect(() => {
    fetchMonthlyData()
  }, [monthsToShow])

  const fetchMonthlyData = async () => {
    setIsLoading(true)
    try {
      const data = await fetchApi(`/api/subpage/monthly-by-user?months=${monthsToShow}&top_users=0`)
      
      if (data && data.success) {
        setChartData(data.chart_data || [])
        setChartConfig(data.user_configs || {})
        setTopUsers(Object.keys(data.user_configs || {}))
      }
    } catch (error) {
      console.error('月合計データ取得エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchMonthlyData()
  }

  return (
    <Card className="w-full bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-800 dark:bg-white rounded-lg transition-colors duration-300">
              <svg className="w-5 h-5 text-white dark:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} 
                  d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                月別合計勤務時間
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 dark:text-gray-300">
                {isLoading ? 'データ読み込み中...' : 
                 `過去${monthsToShow}ヶ月の月別合計（上位${topUsers.length}名）`}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={monthsToShow}
              onChange={(e) => setMonthsToShow(Number(e.target.value))}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            >
              <option value={6}>過去6ヶ月</option>
              <option value={12}>過去12ヶ月</option>
              <option value={24}>過去24ヶ月</option>
            </select>
            
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="relative group z-10"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-gray-300 rounded-lg opacity-100 blur-[1px] transition-all duration-300 group-hover:blur-[2px]"></div>
              <div className="relative z-10 flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 rounded-lg leading-none transition-all duration-500 ease-in-out border-0">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition duration-200">
                  {isLoading ? '更新中' : '更新'}
                </span>
                {isLoading ? (
                  <svg className="animate-spin h-4 w-4 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-white transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </div>
            </button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {chartData.length > 0 ? (
          <div className="h-[400px] w-full">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 40, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="month" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => {
                      const [year, month] = value.split('-')
                      return `${year}年${parseInt(month)}月`
                    }}
                  />
                  <YAxis 
                    label={{ value: '時間', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip 
                    content={
                      <ChartTooltipContent 
                        labelFormatter={(value) => {
                          const [year, month] = value.split('-')
                          return `${year}年${parseInt(month)}月`
                        }}
                        formatter={(value, name) => {
                          const config = chartConfig[name as string]
                          const formatted = chartData.find(d => d.month === value)?.[`${name}_formatted`]
                          return (
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: config?.color }}
                              />
                              <span className="font-medium">{config?.label || name}:</span>
                              <span>{formatted || `${value}時間`}</span>
                            </div>
                          )
                        }}
                      />
                    }
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                    formatter={(value) => {
                      const config = chartConfig[value]
                      return config?.label || value
                    }}
                  />
                  
                  {/* 各ユーザーの折れ線を表示 */}
                  {topUsers.map((userName, index) => (
                    <Line
                      key={userName}
                      type="monotone"
                      dataKey={userName}
                      stroke={chartConfig[userName]?.color || `hsl(${index * 24}, 70%, 50%)`}
                      strokeWidth={2}
                      dot={{ r: 4, fill: chartConfig[userName]?.color || `hsl(${index * 24}, 70%, 50%)` }}
                      activeDot={{ r: 6 }}
                      connectNulls={false}
                      name={userName}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        ) : (
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">
              {isLoading ? 'データを読み込み中...' : 'データがありません'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}