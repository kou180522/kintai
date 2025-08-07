import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

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