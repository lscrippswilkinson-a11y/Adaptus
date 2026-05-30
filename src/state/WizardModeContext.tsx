import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type WizardMode = 'guided' | 'summary'

const STORAGE_KEY = 'adaptus-wizard-mode'

interface WizardModeValue {
  mode: WizardMode
  setMode: (mode: WizardMode) => void
}

const WizardModeCtx = createContext<WizardModeValue | null>(null)

/**
 * Holds whether stages render as a step-by-step guided wizard or as the full
 * "summary" page (every field at once), and persists the choice. Guided is the
 * default so newcomers get one focused question at a time; once someone switches
 * to the summary view it sticks across stages and sessions.
 */
export function WizardModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<WizardMode>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'summary' ? 'summary' : 'guided'
    } catch {
      return 'guided'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      /* ignore storage failures (private mode, quota) */
    }
  }, [mode])

  return <WizardModeCtx.Provider value={{ mode, setMode }}>{children}</WizardModeCtx.Provider>
}

export function useWizardMode(): WizardModeValue {
  const ctx = useContext(WizardModeCtx)
  if (!ctx) throw new Error('useWizardMode must be used within a WizardModeProvider')
  return ctx
}
