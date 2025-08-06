import type { Route } from "./+types/page2";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Page 2" },
    { name: "description", content: "Second page of the attendance management system" },
  ];
}

export default function Page2() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(100,100,120,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(100,100,120,0.3),transparent_50%)]"></div>
      </div>
      <div className="container mx-auto p-4 relative z-10">
        <div className="bg-black/40 backdrop-blur-xl rounded-xl p-8 border border-white/10">
          <h1 className="text-3xl font-bold text-white mb-4">ページ 2</h1>
          <p className="text-gray-300">ここはページ2です。追加のコンテンツをここに配置できます。</p>
          <a 
            href="/"
            className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-semibold rounded-lg hover:from-slate-500 hover:to-slate-600 transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            ダッシュボードに戻る
          </a>
        </div>
      </div>
    </div>
  );
}