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
      const data = await fetchApi(`/api/subpage/monthly-total?months=${monthsToShow}`)
      
      if (data && data.success) {
        setChartData(data.monthly_data || [])
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
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            
            <Button
              onClick={handleRefresh}
              disabled={isLoading}
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </Button>
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
        
        {/* ユーザー別合計時間の表示 */}
        {topUsers.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              期間合計勤務時間
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {topUsers.slice(0, 10).map((userName) => {
                const config = chartConfig[userName]
                return (
                  <div
                    key={userName}
                    className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: config?.color }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                        {config?.label || userName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {config?.total_hours || '0h'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}