import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import type { Project, StageData, StageId } from '@/types'
import { appReducer, type AppAction, type AppState } from '@/state/appReducer'
import { loadProjects, saveProjects } from '@/lib/storage'

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

const AppContext = createContext<AppContextValue | null>(null)

function init(): AppState {
  return {
    projects: loadProjects(),
    view: 'dashboard',
    activeId: null,
    stageIdx: 0,
    celebration: null,
    levelUp: null,
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, init)

  // Persist only the project list; view/nav state is ephemeral.
  useEffect(() => {
    saveProjects(state.projects)
  }, [state.projects])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within <AppProvider>')
  return ctx
}

/** The project currently open in the workspace, or null. */
export function useActiveProject(): Project | null {
  const { state } = useApp()
  return state.projects.find((p) => p.id === state.activeId) ?? null
}

/**
 * Editing helpers for the active project, scoped to a single stage. Stage form
 * components use this to read their slice of stageData and patch it.
 */
export function useStageEditor<K extends StageId>(stageId: K) {
  const { state, dispatch } = useApp()
  const project = state.projects.find((p) => p.id === state.activeId) ?? null
  const data = project ? project.stageData[stageId] : null

  const update = useCallback(
    (partial: Partial<StageData[K]>) => {
      if (!project) return
      const next: Project = {
        ...project,
        stageData: {
          ...project.stageData,
          [stageId]: { ...project.stageData[stageId], ...partial },
        },
      }
      dispatch({ type: 'UPDATE_PROJECT', project: next })
    },
    [dispatch, project, stageId],
  )

  return { project, data: data as StageData[K], update }
}
