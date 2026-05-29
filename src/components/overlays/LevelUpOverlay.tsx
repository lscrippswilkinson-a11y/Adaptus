import { useEffect, useMemo } from 'react'
import type { Level } from '@/types'
import { LevelBadge } from '@/components/LevelBadge'

const COLORS = ['#f59e0b', '#fcd34d', '#fff', '#B8D0DE', '#8FB3C7']

/** Level-up celebration (ported from renderLvlUp). Auto-dismisses after 5s. */
export function LevelUpOverlay({ level, onDone }: { level: Level; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 5000)
    return () => clearTimeout(t)
  }, [onDone])

  const confetti = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        round: Math.random() > 0.5,
        size: 6 + Math.random() * 10,
        left: Math.random() * 100,
        top: -5 + Math.random() * 15,
        bg: COLORS[i % COLORS.length],
        dur: 1.4 + Math.random() * 1.2,
        delay: Math.random() * 0.6,
      })),
    [],
  )

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5,5,20,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'cq-fadein 0.3s ease',
      }}
    >
      {confetti.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            borderRadius: c.round ? '50%' : '3px',
            width: `${c.size}px`,
            height: `${c.size}px`,
            left: `${c.left}%`,
            top: `${c.top}%`,
            background: c.bg,
            animation: `cq-fall ${c.dur}s ease-out ${c.delay}s forwards`,
          }}
        />
      ))}
      <div
        style={{
          background: '#0d0d1e',
          border: `2px solid ${level.border}`,
          borderRadius: '24px',
          padding: '48px 56px',
          textAlign: 'center',
          maxWidth: '400px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <span style={{ fontSize: '72px', display: 'block', marginBottom: '16px', animation: 'cq-lvlup 0.6s cubic-bezier(0.34,1.56,0.64,1)' }}>
          {level.badge}
        </span>
        <div style={{ fontSize: '11px', letterSpacing: '3px', color: level.color, textTransform: 'uppercase', marginBottom: '10px', fontWeight: 700 }}>
          Level Up!
        </div>
        <div style={{ fontSize: '26px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>{level.title}</div>
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '28px', lineHeight: 1.6 }}>
          You've reached Level {level.level}.
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <LevelBadge level={level} large />
        </div>
        <button
          type="button"
          onClick={onDone}
          style={{
            display: 'block',
            margin: '20px auto 0',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '10px',
            padding: '10px 28px',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: 'inherit',
          }}
        >
          Keep going →
        </button>
      </div>
    </div>
  )
}
