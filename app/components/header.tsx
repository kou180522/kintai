import { Link } from "react-router";

export function Header() {
  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="h-16 flex items-center justify-between px-6 relative">
        {/* 左側の空白スペース */}
        <div className="flex-1"></div>
        
        {/* 中央のロゴ */}
        <Link to="/" className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg"></div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">TimeSync Pro</span>
        </Link>
        
        {/* 右側のボタン */}
        <div className="flex-1 flex justify-end">
          <Link
            to="/page2"
            className="relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg opacity-70 group-hover:opacity-100 blur transition duration-300 group-hover:duration-200 animate-pulse"></div>
            <div className="relative flex items-center gap-2 px-6 py-2.5 bg-gray-900 rounded-lg leading-none">
              <span className="text-sm font-medium text-gray-200 group-hover:text-white transition duration-200">
                履歴
              </span>
              <div className="relative w-5 h-5">
                <svg 
                  className="absolute inset-0 w-5 h-5 text-gray-400 group-hover:text-white transition-all duration-300 group-hover:translate-x-0.5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <svg 
                  className="absolute inset-0 w-5 h-5 text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0.5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}