import type { Project } from '@/types'
import { avgRisk, pct } from '@/lib/format'
import { buildHeatMap } from '@/lib/heatmap'

/**
 * Project history: one derived reading per project per day, which is what the
 * Premium trend charts draw.
 *
 * Every number here comes from an existing single source of truth (`pct` for
 * progress, `buildHeatMap` for readiness/load/heads, `avgRisk` for risk) rather
 * than being recomputed, so a snapshot can never disagree with the same figure
 * shown live elsewhere in the app.
 */

/** A day's reading. All measures are 0–100 except the two counts. */
export interface Snapshot {
  projectId: string
  /** yyyy-mm-dd. */
  day: string
  progress: number
  /** Null when the project has no impacted groups / no scored risks yet. */
  readiness: number | null
  changeLoad: number | null
  risk: number | null
  teams: number
  people: number
}

export type Metrics = Omit<Snapshot, 'projectId' | 'day'>

/** Today's reading for a project, in the app's own units. */
export function projectMetrics(p: Project): Metrics {
  const { summary } = buildHeatMap([p], {})
  const hasTeams = summary.teamsImpacted > 0
  const risk = avgRisk(p.stageData.risk.items)
  return {
    progress: pct(p),
    readiness: hasTeams ? summary.avgReadiness : null,
    changeLoad: hasTeams ? summary.orgLoad : null,
    // avgRisk is a 1–10 score; the charts share one 0–100 axis so the three
    // panels can be read against each other without a second scale.
    risk: risk === null ? null : Math.round(risk * 10),
    teams: summary.teamsImpacted,
    people: summary.peopleAffected,
  }
}

/**
 * A stable string for a reading, used to skip re-sending an unchanged snapshot
 * on every debounced save. Editing a project's description shouldn't cost a
 * round trip to rewrite a row that already holds these exact numbers.
 */
export const metricsKey = (m: Metrics): string =>
  [m.progress, m.readiness, m.changeLoad, m.risk, m.teams, m.people].join('|')

/** The three measures the trend charts draw, in the order they're shown. */
export const TREND_SERIES = [
  {
    key: 'readiness' as const,
    label: 'How ready people are',
    color: 'var(--series-readiness)',
    goodWhenLow: false,
  },
  {
    key: 'risk' as const,
    label: 'Risk',
    color: 'var(--series-risk)',
    goodWhenLow: true,
  },
  {
    key: 'progress' as const,
    label: 'Plan completed',
    color: 'var(--series-progress)',
    goodWhenLow: false,
  },
]

export type TrendKey = (typeof TREND_SERIES)[number]['key']

/** One plotted point: a day, and the value of one measure on it. */
export interface TrendPoint {
  day: string
  value: number
}

/**
 * Roll snapshots up into a series per measure. With several projects selected a
 * day's value is the MEAN across the projects that have a reading that day —
 * days a project wasn't touched simply don't drag the average down, because a
 * missing reading is "unknown", not "zero".
 */
export function trendSeries(snaps: Snapshot[], key: TrendKey): TrendPoint[] {
  const byDay = new Map<string, number[]>()
  for (const s of snaps) {
    const v = s[key]
    if (v === null || v === undefined) continue
    const arr = byDay.get(s.day) ?? []
    arr.push(v)
    byDay.set(s.day, arr)
  }
  return [...byDay.entries()]
    .map(([day, vs]) => ({ day, value: Math.round(vs.reduce((a, b) => a + b, 0) / vs.length) }))
    .sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0))
}
