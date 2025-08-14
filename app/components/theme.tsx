import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "./ui/button"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

export function ThemeTransition() {
  const { theme } = useTheme()
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    setIsTransitioning(true)
    const timer = setTimeout(() => {
      setIsTransitioning(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [theme])

  if (!isTransitioning) return null

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50"
      style={{
        background: theme === 'dark' 
          ? 'radial-gradient(circle at center, rgba(59, 130, 246, 0.1) 0%, transparent 50%)' 
          : 'radial-gradient(circle at center, rgba(251, 191, 36, 0.1) 0%, transparent 50%)',
        animation: 'fadeInOut 600ms ease-in-out'
      }}
    />
  )
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isRotating, setIsRotating] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9 rounded-lg bg-gray-100 dark:bg-gray-800"
      >
        <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
      </Button>
    )
  }

  const handleToggle = () => {
    setIsRotating(true)
    setTheme(theme === "dark" ? "light" : "dark")
    setTimeout(() => setIsRotating(false), 500)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className="relative h-9 w-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-110"
      style={{
        animation: isRotating ? (theme === 'dark' ? 'rotateIn 500ms ease-out' : 'rotateOut 500ms ease-out') : 'none'
      }}
    >
      <Sun className={`h-5 w-5 transition-all duration-500 ${
        theme === 'dark' 
          ? 'rotate-90 scale-0 opacity-0' 
          : 'rotate-0 scale-100 opacity-100 text-amber-500 hover:text-amber-600'
      }`} />
      <Moon className={`absolute h-5 w-5 transition-all duration-500 ${
        theme === 'dark' 
          ? 'rotate-0 scale-100 opacity-100 text-blue-400 hover:text-blue-300' 
          : '-rotate-90 scale-0 opacity-0'
      }`} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}