import type { Route } from "./+types/page2";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "履歴" },
    { name: "description", content: "履歴ページ" },
  ];
}

export default function Page2() {
  console.log("Page2コンポーネントがレンダリングされました");
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-500 ease-in-out p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">履歴ページ</h1>
        <p className="text-gray-600 dark:text-gray-300">このページは正常に動作しています。</p>
      </div>
    </div>
  );
}