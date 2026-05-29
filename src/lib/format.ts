import type { Project, RiskItem } from '@/types'
import { STAGES } from '@/data/stages'
import { LAUNCH_ITEMS } from '@/data/constants'

/** Percentage of the 13 stages completed for a project. */
export function pct(project: Project): number {
  return Math.round((project.completedStages.length / STAGES.length) * 100)
}

/** Colour for a 1–10 risk score. */
export function riskColor(score: number): string {
  return score <= 3 ? '#22c55e' : score <= 6 ? '#f59e0b' : '#ef4444'
}

/** Label for a 1–10 risk score. */
export function riskLabel(score: number): string {
  return score <= 3 ? 'Low' : score <= 6 ? 'Medium' : 'High'
}

/** Mean normalised risk score (1–10) across items, or null when empty. */
export function avgRisk(items: RiskItem[]): number | null {
  if (!items.length) return null
  const sum = items.reduce((s, r) => s + (r.likelihood * r.impact) / 9, 0)
  return Math.round((sum / items.length) * 10) / 10
}

/** Total XP summed across every project — drives the user's global level. */
export function totalXp(projects: Project[]): number {
  return projects.reduce((s, p) => s + p.totalXp, 0)
}

/* ---- Launch preparedness (Stage 2 dashboard) ---- */

export type TaskSource = 'checklist' | 'testing' | 'dependencies' | 'training' | 'custom'

/** A single launch-readiness task aggregated from across the planning sections. */
export interface PrepTask {
  key: string
  label: string
  group: string
  done: boolean
  source: TaskSource
  /** id of the underlying row (testing/dependency/training/custom). */
  refId?: number
  /** launch-checklist item text (source === 'checklist'). */
  item?: string
}

/**
 * Aggregate every actionable launch item into one task list: the readiness
 * checklist, testing (done = Passed), dependencies (done = Ready), training
 * (done flag), and the user's custom tasks. Each task carries enough info for
 * the dashboard to toggle it back on its source slice.
 */
export function collectLaunchTasks(p: Project): PrepTask[] {
  const m = p.stageData.milestones
  const tasks: PrepTask[] = []
  LAUNCH_ITEMS.forEach((item) =>
    tasks.push({ key: `cl:${item}`, label: item, group: 'Launch readiness', done: m.launchChecklist.includes(item), source: 'checklist', item }),
  )
  p.stageData.testing.items.forEach((t) =>
    tasks.push({ key: `te:${t.id}`, label: t.name || 'Untitled test', group: 'Testing', done: t.status === 'Passed', source: 'testing', refId: t.id }),
  )
  p.stageData.dependencies.items.forEach((d) =>
    tasks.push({ key: `de:${d.id}`, label: d.name || 'Untitled dependency', group: 'Dependencies', done: d.status === 'Ready', source: 'dependencies', refId: d.id }),
  )
  p.stageData.training.items.forEach((t) =>
    tasks.push({ key: `tr:${t.id}`, label: t.title || 'Untitled training', group: 'Training', done: t.done, source: 'training', refId: t.id }),
  )
  m.customTasks.forEach((c) =>
    tasks.push({ key: `cu:${c.id}`, label: c.label || 'Untitled task', group: 'Your tasks', done: c.done, source: 'custom', refId: c.id }),
  )
  return tasks
}

/** Launch Preparedness: share of aggregated launch tasks that are done. */
export function preparedness(p: Project): { done: number; total: number; pct: number } {
  const tasks = collectLaunchTasks(p)
  const done = tasks.filter((t) => t.done).length
  const total = tasks.length
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 }
}
