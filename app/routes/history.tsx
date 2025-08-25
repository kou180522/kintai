import type { Route } from "./+types/history";
import { MonthlyChart } from "~/components/monthly-chart";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "勤怠Pro - 月別統計" },
    { name: "description", content: "月別勤務時間統計" },
  ];
}

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-500 ease-in-out">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.3),transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_80%,rgba(100,100,120,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.3),transparent_50%)] dark:bg-[radial-gradient(circle_at_80%_20%,rgba(100,100,120,0.3),transparent_50%)]"></div>
      </div>
      <div className="w-full max-w-6xl mx-auto px-4 py-8 relative z-10">
        <MonthlyChart />
      </div>
    </div>
  );
}