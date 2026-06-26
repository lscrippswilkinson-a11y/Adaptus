import type { Project, RiskItem } from '@/types'
import { ESSENTIAL_COUNT, ESSENTIAL_IDS } from '@/data/stages'
import { LAUNCH_ITEMS } from '@/data/constants'

/** Completed essential steps for a project (advanced steps are optional bonus). */
export function essentialsDone(project: Project): number {
  return project.completedStages.filter((id) => ESSENTIAL_IDS.has(id)).length
}

/** Progress through the core path: completed essentials ÷ total essentials. */
export function pct(project: Project): number {
  return Math.round((essentialsDone(project) / ESSENTIAL_COUNT) * 100)
}

/** A project is "complete" once all its essential steps are done. */
export function isComplete(project: Project): boolean {
  return essentialsDone(project) === ESSENTIAL_COUNT
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

/** Total XP summed across every project, drives the user's global level. */
export function totalXp(projects: Project[]): number {
  return projects.reduce((s, p) => s + p.totalXp, 0)
}

/* ---- Launch preparedness (Stage 2 dashboard) ---- */

export type TaskSource = 'checklist' | 'testing' | 'dependencies' | 'training' | 'custom' | 'checkoff'

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
  /** Owner name assigned on the dashboard, keyed by `key` in milestones.taskOwners. */
  owner?: string
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
    tasks.push({ key: `cu:${c.id}`, label: c.label || 'Untitled task', group: c.group || 'Your tasks', done: c.done, source: 'custom', refId: c.id }),
  )

  // Planning items with no completion field of their own, tracked via the
  // dashboard's checkoff map, so checking them here doesn't alter the plan.
  const ck = m.checkoff ?? {}
  p.stageData.sponsor.sponsorActions.forEach((a) =>
    tasks.push({ key: `sp:${a}`, label: a, group: 'Sponsor commitments', done: !!ck[`sp:${a}`], source: 'checkoff' }),
  )
  p.stageData.stakeholders.rows.forEach((r) => {
    if (!r.name.trim()) return
    const key = `sh:${r.id}`
    tasks.push({ key, label: `Engage ${r.name}${r.role ? ` (${r.role})` : ''}`, group: 'Stakeholders', done: !!ck[key], source: 'checkoff' })
  })
  p.stageData.comms.schedule.forEach((c) => {
    const key = `cm:${c.id}`
    tasks.push({ key, label: `${c.when || 'Touchpoint'}: ${c.audience || '-'}`, group: 'Communications', done: !!ck[key], source: 'checkoff' })
  })
  p.stageData.risk.items.forEach((r) => {
    const key = `rk:${r.id}`
    tasks.push({ key, label: `Mitigate: ${r.description || 'risk'}`, group: 'Risks', done: !!ck[key], source: 'checkoff' })
  })
  p.stageData.resistance.items.forEach((r) => {
    const key = `rs:${r.id}`
    tasks.push({ key, label: `Address: ${r.type}${r.group ? ` (${r.group})` : ''}`, group: 'Resistance', done: !!ck[key], source: 'checkoff' })
  })
  p.stageData.groups.groups.forEach((g) => {
    if (!g.name.trim()) return
    const key = `gr:${g.id}`
    tasks.push({ key, label: `Prepare ${g.name}`, group: 'Impacted groups', done: !!ck[key], source: 'checkoff' })
  })

  // Drop tasks the user removed from the dashboard, then attach any assigned owner.
  const hidden = new Set(m.hiddenTasks ?? [])
  const owners = m.taskOwners ?? {}
  return tasks.filter((t) => !hidden.has(t.key)).map((t) => ({ ...t, owner: owners[t.key] }))
}

/** Launch Preparedness: share of aggregated launch tasks that are done. */
export function preparedness(p: Project): { done: number; total: number; pct: number } {
  const tasks = collectLaunchTasks(p)
  const done = tasks.filter((t) => t.done).length
  const total = tasks.length
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 }
}
