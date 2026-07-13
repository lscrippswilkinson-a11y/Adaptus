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

export type TaskSource = 'checklist' | 'testing' | 'dependencies' | 'training' | 'custom' | 'checkoff' | 'sponsor'

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
  /** Due date (ISO yyyy-mm-dd) assigned on the dashboard, keyed by `key` in milestones.taskDueDates. */
  due?: string
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
    tasks.push({ key: `te:${t.id}`, label: t.name || 'Untitled test', group: 'Testing', done: t.status === 'Passed', source: 'testing', refId: t.id, owner: t.owner }),
  )
  p.stageData.dependencies.items.forEach((d) =>
    tasks.push({ key: `de:${d.id}`, label: d.name || 'Untitled dependency', group: 'Dependencies', done: d.status === 'Ready', source: 'dependencies', refId: d.id, owner: d.owner, due: d.neededBy }),
  )
  p.stageData.training.items.forEach((t) =>
    tasks.push({ key: `tr:${t.id}`, label: t.title || 'Untitled training', group: 'Training', done: t.done, source: 'training', refId: t.id, owner: t.owner, due: t.date }),
  )
  m.customTasks.forEach((c) =>
    tasks.push({ key: `cu:${c.id}`, label: c.label || 'Untitled task', group: c.group || 'Your tasks', done: c.done, source: 'custom', refId: c.id }),
  )

  // Planning items with no completion field of their own, tracked via the
  // dashboard's checkoff map, so checking them here doesn't alter the plan.
  const ck = m.checkoff ?? {}
  // These are the backer's own commitments, so they're owned by the backer.
  const backer = p.stageData.sponsor.noSponsor ? '' : p.stageData.sponsor.name.trim()
  p.stageData.sponsor.sponsorActions.forEach((a) =>
    tasks.push({ key: `sp:${a.id}`, label: a.text || 'Sponsor action', group: 'Sponsor commitments', done: a.done, source: 'sponsor', refId: a.id, owner: backer }),
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

  // Drop tasks the user removed from the dashboard, then attach owner + due date.
  // A task starts with whatever owner/date its planning section already carries,
  // so the dashboard reflects what the user typed rather than asking again; an
  // entry made on the dashboard overrides it, including one deliberately blanked.
  const hidden = new Set(m.hiddenTasks ?? [])
  const owners = m.taskOwners ?? {}
  const dues = m.taskDueDates ?? {}
  return tasks
    .filter((t) => !hidden.has(t.key))
    .map((t) => ({ ...t, owner: owners[t.key] ?? t.owner ?? '', due: dues[t.key] ?? t.due ?? '' }))
}

/** A dated post-launch commitment, for the tail of the launch timeline. */
export interface PostLaunchEntry {
  key: string
  date: string
  label: string
  group: string
}

/**
 * The dated things that happen *after* go-live: the sustainment review points
 * and each adoption metric's next check. They belong on the timeline, so the plan
 * doesn't look like it stops the day it ships, but deliberately NOT in
 * collectLaunchTasks: Launch Preparedness measures readiness to launch, and
 * folding post-launch work into it would make a ready project look unready.
 */
export function collectPostLaunchEntries(p: Project): PostLaunchEntry[] {
  const s = p.stageData.sustainment
  const entries: PostLaunchEntry[] = []
  const reviews: [string, string][] = [
    [s.checkpoint30, '30-day review'],
    [s.checkpoint60, '60-day review'],
    [s.checkpoint90, '90-day review'],
  ]
  reviews.forEach(([date, label], i) => {
    if (date) entries.push({ key: `su:${i}`, date, label, group: 'Keep it going' })
  })
  p.stageData.adoption.metrics.forEach((m) => {
    if (m.checkBy) entries.push({ key: `ad:${m.id}`, date: m.checkBy, label: `Measure: ${m.name.trim() || 'adoption metric'}`, group: 'Real use' })
  })
  return entries.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

/** One entry on the launch timeline: a dated task, the go-live, or a post-launch review. */
export interface TimelineEntry {
  key: string
  date: string
  label: string
  group: string
  owner: string
  done: boolean
  milestone: boolean
  /** A post-launch review: context only, nothing to tick off, never "overdue". */
  postLaunch: boolean
}

/**
 * The whole launch timeline in date order: every dated task, the go-live
 * milestone, and the post-launch reviews. One builder, used by the dashboard,
 * the shared brief and the exported deck, so the timeline a recipient sees is
 * the same one the user sees.
 */
export function buildTimeline(p: Project): TimelineEntry[] {
  const goLive = p.stageData.milestones.goLiveDate || p.targetDate
  const entries: TimelineEntry[] = [
    ...collectLaunchTasks(p)
      .filter((t) => !!t.due)
      .map((t) => ({ key: t.key, date: t.due!, label: t.label, group: t.group, owner: t.owner ?? '', done: t.done, milestone: false, postLaunch: false })),
    ...collectPostLaunchEntries(p).map((e) => ({ key: e.key, date: e.date, label: e.label, group: e.group, owner: '', done: false, milestone: false, postLaunch: true })),
    ...(goLive ? [{ key: 'go-live', date: goLive, label: 'Go-live', group: '', owner: '', done: false, milestone: true, postLaunch: false }] : []),
  ]
  return entries.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

/** Launch Preparedness: share of aggregated launch tasks that are done. */
export function preparedness(p: Project): { done: number; total: number; pct: number } {
  const tasks = collectLaunchTasks(p)
  const done = tasks.filter((t) => t.done).length
  const total = tasks.length
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 }
}
