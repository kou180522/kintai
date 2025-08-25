import { MonthlyChart } from "~/components/monthly-chart"
import { Dashboard } from "~/components/dashboard"

export default function Analytics() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            勤怠分析ダッシュボード
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            チーム全体の勤務時間を可視化して分析
          </p>
        </header>
        
        <div className="space-y-8">
          {/* 月別合計グラフ */}
          <section>
            <MonthlyChart />
          </section>
          
          {/* 日別グラフ */}
          <section>
            <Dashboard />
          </section>
        </div>
      </div>
    </div>
  )
}