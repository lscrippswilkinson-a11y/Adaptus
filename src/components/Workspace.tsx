import { useEffect, useRef } from 'react'
import type { Project } from '@/types'
import { useApp } from '@/state/AppContext'
import { STAGES } from '@/data/stages'
import { getLvl, getLvlPct } from '@/data/levels'
import { pct, totalXp } from '@/lib/format'
import { LevelBadge } from '@/components/LevelBadge'
import { STAGE_COMPONENTS } from '@/components/stages'

export function Workspace({ project }: { project: Project }) {
  const { state, dispatch } = useApp()
  const xp = totalXp(state.projects)
  const curLv = getLvl(xp)
  const p2 = pct(project)
  const stage = STAGES[state.stageIdx]
  const done = project.completedStages.includes(stage.id)
  const StageComponent = STAGE_COMPONENTS[stage.id]

  // Scroll the content panel back to the top whenever the stage (or project) changes.
  const mainRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [state.stageIdx, project.id])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0d0d1e' }}>
      {/* Header */}
      <div style={{ padding: '12px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => dispatch({ type: 'SET_VIEW', view: 'dashboard' })}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '20px', padding: '4px 8px', borderRadius: '6px', fontFamily: 'inherit' }}
        >
          ←
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
            <span style={{ fontWeight: 600, color: '#fff', fontSize: '14px' }}>{project.name}</span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{p2}% complete</span>
          </div>
          <div style={{ height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#5B86A3,#8FB3C7)', width: `${p2}%`, borderRadius: '3px', transition: 'width 0.5s' }} />
          </div>
        </div>
        <div style={{ minWidth: '170px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
            <LevelBadge level={curLv} />
            <span style={{ fontSize: '11px', color: '#F0523D', fontWeight: 600 }}>⚡ {xp} XP</span>
          </div>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
            <div style={{ height: '100%', width: `${getLvlPct(xp)}%`, background: curLv.color, borderRadius: '2px', transition: 'width 0.5s' }} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: '220px', flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)', padding: '18px 0', overflowY: 'auto' }}>
          {STAGES.map((s, i) => {
            const isDone = project.completedStages.includes(s.id)
            const active = i === state.stageIdx
            const locked = i > project.currentStage
            return (
              <button
                key={s.id}
                type="button"
                className={'sb-btn' + (active ? ' active' : '') + (locked ? ' locked' : '')}
                onClick={() => !locked && dispatch({ type: 'GO_TO_STAGE', stageIdx: i })}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 700,
                    background: isDone ? '#22c55e' : active ? '#5B86A3' : 'rgba(255,255,255,0.08)',
                    color: isDone || active ? '#fff' : 'rgba(255,255,255,0.3)',
                  }}
                >
                  {isDone ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: '12px', color: active ? '#B8D0DE' : isDone ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)', fontWeight: active ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Main */}
        <div ref={mainRef} style={{ flex: 1, padding: '26px 34px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '22px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(91,134,163,0.1)', border: '1px solid rgba(91,134,163,0.25)', borderRadius: '20px', padding: '4px 12px', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px' }}>{stage.icon}</span>
                <span style={{ fontSize: '11px', color: '#B8D0DE', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 600 }}>{stage.tag}</span>
              </div>
              <h2 style={{ margin: 0, fontSize: '21px', fontWeight: 700, color: '#fff' }}>
                Stage {state.stageIdx + 1}: {stage.label}
              </h2>
            </div>
            {done && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '20px', padding: '8px 16px', color: '#86efac', fontSize: '13px', fontWeight: 600 }}>
                ✓ Complete · +{stage.xp} XP
              </div>
            )}
          </div>

          {/* Remount on stage/project change so input-local state resets cleanly */}
          <StageComponent key={`${project.id}-${stage.id}`} />

          {!done && (
            <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button type="button" className="cq-complete-btn" onClick={() => dispatch({ type: 'COMPLETE_STAGE' })}>
                Complete stage → earn {stage.xp} XP
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
