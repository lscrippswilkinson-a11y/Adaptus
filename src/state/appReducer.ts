import type { AppView, Project } from '@/types'
import { STAGES } from '@/data/stages'

export interface AppState {
  /** Persisted: the user's change projects. */
  projects: Project[]
  /** Ephemeral UI/navigation state. */
  view: AppView
  activeId: number | null
  stageIdx: number
}

export type AppAction =
  | { type: 'SET_VIEW'; view: AppView }
  | { type: 'OPEN_PROJECT'; id: number; stageIdx: number }
  | { type: 'GO_TO_STAGE'; stageIdx: number }
  | { type: 'ADD_PROJECT'; project: Project }
  | { type: 'UPDATE_PROJECT'; project: Project }
  | { type: 'COMPLETE_STAGE' }

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

    case 'COMPLETE_STAGE': {
      const proj = state.projects.find((p) => p.id === state.activeId)
      const stage = STAGES[state.stageIdx]
      if (!proj || !stage || proj.completedStages.includes(stage.id)) return state

      const nextIdx = Math.min(state.stageIdx + 1, STAGES.length - 1)
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
