import type { Level } from '@/types'

export const LEVELS: Level[] = [
  { level: 1, title: 'Change Newcomer', xpNeeded: 0, color: '#888780', bg: 'rgba(136,135,128,0.15)', border: 'rgba(136,135,128,0.3)', badge: '🌱' },
  { level: 2, title: 'Change Starter', xpNeeded: 200, color: '#5DCAA5', bg: 'rgba(93,202,165,0.15)', border: 'rgba(93,202,165,0.3)', badge: '🌿' },
  { level: 3, title: 'Change Practitioner', xpNeeded: 500, color: '#378ADD', bg: 'rgba(55,138,221,0.15)', border: 'rgba(55,138,221,0.3)', badge: '⚙️' },
  { level: 4, title: 'Change Champion', xpNeeded: 1000, color: '#7F77DD', bg: 'rgba(127,119,221,0.15)', border: 'rgba(127,119,221,0.3)', badge: '🛡️' },
  { level: 5, title: 'Change Leader', xpNeeded: 1800, color: '#EF9F27', bg: 'rgba(239,159,39,0.15)', border: 'rgba(239,159,39,0.3)', badge: '⭐' },
  { level: 6, title: 'Change Guru', xpNeeded: 3000, color: '#ED93B1', bg: 'rgba(237,147,177,0.15)', border: 'rgba(237,147,177,0.3)', badge: '🔮' },
  { level: 7, title: 'Master of Change', xpNeeded: 5000, color: '#f59e0b', bg: 'rgba(245,158,11,0.2)', border: 'rgba(245,158,11,0.5)', badge: '👑' },
]

export function getLvl(xp: number): Level {
  let c = LEVELS[0]
  for (const lvl of LEVELS) if (xp >= lvl.xpNeeded) c = lvl
  return c
}

export function getNext(xp: number): Level | null {
  for (const lvl of LEVELS) if (lvl.xpNeeded > xp) return lvl
  return null
}

export function getLvlPct(xp: number): number {
  const c = getLvl(xp)
  const n = getNext(xp)
  if (!n) return 100
  return Math.round(((xp - c.xpNeeded) / (n.xpNeeded - c.xpNeeded)) * 100)
}
