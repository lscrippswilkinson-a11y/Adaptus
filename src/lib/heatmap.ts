import type { Impact, Project, Readiness } from '@/types'

/**
 * Single source of truth for the organization change heat map. Every displayed
 * value, both gauges, all four stat cards, and every team row, is derived
 * from `buildHeatMap`, on ONE absolute scale, so the rollup can never contradict
 * the rows (e.g. "org load LIGHT while teams read HEAVY").
 */

export type LoadBand = 'Light' | 'Moderate' | 'Heavy'
export type ReadinessBand = 'Low' | 'Mixed' | 'Strong'

export interface HeatRow {
  project: string
  impact: Impact
  readiness: Readiness
  people: number
}

export interface HeatTeam {
  key: string
  name: string
  peopleCount: number
  initiativeCount: number
  /** Absolute 0–100 change-load score (NOT relative to other teams). */
  loadScore: number
  /** Absolute 0–100 readiness. */
  readiness: number
  band: LoadBand
  readinessBand: ReadinessBand
  isAtRisk: boolean
  rows: HeatRow[]
}

export interface HeatSummary {
  teamsImpacted: number
  peopleAffected: number
  initiatives: number
  avgReadiness: number
  /** Org change load, the aggregate of team loadScores; never lower than the
   *  hottest team, so it can't read lighter than the rows. */
  orgLoad: number
  orgBand: LoadBand
  teamsAtRisk: number
}

export interface HeatMap {
  teams: HeatTeam[]
  summary: HeatSummary
}

// ---- the one set of thresholds & weights everything uses ----
const IMPACT_W: Record<Impact, number> = { High: 3, Medium: 2, Low: 1 }
const READY_VAL: Record<Readiness, number> = { Low: 15, Medium: 55, High: 95 }
/** Raw load at which a team is "saturated" (≈3 concurrent high-impact changes). */
const LOAD_CEILING = 9

export const MODERATE_LOAD = 34
export const HEAVY_LOAD = 67
/** A heavy-load team below this readiness is "at risk". */
export const AT_RISK_READINESS = 50

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))

export const loadBand = (score: number): LoadBand => (score >= HEAVY_LOAD ? 'Heavy' : score >= MODERATE_LOAD ? 'Moderate' : 'Light')
export const readinessBand = (score: number): ReadinessBand => (score >= HEAVY_LOAD ? 'Strong' : score >= MODERATE_LOAD ? 'Mixed' : 'Low')
export const isAtRisk = (loadScore: number, readiness: number): boolean => loadScore >= HEAVY_LOAD && readiness < AT_RISK_READINESS

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
/** Loose key for "these are probably the same team" suggestions. */
export const looseKey = (s: string) => norm(s).replace(/[^a-z0-9]/g, '').replace(/(teams?|departments?|depts?|groups?|divisions?|orgs?)$/, '')

/**
 * Aggregate the impacted groups from every project into per-team heat data plus
 * an org-level summary. `aliases` maps a normalized group name to the canonical
 * name it's been combined into.
 */
export function buildHeatMap(projects: Project[], aliases: Record<string, string>): HeatMap {
  const resolve = (n: string) => {
    let cur = n
    const seen = new Set<string>()
    while (aliases[cur] && !seen.has(cur)) {
      seen.add(cur)
      cur = aliases[cur]
    }
    return cur
  }

  interface Acc {
    key: string
    rawCounts: Record<string, number>
    initiatives: Set<string>
    people: number
    rawLoad: number
    rows: HeatRow[]
  }
  const map = new Map<string, Acc>()

  for (const p of projects) {
    const pname = p.name || 'Untitled project'
    for (const g of p.stageData.groups.groups) {
      const name = g.name.trim()
      if (!name) continue
      const key = resolve(norm(name))
      let e = map.get(key)
      if (!e) {
        e = { key, rawCounts: {}, initiatives: new Set(), people: 0, rawLoad: 0, rows: [] }
        map.set(key, e)
      }
      e.initiatives.add(pname)
      const ppl = parseInt(String(g.size).replace(/[^0-9]/g, ''), 10) || 0
      e.people += ppl
      e.rawLoad += IMPACT_W[g.impact] ?? 2
      e.rawCounts[name] = (e.rawCounts[name] || 0) + 1
      e.rows.push({ project: pname, impact: g.impact, readiness: g.readiness, people: ppl })
    }
  }

  const teams: HeatTeam[] = [...map.values()]
    .map((e) => {
      const loadScore = clamp(Math.round((e.rawLoad / LOAD_CEILING) * 100), 0, 100)
      const readiness = e.rows.length ? Math.round(e.rows.reduce((s, r) => s + READY_VAL[r.readiness], 0) / e.rows.length) : 0
      const name = Object.entries(e.rawCounts).sort((a, b) => b[1] - a[1])[0][0]
      return {
        key: e.key,
        name,
        peopleCount: e.people,
        initiativeCount: e.initiatives.size,
        loadScore,
        readiness,
        band: loadBand(loadScore),
        readinessBand: readinessBand(readiness),
        isAtRisk: isAtRisk(loadScore, readiness),
        rows: e.rows,
      }
    })
    .sort((a, b) => b.loadScore - a.loadScore || b.initiativeCount - a.initiativeCount)

  const initiatives = new Set<string>()
  teams.forEach((t) => t.rows.forEach((r) => initiatives.add(r.project)))

  // Org load = the hottest team's load, so the gauge is never lighter than any
  // row (no "rows HEAVY / gauge LIGHT" contradiction).
  const orgLoad = teams.length ? Math.max(...teams.map((t) => t.loadScore)) : 0
  const avgReadiness = teams.length ? Math.round(teams.reduce((s, t) => s + t.readiness, 0) / teams.length) : 0

  const summary: HeatSummary = {
    teamsImpacted: teams.length,
    peopleAffected: teams.reduce((s, t) => s + t.peopleCount, 0),
    initiatives: initiatives.size,
    avgReadiness,
    orgLoad,
    orgBand: loadBand(orgLoad),
    teamsAtRisk: teams.filter((t) => t.isAtRisk).length,
  }

  return { teams, summary }
}
