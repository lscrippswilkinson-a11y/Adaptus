import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { hasSupabase } from '@/lib/supabase'
import { fetchPlan } from '@/lib/projectsRepo'
import { PLAN_OVERRIDE, type Plan } from '@/lib/plan'
import { useAuth } from '@/state/AuthContext'

interface PlanValue {
  plan: Plan
  /** The one flag every gate reads. */
  isPro: boolean
  /** False until the plan is known; gates stay locked while it's true. */
  loading: boolean
  /** Re-read the plan (after returning from checkout). */
  refresh: () => void
}

const PlanCtx = createContext<PlanValue | null>(null)

/**
 * The signed-in user's plan, read once at sign-in and re-read whenever they come
 * back to the tab — that last part is what makes the hosted payment link work:
 * they upgrade in another tab, switch back, and the locks are simply gone.
 */
export function PlanProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const cloud = hasSupabase && !PLAN_OVERRIDE
  const [plan, setPlan] = useState<Plan>(PLAN_OVERRIDE ?? 'free')
  const [loading, setLoading] = useState(cloud)
  // Bumped by refresh() to re-run the load effect.
  const [nonce, setNonce] = useState(0)
  const userId = user?.id ?? null

  const refresh = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    if (!cloud || !userId) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    fetchPlan(userId)
      .then((p) => {
        if (!cancelled) setPlan(p)
      })
      .catch((err) => {
        // A failed read must not lock a paying customer out of what they bought,
        // but it mustn't hand out Pro either: keep whatever we last knew.
        console.error('[adaptus] failed to read plan (keeping last known)', err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [cloud, userId, nonce])

  // Re-check on tab focus, but not more than once a minute: the only thing that
  // changes a plan mid-session is a checkout completing in another tab.
  const lastCheck = useRef(0)
  useEffect(() => {
    if (!cloud || !userId) return
    const onFocus = () => {
      const now = Date.now()
      if (now - lastCheck.current < 60_000) return
      lastCheck.current = now
      refresh()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [cloud, userId, refresh])

  return <PlanCtx.Provider value={{ plan, isPro: plan === 'pro', loading, refresh }}>{children}</PlanCtx.Provider>
}

export function usePlan(): PlanValue {
  const ctx = useContext(PlanCtx)
  if (!ctx) throw new Error('usePlan must be used within a <PlanProvider>')
  return ctx
}
