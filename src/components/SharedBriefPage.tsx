import { useEffect, useState } from 'react'
import type { Project } from '@/types'
import { hasSupabase } from '@/lib/supabase'
import { fetchSharedProject } from '@/lib/projectsRepo'
import { StatusBrief } from '@/components/StatusBrief'

type State = { status: 'loading' } | { status: 'ok'; project: Project } | { status: 'missing' } | { status: 'error' }

/**
 * The public, no-login destination for a share link (`/?share=<token>`). Fetches
 * the project read-only via the get_shared_project RPC and renders its status
 * brief, with a "build your own" call to action: the expansion loop.
 */
export function SharedBriefPage({ token }: { token: string }) {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    if (!hasSupabase) {
      setState({ status: 'error' })
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const project = await fetchSharedProject(token)
        if (cancelled) return
        setState(project ? { status: 'ok', project } : { status: 'missing' })
      } catch (err) {
        console.error('[adaptus] failed to load shared brief', err)
        if (!cancelled) setState({ status: 'error' })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="cq-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 20px' }}>
      <div style={{ width: '100%', maxWidth: '640px' }}>
        {state.status === 'loading' && (
          <div style={{ textAlign: 'center', color: 'rgba(var(--fg),0.5)', fontSize: '14px', marginTop: '80px' }}>Loading…</div>
        )}

        {state.status === 'ok' && <StatusBrief project={state.project} publicView />}

        {(state.status === 'missing' || state.status === 'error') && (
          <div style={{ textAlign: 'center', marginTop: '80px' }}>
            <div style={{ fontSize: '40px', marginBottom: '14px' }}>🔗</div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>
              {state.status === 'missing' ? 'This link isn’t available' : 'Couldn’t load this brief'}
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(var(--fg),0.6)', lineHeight: 1.6, maxWidth: '420px', margin: '0 auto 24px' }}>
              {state.status === 'missing'
                ? 'The share link may have been revoked, or the address is incorrect.'
                : 'Something went wrong fetching this status brief. Please try again later.'}
            </p>
            <a
              href="/"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg,#5B86A3,#3E6580)', borderRadius: '999px', padding: '12px 24px', color: 'var(--on-accent)', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}
            >
              Build your own change plan →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
