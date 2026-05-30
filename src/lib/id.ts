/**
 * Monotonic numeric id generator. The artifact used Date.now() for row ids,
 * which can collide when rows are added in the same millisecond; a counter
 * seeded from the clock keeps ids unique and stable within a session.
 */
let counter = Date.now()

export function uid(): number {
  return ++counter
}

/** Globally-unique project id (uuid), matching the Supabase `projects.id` column. */
export function newProjectId(): string {
  return crypto.randomUUID()
}
