import type { Project } from '@/types'
import { createSeed } from '@/data/seed'

export const STORAGE_KEY = 'adaptus.projects.v1'

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
    if (!Array.isArray(parsed)) return [createSeed()]
    return parsed
  } catch (err) {
    console.warn('[adaptus] failed to load saved projects; starting fresh', err)
    return [createSeed()]
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
