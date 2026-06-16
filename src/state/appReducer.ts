import type { AppView, Project } from '@/types'
import { STAGES } from '@/data/stages'

export interface AppState {
  /** Persisted: the user's change projects. */
  projects: Project[]
  /** Ephemeral UI/navigation state. */
  view: AppView
  activeId: string | null
  stageIdx: number
}

export type AppAction =
  | { type: 'SET_VIEW'; view: AppView }
  | { type: 'OPEN_PROJECT'; id: string; stageIdx: number }
  | { type: 'GO_TO_STAGE'; stageIdx: number }
  | { type: 'ADD_PROJECT'; project: Project }
  | { type: 'UPDATE_PROJECT'; project: Project }
  | { type: 'DELETE_PROJECT'; id: string }
  | { type: 'SET_PROJECTS'; projects: Project[] }
  | { type: 'COMPLETE_STAGE'; toIdx?: number }

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, view: action.view }

    case 'OPEN_PROJECT':
      return { ...state, view: 'workspace', activeId: action.id, stageIdx: action.stageIdx }

    case 'GO_TO_STAGE':
      return { ...state, stageIdx: action.stageIdx }

    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [...state.projects, action.project],
        activeId: action.project.id,
        view: 'workspace',
        stageIdx: 0,
      }

    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map((p) => (p.id === action.project.id ? action.project : p)),
      }

    case 'DELETE_PROJECT': {
      const projects = state.projects.filter((p) => p.id !== action.id)
      // If the deleted project was the one open, return home.
      if (state.activeId === action.id) {
        return { ...state, projects, view: 'dashboard', activeId: null, stageIdx: 0 }
      }
      return { ...state, projects }
    }

    case 'SET_PROJECTS':
      // Replace the whole project list (e.g. restoring a backup) and return home.
      return { ...state, projects: action.projects, view: 'dashboard', activeId: null, stageIdx: 0 }

    case 'COMPLETE_STAGE': {
      const proj = state.projects.find((p) => p.id === state.activeId)
      const stage = STAGES[state.stageIdx]
      if (!proj || !stage || proj.completedStages.includes(stage.id)) return state

      // Land on the caller's target step (used to skip hidden advanced steps),
      // else just the next one in order.
      const nextIdx = action.toIdx ?? Math.min(state.stageIdx + 1, STAGES.length - 1)
      const updated: Project = {
        ...proj,
        completedStages: [...proj.completedStages, stage.id],
        currentStage: Math.max(proj.currentStage, nextIdx),
      }

      return {
        ...state,
        projects: state.projects.map((p) => (p.id === updated.id ? updated : p)),
        // Move straight on to the next step (no XP fanfare).
        stageIdx: nextIdx,
      }
    }

    default:
      return state
  }
}
