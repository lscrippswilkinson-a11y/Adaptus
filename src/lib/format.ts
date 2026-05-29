import type { Project, RiskItem } from '@/types'
import { STAGES } from '@/data/stages'

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
