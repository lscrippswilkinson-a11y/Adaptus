import type { Project, SponsorAction, StageData } from '@/types'
import { emptyProject } from '@/data/seed'
import { STAGES } from '@/data/stages'
import { uid } from '@/lib/id'

export const STORAGE_KEY = 'adaptus.projects.v1'

/**
 * Bring a persisted project up to the current schema: backfill any stageData
 * slices/fields added since it was saved (e.g. testing, dependencies,
 * customTasks), drop completed-section ids that no longer exist, and clamp the
 * current-section index. Deep-merges each slice over the empty-project default.
 */
export function migrateProject(p: Project): Project {
  const base = emptyProject()
  const baseData = base.stageData as unknown as Record<string, object>
  const savedData = (p.stageData ?? {}) as unknown as Record<string, object>
  const merged = Object.fromEntries(
    Object.keys(baseData).map((k) => [k, { ...baseData[k], ...(savedData[k] ?? {}) }]),
  ) as unknown as StageData

  // Sponsor actions used to be plain strings; lift any legacy entries to the
  // richer { id, text, done, notes } shape so the action plan can hold notes.
  merged.sponsor.sponsorActions = (merged.sponsor.sponsorActions ?? []).map(
    (a: SponsorAction | string): SponsorAction =>
      typeof a === 'string' ? { id: uid(), text: a, done: false } : a,
  )

  const validIds = new Set(STAGES.map((s) => s.id))
  const completedStages = (p.completedStages ?? []).filter((id) => validIds.has(id))
  const currentStage = Math.min(Math.max(p.currentStage ?? 0, 0), STAGES.length - 1)

  // Legacy local data used numeric ids; project ids are strings now.
  const id = String(p.id)

  return { ...p, id, stageData: merged, completedStages, currentStage }
}

/**
 * Load the project list from localStorage. On first run (or any read/parse
 * problem) the user simply starts with no projects.
 */
export function loadProjects(): Project[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Project[]
    if (!Array.isArray(parsed) || parsed.length === 0) return []
    return parsed.map(migrateProject)
  } catch (err) {
    console.warn('[adaptus] failed to load saved projects; starting fresh', err)
    return []
  }
}

/**
 * Projects actually stored locally, with NO demo-seed fallback, used when
 * migrating a user's real local work into a new cloud account.
 */
export function loadStoredProjects(): Project[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Project[]
    if (!Array.isArray(parsed)) return []
    return parsed.map(migrateProject)
  } catch {
    return []
  }
}

/** Serialise the project list for a downloadable backup file. */
export function projectsToJson(projects: Project[]): string {
  return JSON.stringify(projects, null, 2)
}

/**
 * Parse an uploaded backup file into projects, running each through migration
 * so older/foreign backups load safely. Returns null if the file isn't valid.
 */
export function parseImportedProjects(json: string): Project[] | null {
  try {
    const parsed = JSON.parse(json)
    if (!Array.isArray(parsed) || parsed.length === 0) return null
    if (!parsed.every((p) => p && typeof p === 'object' && 'stageData' in p)) return null
    return parsed.map(migrateProject)
  } catch {
    return null
  }
}

/** Persist the project list. Swallows quota / serialisation errors. */
export function saveProjects(projects: Project[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
  } catch (err) {
    console.warn('[adaptus] failed to save projects', err)
  }
}
