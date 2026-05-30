import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/state/ThemeContext'

/** Icon button that flips between light and dark themes. */
export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '38px',
        height: '38px',
        background: 'rgba(var(--fg),0.04)',
        border: '1px solid rgba(var(--fg),0.12)',
        borderRadius: '10px',
        color: 'rgba(var(--fg),0.7)',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}
