import { Link } from "react-router";

export function Header() {
  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="h-16 flex items-center justify-center">
        <Link to="/" className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg"></div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">TimeSync Pro</span>
        </Link>
      </div>
    </header>
  );
}