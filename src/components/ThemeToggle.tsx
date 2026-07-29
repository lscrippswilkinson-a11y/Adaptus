import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/state/ThemeContext'
import { useLanguage } from '@/i18n/LanguageContext'

/**
 * Flips between light and dark themes. `prominent` renders a labeled, accent
 * button (used on the home page so people notice dark mode exists); otherwise
 * it's a compact icon button for dense headers.
 */
export function ThemeToggle({ prominent = false }: { prominent?: boolean }) {
  const { t } = useLanguage()
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'
  const label = isDark ? t('Light mode') : t('Dark mode')
  // Some languages capitalize differently or don't case-fold the way English
  // does, so the switch-to hint is its own entry rather than a lowercased label.
  const hint = isDark ? t('Switch to light mode') : t('Switch to dark mode')

  if (prominent) {
    return (
      <button
        type="button"
        onClick={toggle}
        title={hint}
        aria-label={hint}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          height: '38px',
          padding: '0 16px',
          background: 'rgba(91,134,163,0.14)',
          border: '1px solid rgba(91,134,163,0.5)',
          borderRadius: '10px',
          color: 'var(--accent-text)',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />} {label}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={hint}
      aria-label={hint}
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
