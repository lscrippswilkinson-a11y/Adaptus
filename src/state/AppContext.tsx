import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Project, StageData, StageId } from '@/types'
import { appReducer, type AppAction, type AppState } from '@/state/appReducer'
import { loadProjects, loadStoredProjects, saveProjects } from '@/lib/storage'
import { newProjectId } from '@/lib/id'
import { hasSupabase } from '@/lib/supabase'
import { useAuth } from '@/state/AuthContext'
import { acceptInviteLink, acceptPendingInvites, deleteProjectRemote, fetchMyRoles, fetchProjects, insertProject, updateProject } from '@/lib/projectsRepo'

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  /** False while the cloud project list is still loading. */
  ready: boolean
}

const AppContext = createContext<AppContextValue | null>(null)

// When Supabase is configured the app is gated behind auth, so AppProvider only
// mounts for a signed-in user; otherwise it runs in local (localStorage) mode.
const cloud = hasSupabase

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function init(): AppState {
  return {
    projects: cloud ? [] : loadProjects(),
    view: 'dashboard',
    activeId: null,
    stageIdx: 0,
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [state, dispatch] = useReducer(appReducer, undefined, init)
  const [ready, setReady] = useState(!cloud)
  const lastSynced = useRef<Project[] | null>(null)

  // Hydrate from Supabase once signed in (and migrate any local projects on first
  // login). The whole load runs inside a ref-held promise so that the effect
  // re-running reuses the SAME hydration instead of starting a second one (which
  // could double-insert during the one-time local-project migration). It re-runs
  // because StrictMode double-invokes effects in dev, and because `user` is a
  // fresh reference on every auth event (incl. periodic token refreshes). The
  // `hydrated` guard then stops a later refresh from re-dispatching stale projects
  // over the user's edits. Both refs reset with the provider on sign-out.
  const hydration = useRef<Promise<{ projects: Project[]; joinedId: string | null }> | null>(null)
  const hydrated = useRef(false)
  useEffect(() => {
    if (!cloud || !user || hydrated.current) return
    const u = user
    let cancelled = false

    if (!hydration.current) {
      hydration.current = (async () => {
        // Claim any pending email invites before loading, so shared projects show up.
        try {
          await acceptPendingInvites()
        } catch (err) {
          console.error('[adaptus] failed to accept pending invites (continuing)', err)
        }

        // Claim a pending invite-link (stashed pre-auth), then open that project.
        let joinedId: string | null = null
        try {
          const token = localStorage.getItem('adaptus.pendingJoin')
          if (token) {
            joinedId = await acceptInviteLink(token)
            localStorage.removeItem('adaptus.pendingJoin')
          }
        } catch (err) {
          console.error('[adaptus] failed to accept invite link (continuing)', err)
        }

        let projects: Project[] = []
        try {
          projects = await fetchProjects()
        } catch (err) {
          console.error('[adaptus] failed to load projects from Supabase', err)
        }

        // Best-effort one-time migration of local projects — must not block the app.
        const migrationKey = `adaptus.migrated.${u.id}`
        if (projects.length === 0 && !localStorage.getItem(migrationKey)) {
          try {
            // Legacy local projects may carry non-uuid ids (old numeric ids / 1001 demo).
            const local = loadStoredProjects().map((p) => (UUID_RE.test(p.id) ? p : { ...p, id: newProjectId() }))
            if (local.length) {
              await Promise.all(local.map((p) => insertProject(p, u.id)))
              projects = local
            }
            localStorage.setItem(migrationKey, '1')
          } catch (err) {
            console.error('[adaptus] migration of local projects failed (continuing)', err)
          }
        }

        // Tag each project with the signed-in user's role (owner default for any
        // not yet reflected in the membership table — e.g. just-created ones).
        try {
          const roles = await fetchMyRoles(u.id)
          projects = projects.map((p) => ({ ...p, role: roles[p.id] ?? 'owner' }))
        } catch (err) {
          console.error('[adaptus] failed to load roles (continuing)', err)
        }

        return { projects, joinedId }
      })()
    }

    hydration.current
      .then(({ projects, joinedId }) => {
        if (cancelled) return
        hydrated.current = true
        lastSynced.current = projects
        dispatch({ type: 'SET_PROJECTS', projects })
        setReady(true)
        // If they just joined via a link, drop them straight into that project.
        if (joinedId && projects.some((p) => p.id === joinedId)) {
          dispatch({ type: 'OPEN_PROJECT', id: joinedId, stageIdx: 0 })
        }
      })
      .catch((err) => {
        console.error('[adaptus] hydration failed (continuing)', err)
        if (!cancelled) setReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  // Persist changes: localStorage in local mode; a debounced diff-sync to
  // Supabase in cloud mode (upsert new/changed projects, delete removed ones).
  useEffect(() => {
    if (!ready) return
    if (!cloud) {
      saveProjects(state.projects)
      return
    }
    if (!user) return
    const prev = lastSynced.current
    const handle = window.setTimeout(async () => {
      try {
        const current = state.projects
        for (const p of current) {
          const before = prev?.find((x) => x.id === p.id)
          if (!before) await insertProject(p, user.id) // new project
          else if (before !== p) await updateProject(p) // edited (reference changed)
        }
        if (prev) {
          for (const p of prev) {
            if (!current.find((x) => x.id === p.id)) await deleteProjectRemote(p.id)
          }
        }
        lastSynced.current = current
      } catch (err) {
        console.error('[adaptus] failed to sync projects to Supabase', err)
      }
    }, 600)
    return () => window.clearTimeout(handle)
  }, [state.projects, ready, user])

  const value = useMemo(() => ({ state, dispatch, ready }), [state, ready])
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
