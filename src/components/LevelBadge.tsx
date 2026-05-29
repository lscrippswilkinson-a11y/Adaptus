import type { Level } from '@/types'

/** Pill showing a level's badge + title (ported from lvlBadge). */
export function LevelBadge({ level, large = false }: { level: Level; large?: boolean }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: large ? '10px' : '6px',
        background: level.bg,
        border: `1px solid ${level.border}`,
        borderRadius: large ? '14px' : '20px',
        padding: large ? '10px 18px' : '5px 12px',
      }}
    >
      <span style={{ fontSize: large ? '22px' : '15px' }}>{level.badge}</span>
      <span style={{ fontSize: large ? 15 : 12, fontWeight: 700, color: level.color }}>
        {large ? `Level ${level.level} · ${level.title}` : level.title}
      </span>
    </div>
  )
}
