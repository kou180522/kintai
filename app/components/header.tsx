import { Link, useLocation } from "react-router";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  const location = useLocation();
  const isOnHistoryPage = location.pathname === "/page2";
  
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-all duration-500 ease-in-out relative z-50">
      <div className="h-16 flex items-center justify-between px-6 relative">
        {/* 左側のテーマ切り替えボタン */}
        <div className="flex-1">
          <ThemeToggle />
        </div>
        
        {/* 中央のロゴ */}
        <Link to="/" className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg"></div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">TimeSync Pro</span>
        </Link>
        
        {/* 右側のボタン */}
        <div className="flex-1 flex justify-end gap-3">
          <button
            onClick={() => console.log("編集申請")}
            className="relative group z-10"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg opacity-100 group-hover:opacity-100 blur-sm transition duration-300 group-hover:duration-200"></div>
            <div className="relative z-10 flex items-center gap-2 px-5 py-2 bg-white dark:bg-gray-900 rounded-lg leading-none transition-all duration-500 ease-in-out border border-gray-200 dark:border-transparent">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition duration-200">
                編集申請
              </span>
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-white transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          </button>
          
          <Link
            to={isOnHistoryPage ? "/" : "/page2"}
            className="relative group z-10"
            onClick={() => console.log(isOnHistoryPage ? "ホームへ戻る" : "履歴ページへ")}
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg opacity-100 group-hover:opacity-100 blur-sm transition duration-300 group-hover:duration-200"></div>
            <div className="relative z-10 flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-gray-900 rounded-lg leading-none transition-all duration-500 ease-in-out border border-gray-200 dark:border-transparent">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition duration-200">
                {isOnHistoryPage ? "ホーム" : "履歴"}
              </span>
              <div className="relative w-5 h-5">
                {isOnHistoryPage ? (
                  <>
                    <svg 
                      className="absolute inset-0 w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-white transition-all duration-300 group-hover:-translate-x-0.5" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <svg 
                      className="absolute inset-0 w-5 h-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-1 group-hover:-translate-x-0.5" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7" />
                    </svg>
                  </>
                ) : (
                  <>
                    <svg 
                      className="absolute inset-0 w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-white transition-all duration-300 group-hover:translate-x-0.5" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <svg 
                      className="absolute inset-0 w-5 h-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0.5" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </div>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}