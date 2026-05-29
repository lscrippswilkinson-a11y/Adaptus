/**
 * Monotonic numeric id generator. The artifact used Date.now() for row ids,
 * which can collide when rows are added in the same millisecond; a counter
 * seeded from the clock keeps ids unique and stable within a session.
 */
let counter = Date.now()

export function uid(): number {
  return ++counter
}
