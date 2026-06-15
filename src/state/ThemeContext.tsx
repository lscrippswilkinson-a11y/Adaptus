import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'adaptus-theme'

interface ThemeValue {
  theme: Theme
  toggle: () => void
}

const ThemeCtx = createContext<ThemeValue | null>(null)

/**
 * Holds the light/dark theme, persists it, and reflects it onto
 * <html data-theme="..."> so the CSS token overrides take effect. Light is the
 * default for anyone who hasn't chosen.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* ignore storage failures (private mode, quota) */
    }
  }, [theme])

  return (
    <ThemeCtx.Provider value={{ theme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) }}>
      {children}
    </ThemeCtx.Provider>
  )
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeCtx)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
