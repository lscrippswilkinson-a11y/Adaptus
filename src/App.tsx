import { AppProvider, useApp } from '@/state/AppContext'
import { ThemeProvider } from '@/state/ThemeContext'
import { Dashboard } from '@/components/Dashboard'
import { Workspace } from '@/components/Workspace'

function Root() {
  const { state } = useApp()
  const active = state.projects.find((p) => p.id === state.activeId) ?? null
  return state.view === 'workspace' && active ? <Workspace project={active} /> : <Dashboard />
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <Root />
      </AppProvider>
    </ThemeProvider>
  )
}
