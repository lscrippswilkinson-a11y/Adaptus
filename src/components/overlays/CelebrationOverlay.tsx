import { useEffect, useMemo } from 'react'
import type { Stage } from '@/types'

const COLORS = ['#5B86A3', '#8FB3C7', '#f59e0b', '#ec4899', '#22c55e']

/** Stage-complete celebration (ported from renderCelebration). Auto-dismisses. */
export function CelebrationOverlay({ stage, onDone }: { stage: Stage; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200)
    return () => clearTimeout(t)
  }, [onDone])

  const confetti = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        size: 8 + Math.random() * 10,
        left: Math.random() * 100,
        top: -5 + Math.random() * 10,
        bg: COLORS[i % COLORS.length],
        dur: 1.2 + Math.random() * 1.2,
        delay: Math.random() * 0.8,
      })),
    [],
  )

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        background: 'rgba(10,10,20,0.78)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'cq-fadein 0.25s ease',
      }}
    >
      {confetti.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            borderRadius: '50%',
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
          background: '#0f0f23',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '22px',
          padding: '44px 52px',
          textAlign: 'center',
          animation: 'cq-popin 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          maxWidth: '380px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ fontSize: '60px', animation: 'cq-float 1.5s ease-in-out infinite' }}>{stage.icon}</div>
        <div style={{ fontSize: '12px', letterSpacing: '3px', color: '#5B86A3', textTransform: 'uppercase', marginTop: '14px', marginBottom: '8px' }}>
          Stage Complete
        </div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>{stage.tag}</div>
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', marginBottom: '22px' }}>
          {stage.label} is done. Keep the momentum.
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(240,82,61,0.2)',
            border: '1px solid rgba(240,82,61,0.4)',
            borderRadius: '40px',
            padding: '10px 22px',
            color: '#F0523D',
            fontWeight: 700,
            fontSize: '15px',
          }}
        >
          +{stage.xp} XP earned
        </div>
      </div>
    </div>
  )
}
