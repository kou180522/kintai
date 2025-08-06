"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import type { ChartConfig } from "~/components/ui/chart"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, ReferenceLine } from "recharts"

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

// 各人の平均勤務時間を計算（null値を除外）
const calculateAverage = (person: string) => {
  const values = chartData
    .map(data => data[person as keyof typeof data])
    .filter(value => value !== null && typeof value === 'number') as number[]
  return values.reduce((sum, val) => sum + val, 0) / values.length
}

const averages = {
  田中: calculateAverage('田中'),
  佐藤: calculateAverage('佐藤'),
  山田: calculateAverage('山田'),
}

export function Dashboard() {
  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>勤務時間推移</CardTitle>
            <CardDescription>
              日別の勤務時間を表示しています
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 10,
                    left: 10,
                    bottom: 40,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
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
                    tick={{ fontSize: 9 }}
                    label={{ value: 'date', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    label={{ value: 'hour', angle: -90, position: 'insideLeft' }}
                    domain={[0, 12]}
                    ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <Line
                    type="monotone"
                    dataKey="田中"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "hsl(var(--chart-1))" }}
                    connectNulls={true}
                  />
                  <Line
                    type="monotone"
                    dataKey="佐藤"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "hsl(var(--chart-2))" }}
                    connectNulls={true}
                  />
                  <Line
                    type="monotone"
                    dataKey="山田"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "hsl(var(--chart-3))" }}
                    connectNulls={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}