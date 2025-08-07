import * as React from "react"
import { useTheme } from "next-themes"
import { Button } from "~/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [isAnimating, setIsAnimating] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleThemeToggle = () => {
    console.log("Theme toggle clicked. Current theme:", theme)
    setIsAnimating(true)
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    console.log("Setting theme to:", newTheme)
    setTimeout(() => setIsAnimating(false), 300)
  }

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleThemeToggle}
      className="relative z-10 h-9 w-9 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105"
    >
      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 pointer-events-none ${isAnimating ? 'scale-0 rotate-180' : 'scale-100 rotate-0'} ${theme === 'light' ? 'opacity-100' : 'opacity-0'}`}>
        <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </div>
      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 pointer-events-none ${isAnimating ? 'scale-0 -rotate-180' : 'scale-100 rotate-0'} ${theme === 'dark' ? 'opacity-100' : 'opacity-0'}`}>
        <svg className="h-5 w-5 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}