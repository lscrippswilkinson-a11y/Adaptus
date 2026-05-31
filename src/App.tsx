import { AppProvider, useApp } from '@/state/AppContext'
import { AuthProvider, useAuth } from '@/state/AuthContext'
import { ThemeProvider } from '@/state/ThemeContext'
import { WizardModeProvider } from '@/state/WizardModeContext'
import { hasSupabase } from '@/lib/supabase'
import { SignIn } from '@/components/SignIn'
import { Dashboard } from '@/components/Dashboard'
import { Workspace } from '@/components/Workspace'
import { SharedBriefPage } from '@/components/SharedBriefPage'

function Splash() {
  return (
    <div className="cq-root" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(var(--fg),0.5)', fontSize: '14px' }}>
      Loading…
    </div>
  )
}

function Root() {
  const { state, ready } = useApp()
  if (!ready) return <Splash />
  const active = state.projects.find((p) => p.id === state.activeId) ?? null
  return state.view === 'workspace' && active ? <Workspace project={active} /> : <Dashboard />
}

function Gate() {
  const { loading, session } = useAuth()
  if (hasSupabase) {
    if (loading) return <Splash />
    if (!session) return <SignIn />
  }
  return (
    <AppProvider>
      <Root />
    </AppProvider>
  )
}

export default function App() {
  // Public, no-login route: a shared status brief (/?share=<token>). Rendered
  // ahead of the auth gate so recipients never hit a sign-in wall.
  const shareToken = new URLSearchParams(window.location.search).get('share')
  if (shareToken) {
    return (
      <ThemeProvider>
        <SharedBriefPage token={shareToken} />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <WizardModeProvider>
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </WizardModeProvider>
    </ThemeProvider>
  )
}
