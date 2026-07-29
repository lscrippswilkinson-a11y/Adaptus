import { Globe } from 'lucide-react'
import { LANGUAGES, isLang } from '@/i18n'
import { useLanguage } from '@/i18n/LanguageContext'

/**
 * Language picker. A native <select> behind a styled wrapper, so it keeps the
 * platform's keyboard and screen-reader behaviour (and its touch-friendly
 * sheet on mobile) while matching the app's control chrome.
 *
 * `tone="onDark"` is for the coloured sign-in panel, where the standard token
 * colours have no contrast.
 */
export function LanguageSelect({ tone = 'default' }: { tone?: 'default' | 'onDark' }) {
  const { lang, setLang, t } = useLanguage()
  const onDark = tone === 'onDark'

  return (
    <label
      title={t('Language')}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '7px',
        height: '38px',
        padding: '0 10px',
        background: onDark ? 'rgba(255,255,255,0.12)' : 'rgba(var(--fg),0.04)',
        border: `1px solid ${onDark ? 'rgba(255,255,255,0.25)' : 'rgba(var(--fg),0.12)'}`,
        borderRadius: '10px',
        color: onDark ? 'rgba(255,255,255,0.85)' : 'rgba(var(--fg),0.7)',
        cursor: 'pointer',
      }}
    >
      <Globe size={16} style={{ flexShrink: 0 }} />
      <select
        value={lang}
        aria-label={t('Language')}
        onChange={(e) => isLang(e.target.value) && setLang(e.target.value)}
        style={{
          appearance: 'none',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'inherit',
          font: 'inherit',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          paddingRight: '2px',
        }}
      >
        {LANGUAGES.map((l) => (
          // Option text can't be styled per-platform, so it stays on the system
          // background; explicit colours keep it legible in both themes.
          <option key={l.code} value={l.code} style={{ color: '#1a2733', background: '#fff' }}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  )
}
