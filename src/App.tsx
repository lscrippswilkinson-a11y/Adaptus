import { AppProvider, useApp } from '@/state/AppContext'
import { Dashboard } from '@/components/Dashboard'
import { Workspace } from '@/components/Workspace'
import { CelebrationOverlay } from '@/components/overlays/CelebrationOverlay'
import { LevelUpOverlay } from '@/components/overlays/LevelUpOverlay'

function Root() {
  const { state, dispatch } = useApp()
  const active = state.projects.find((p) => p.id === state.activeId) ?? null

  return (
    <>
      {state.view === 'workspace' && active ? <Workspace project={active} /> : <Dashboard />}
      {state.celebration && (
        <CelebrationOverlay stage={state.celebration} onDone={() => dispatch({ type: 'DISMISS_CELEBRATION' })} />
      )}
      {state.levelUp && <LevelUpOverlay level={state.levelUp} onDone={() => dispatch({ type: 'DISMISS_LEVELUP' })} />}
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Root />
    </AppProvider>
  )
}
