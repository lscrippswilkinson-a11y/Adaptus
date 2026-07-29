/**
 * Lightweight, dependency-free i18n.
 *
 * Design: the ENGLISH SOURCE STRING IS THE KEY (gettext style). There is no
 * separate key namespace to keep in sync, English needs no dictionary, and a
 * missing translation degrades to readable English rather than a raw key.
 *
 * Only the DISPLAY layer is translated. Anything persisted into a project
 * (a chosen change type, a channel name, a status) stays in canonical English
 * so a user switching language never orphans their own saved data; the stored
 * value is passed back through `t()` at render time.
 *
 * Dictionaries are loaded on demand (`import()`), so a user on English never
 * downloads a byte of translation data.
 */

export type Lang = 'en' | 'es' | 'fr' | 'de' | 'nl' | 'it' | 'fi' | 'zh'

export interface LanguageInfo {
  code: Lang
  /** Endonym: the language's name in its own language. */
  label: string
  /** English name, shown as a secondary hint in the picker. */
  english: string
}

export const LANGUAGES: LanguageInfo[] = [
  { code: 'en', label: 'English', english: 'English' },
  { code: 'es', label: 'Español', english: 'Spanish' },
  { code: 'fr', label: 'Français', english: 'French' },
  { code: 'de', label: 'Deutsch', english: 'German' },
  { code: 'nl', label: 'Nederlands', english: 'Dutch' },
  { code: 'it', label: 'Italiano', english: 'Italian' },
  { code: 'fi', label: 'Suomi', english: 'Finnish' },
  { code: 'zh', label: '中文', english: 'Chinese (Simplified)' },
]

export const LANG_CODES = LANGUAGES.map((l) => l.code)

export function isLang(v: unknown): v is Lang {
  return typeof v === 'string' && (LANG_CODES as string[]).includes(v)
}

export type Dict = Record<string, string>

/** Locale chunks are code-split; English is the source and has no dictionary. */
const LOADERS: Record<Exclude<Lang, 'en'>, () => Promise<{ default: Dict }>> = {
  es: () => import('./locales/es'),
  fr: () => import('./locales/fr'),
  de: () => import('./locales/de'),
  nl: () => import('./locales/nl'),
  it: () => import('./locales/it'),
  fi: () => import('./locales/fi'),
  zh: () => import('./locales/zh'),
}

let currentLang: Lang = 'en'
let currentDict: Dict | null = null

export function getLang(): Lang {
  return currentLang
}

/**
 * Loads a locale's dictionary and makes it live. Resolves once `t()` is
 * returning the new language, so callers can hold off rendering until then and
 * avoid a flash of English.
 */
export async function activateLang(lang: Lang): Promise<void> {
  if (lang === 'en') {
    currentLang = 'en'
    currentDict = null
    return
  }
  try {
    const mod = await LOADERS[lang]()
    currentDict = mod.default
    currentLang = lang
  } catch {
    // A chunk that fails to load (offline, bad deploy) must not white-screen
    // the app; fall back to the English source strings.
    currentDict = null
    currentLang = 'en'
  }
}

/** Translate one English source string. Unknown strings pass through. */
export function t(source: string): string {
  if (!currentDict) return source
  return currentDict[source] ?? source
}

/**
 * Translate a string containing `{name}` placeholders, then substitute. Keeps
 * word order under the translator's control, which matters because several
 * languages cannot use English's subject-first phrasing.
 */
export function tp(source: string, vars: Record<string, string | number>): string {
  return t(source).replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in vars ? String(vars[key]) : whole,
  )
}

/**
 * Marks a string for extraction without translating it at the call site. Use
 * where a literal must stay a plain module-level constant (option lists that
 * are persisted as canonical English) but its text still needs a dictionary
 * entry for the display-time `t()` call elsewhere.
 */
export function tMark<T extends string>(source: T): T {
  return source
}

const STORAGE_KEY = 'adaptus.lang'

/** The stored choice, else the closest match to the browser's language. */
export function detectLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isLang(stored)) return stored
  } catch {
    /* ignore storage failures (private mode, quota) */
  }
  try {
    for (const tag of navigator.languages ?? [navigator.language]) {
      const base = tag.toLowerCase().split('-')[0]
      if (base === 'zh') return 'zh'
      if (isLang(base)) return base
    }
  } catch {
    /* ignore */
  }
  return 'en'
}

export function storeLang(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    /* ignore storage failures */
  }
}

/** BCP-47 tag for the <html lang> attribute and Intl formatting. */
export function htmlLang(lang: Lang): string {
  return lang === 'zh' ? 'zh-Hans' : lang
}
