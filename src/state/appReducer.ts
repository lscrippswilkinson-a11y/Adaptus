import type { AppView, Level, Project, Stage } from '@/types'
import { STAGES } from '@/data/stages'
import { getLvl } from '@/data/levels'
import { totalXp } from '@/lib/format'

export interface AppState {
  /** Persisted: the user's change projects. */
  projects: Project[]
  /** Ephemeral UI/navigation state. */
  view: AppView
  activeId: number | null
  stageIdx: number
  celebration: Stage | null
  levelUp: Level | null
}

export type AppAction =
  | { type: 'SET_VIEW'; view: AppView }
  | { type: 'OPEN_PROJECT'; id: number; stageIdx: number }
  | { type: 'GO_TO_STAGE'; stageIdx: number }
  | { type: 'ADD_PROJECT'; project: Project }
  | { type: 'UPDATE_PROJECT'; project: Project }
  | { type: 'COMPLETE_STAGE' }
  | { type: 'DISMISS_CELEBRATION' }
  | { type: 'DISMISS_LEVELUP' }

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
        totalXp: proj.totalXp + stage.xp,
      }

      const projects = state.projects.map((p) => (p.id === updated.id ? updated : p))

      // Level-up is based on XP summed across all projects.
      const oldLevel = getLvl(totalXp(state.projects))
      const newLevel = getLvl(totalXp(projects))
      const levelUp = newLevel.level > oldLevel.level ? newLevel : null

      return { ...state, projects, celebration: stage, levelUp }
    }

    case 'DISMISS_CELEBRATION':
      return {
        ...state,
        celebration: null,
        stageIdx: Math.min(state.stageIdx + 1, STAGES.length - 1),
      }

    case 'DISMISS_LEVELUP':
      return { ...state, levelUp: null }

    default:
      return state
  }
}
