import type { Project, StageData } from '@/types'
import { createSeed, emptyProject } from '@/data/seed'
import { STAGES } from '@/data/stages'

export const STORAGE_KEY = 'adaptus.projects.v1'

/**
 * Bring a persisted project up to the current schema: backfill any stageData
 * slices/fields added since it was saved (e.g. testing, dependencies,
 * customTasks), drop completed-section ids that no longer exist, and clamp the
 * current-section index. Deep-merges each slice over the empty-project default.
 */
function migrateProject(p: Project): Project {
  const base = emptyProject()
  const baseData = base.stageData as unknown as Record<string, object>
  const savedData = (p.stageData ?? {}) as unknown as Record<string, object>
  const merged = Object.fromEntries(
    Object.keys(baseData).map((k) => [k, { ...baseData[k], ...(savedData[k] ?? {}) }]),
  ) as unknown as StageData

  const validIds = new Set(STAGES.map((s) => s.id))
  const completedStages = (p.completedStages ?? []).filter((id) => validIds.has(id))
  const currentStage = Math.min(Math.max(p.currentStage ?? 0, 0), STAGES.length - 1)

  return { ...p, stageData: merged, completedStages, currentStage }
}

/**
 * Load the project list from localStorage. On first run (or any read/parse
 * problem) we fall back to a single demo project so the app is never empty.
 */
export function loadProjects(): Project[] {
  if (typeof localStorage === 'undefined') return [createSeed()]
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [createSeed()]
    const parsed = JSON.parse(raw) as Project[]
    if (!Array.isArray(parsed) || parsed.length === 0) return [createSeed()]
    return parsed.map(migrateProject)
  } catch (err) {
    console.warn('[adaptus] failed to load saved projects; starting fresh', err)
    return [createSeed()]
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
