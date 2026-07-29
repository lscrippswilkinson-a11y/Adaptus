import { Fragment, createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { activateLang, detectLang, htmlLang, storeLang, t, tp, type Lang } from '@/i18n'

interface LanguageValue {
  lang: Lang
  setLang: (lang: Lang) => void
  /** Translate. Identical to the module-level `t`, but reading it from context
   *  is what subscribes a component to re-render when the language changes. */
  t: (source: string) => string
  tp: (source: string, vars: Record<string, string | number>) => string
}

const LanguageCtx = createContext<LanguageValue | null>(null)

/**
 * Holds the active language, persists it, loads its dictionary chunk, and
 * mirrors it onto <html lang>.
 *
 * Children are held back until the first dictionary has loaded so the app never
 * paints English and then swaps under the user. Subsequent switches keep the
 * old language on screen until the new chunk is in, so there's no blank frame.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang)
  const [loaded, setLoaded] = useState<Lang | null>(null)

  useEffect(() => {
    let cancelled = false
    activateLang(lang).then(() => {
      if (cancelled) return
      document.documentElement.setAttribute('lang', htmlLang(lang))
      setLoaded(lang)
    })
    return () => {
      cancelled = true
    }
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    storeLang(next)
    setLangState(next)
  }, [])

  // First paint only: nothing sensible to show before a dictionary exists.
  if (loaded === null) return null

  // Keyed on the language so the whole subtree remounts on a switch. Most copy
  // lives in module-level data (stage labels, coaching prose, business
  // profiles) that only a re-render re-reads; a plain context update would
  // repaint the handful of components that subscribe and leave the rest in the
  // old language. Remounting costs one re-hydrate, which a language switch can
  // well afford. Text inputs commit on blur, so nothing in progress is lost.
  return (
    <LanguageCtx.Provider value={{ lang: loaded, setLang, t, tp }}>
      <Fragment key={loaded}>{children}</Fragment>
    </LanguageCtx.Provider>
  )
}

export function useLanguage(): LanguageValue {
  const ctx = useContext(LanguageCtx)
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider')
  return ctx
}

/** Sugar for the common case: `const t = useT()`. */
export function useT(): (source: string) => string {
  return useLanguage().t
}
