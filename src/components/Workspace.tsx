import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { ArrowLeft, ArrowRight, Check, Eye, Share2, Users } from 'lucide-react'
import type { FeedbackItem, Project } from '@/types'
import { useApp } from '@/state/AppContext'
import { hasSupabase } from '@/lib/supabase'
import { fetchFeedback } from '@/lib/projectsRepo'
import { PHASES, STAGES } from '@/data/stages'
import { pct, preparedness } from '@/lib/format'
import { STAGE_COMPONENTS } from '@/components/stages'
import { ReadOnlyCtx, StageScreenCtx } from '@/components/StageFlow'
import { ShareModal } from '@/components/ShareModal'
import { ShareCtx } from '@/state/ShareContext'
import { CollaboratorsModal } from '@/components/CollaboratorsModal'
import { ThemeToggle } from '@/components/ThemeToggle'


const navBoxKicker: CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--accent-text)', marginBottom: '2px' }
const navBoxLabel: CSSProperties = { display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
const navBoxStyle = (side: 'left' | 'right'): CSSProperties => ({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  justifyContent: side === 'right' ? 'flex-end' : 'flex-start',
  background: 'rgba(var(--fg),0.03)',
  border: '1px solid rgba(var(--fg),0.12)',
  borderRadius: '12px',
  padding: '14px 18px',
  cursor: 'pointer',
  fontFamily: 'inherit',
})

export function Workspace({ project }: { project: Project }) {
  const { state, dispatch } = useApp()
  // Whether the guided intro screen is showing, so we can hide the duplicate
  // stage title in the header (the big hero title carries it there).
  const [onIntro, setOnIntro] = useState(false)
  const p2 = pct(project)
  const stage = STAGES[state.stageIdx]
  const done = project.completedStages.includes(stage.id)
  const StageComponent = STAGE_COMPONENTS[stage.id]

  // The Launch Preparation Dashboard can only be marked complete once fully prepared.
  const prep = preparedness(project)
  const canComplete = stage.id !== 'milestones' || prep.pct === 100


  // Scroll the content panel back to the top whenever the stage (or project) changes.
  const mainRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [state.stageIdx, project.id])

  // Reset the complete-button gate when the stage changes, in the render phase
  // (not an effect) so a wizard stage's own gate, set via its layout effect,
  // wins instead of being clobbered. Default visible; StageFlow hides it on its
  // intro/question screens, and non-wizard stages keep it shown.
  const stageKey = `${project.id}-${stage.id}`
  const prevStageKey = useRef(stageKey)
  if (prevStageKey.current !== stageKey) {
    prevStageKey.current = stageKey
    setOnIntro(false)
  }

  const [sharing, setSharing] = useState(false)
  const [collab, setCollab] = useState(false)
  const isOwner = (project.role ?? 'owner') === 'owner'
  const isViewer = project.role === 'viewer'

  // Section-level Previous/Next. Advancing auto-completes the current step:
  // COMPLETE_STAGE both marks it done and moves on (skipped for viewers, or when
  // the launch dashboard isn't fully prepared, or when it's already complete).
  const prevStage = state.stageIdx > 0 ? STAGES[state.stageIdx - 1] : null
  const nextStage = state.stageIdx < STAGES.length - 1 ? STAGES[state.stageIdx + 1] : null
  const goPrev = () => prevStage && dispatch({ type: 'GO_TO_STAGE', stageIdx: state.stageIdx - 1 })
  const goNext = () => {
    if (!nextStage) return
    if (!isViewer && !done && canComplete) dispatch({ type: 'COMPLETE_STAGE' })
    else dispatch({ type: 'GO_TO_STAGE', stageIdx: state.stageIdx + 1 })
  }

  // Per-section review feedback (cloud only), kept to power the sidebar open-feedback counts.
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const loadFeedback = () => {
    if (!hasSupabase) return
    fetchFeedback(project.id)
      .then(setFeedback)
      .catch((err) => console.error('[adaptus] failed to load feedback', err))
  }
  useEffect(() => {
    setFeedback([])
    loadFeedback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id])
  const openByStage = useMemo(() => {
    const m: Record<string, number> = {}
    for (const f of feedback) if (!f.resolved) m[f.stageId] = (m[f.stageId] ?? 0) + 1
    return m
  }, [feedback])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'transparent' }}>
      {/* Header: quiet progress only */}
      <div style={{ padding: '14px 22px', borderBottom: '1px solid rgba(var(--fg),0.06)', display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => dispatch({ type: 'SET_VIEW', view: 'dashboard' })}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(var(--fg),0.4)', display: 'flex', alignItems: 'center', padding: '4px 8px', borderRadius: '6px', fontFamily: 'inherit' }}
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
            <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '14px' }}>{project.name}</span>
            <span style={{ fontSize: '11px', color: 'rgba(var(--fg),0.6)' }}>{p2}% of the essential steps done</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(var(--fg),0.16)', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(var(--fg),0.08)' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#5B86A3,#8FB3C7)', width: `${p2}%`, borderRadius: '3px', transition: 'width 0.5s' }} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCollab(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(var(--fg),0.05)', border: '1px solid rgba(var(--fg),0.12)', borderRadius: '999px', padding: '7px 14px', color: 'rgba(var(--fg),0.7)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
        >
          <Users size={14} /> {isOwner ? 'Collaborators' : 'People'}
        </button>
        <button
          type="button"
          onClick={() => setSharing(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(91,134,163,0.12)', border: '1px solid rgba(91,134,163,0.3)', borderRadius: '999px', padding: '7px 14px', color: 'var(--accent-text)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
        >
          <Share2 size={14} /> Share
        </button>
        <ThemeToggle />
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar: sections grouped by phase */}
        <div style={{ width: '250px', flexShrink: 0, borderRight: '1px solid rgba(var(--fg),0.06)', padding: '14px 0', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1 }}>
            {PHASES.map((phase, pi) => {
              const visible = STAGES.map((s, i) => ({ s, i })).filter(({ s }) => s.phase === phase.id)
              const doneCount = visible.filter(({ s }) => project.completedStages.includes(s.id)).length
              return (
                <div key={phase.id} style={{ marginBottom: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: pi === 0 ? '0 18px 8px' : '14px 18px 8px', fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(var(--fg),0.6)' }}>
                    <span>{pi + 1}. {phase.label}</span>
                    <span style={{ color: '#5B86A3' }}>{doneCount}/{visible.length}</span>
                  </div>
                  {visible.map(({ s, i }) => {
                    const isDone = project.completedStages.includes(s.id)
                    const active = i === state.stageIdx
                    return (
                      <button
                        key={s.id}
                        type="button"
                        className={'sb-btn' + (active ? ' active' : '')}
                        onClick={() => dispatch({ type: 'GO_TO_STAGE', stageIdx: i })}
                      >
                        {/* Distinct states: done = filled check, current = ring
                            with a dot, to-do = hollow ring. */}
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            flexShrink: 0,
                            boxSizing: 'border-box',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--on-accent)',
                            background: isDone ? '#22c55e' : 'transparent',
                            border: isDone ? '2px solid #22c55e' : active ? '2px solid #5B86A3' : '1.5px solid rgba(var(--fg),0.28)',
                          }}
                        >
                          {isDone ? (
                            <Check size={12} strokeWidth={3} />
                          ) : active ? (
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#5B86A3' }} />
                          ) : null}
                        </div>
                        <span style={{ flex: 1, fontSize: '12px', color: active ? 'var(--accent-text)' : isDone ? 'rgba(var(--fg),0.7)' : 'rgba(var(--fg),0.62)', fontWeight: active ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {s.label}
                        </span>
                        {openByStage[s.id] > 0 && (
                          <span title={`${openByStage[s.id]} open feedback`} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--on-accent)', background: '#5B86A3', borderRadius: '999px', minWidth: '16px', height: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', flexShrink: 0 }}>{openByStage[s.id]}</span>
                        )}
                        {s.tier === 'advanced' && !openByStage[s.id] && (
                          <span style={{ fontSize: '9px', color: 'rgba(var(--fg),0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>opt</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {/* Main */}
        <div ref={mainRef} style={{ flex: 1, padding: '26px 34px', overflowY: 'auto', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '22px' }}>
            <div>
              {stage.tier === 'advanced' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: onIntro ? 0 : '10px' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(var(--fg),0.55)', border: '1px solid rgba(var(--fg),0.12)', borderRadius: '20px', padding: '4px 10px' }}>Optional</span>
                </div>
              )}
              {/* The big hero title carries the name on the intro, so don't repeat it here. */}
              {!onIntro && <h2 style={{ margin: 0, fontSize: '21px', fontWeight: 700, color: 'var(--text)' }}>{stage.label}</h2>}
            </div>
            {/* Top-right: a quiet "Complete" badge once the step is done. Steps now
                complete automatically when you advance with Next, below. */}
            {done && (
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '20px', padding: '8px 16px', color: '#86efac', fontSize: '13px', fontWeight: 600 }}>
                <Check size={15} strokeWidth={3} /> Complete
              </div>
            )}
          </div>

          {isViewer && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(91,134,163,0.1)', border: '1px solid rgba(91,134,163,0.25)', borderRadius: '10px', padding: '10px 14px', marginBottom: '18px', fontSize: '13px', color: 'var(--accent-text)' }}>
              <Eye size={15} /> You have view-only access to this project.
            </div>
          )}

          {/* Remount on stage/project change so input-local state resets cleanly.
              For viewers, ReadOnlyCtx forces the flat summary view and the
              disabled fieldset makes every input read-only. */}
          <ReadOnlyCtx.Provider value={isViewer}>
            <fieldset disabled={isViewer} style={{ border: 'none', padding: 0, margin: 0, minInlineSize: 0 }}>
              <StageScreenCtx.Provider value={setOnIntro}>
                <ShareCtx.Provider value={() => setSharing(true)}>
                  {StageComponent && <StageComponent key={`${project.id}-${stage.id}`} />}
                </ShareCtx.Provider>
              </StageScreenCtx.Provider>
            </fieldset>
          </ReadOnlyCtx.Provider>

          {/* Section-level Previous / Next, each labeled with the section it leads to. */}
          {(prevStage || nextStage) && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
              {prevStage ? (
                <button type="button" onClick={goPrev} style={navBoxStyle('left')}>
                  <ArrowLeft size={18} style={{ flexShrink: 0, color: 'var(--accent-text)' }} />
                  <span style={{ minWidth: 0 }}>
                    <span style={navBoxKicker}>Previous</span>
                    <span style={navBoxLabel}>{prevStage.label}</span>
                  </span>
                </button>
              ) : (
                <span style={{ flex: 1 }} />
              )}
              {nextStage ? (
                <button type="button" onClick={goNext} style={navBoxStyle('right')}>
                  <span style={{ minWidth: 0, textAlign: 'right' }}>
                    <span style={navBoxKicker}>Next</span>
                    <span style={navBoxLabel}>{nextStage.label}</span>
                  </span>
                  <ArrowRight size={18} style={{ flexShrink: 0, color: 'var(--accent-text)' }} />
                </button>
              ) : (
                <span style={{ flex: 1 }} />
              )}
            </div>
          )}
        </div>
      </div>

      {sharing && (
        <ShareModal
          project={project}
          onUpdate={(p) => dispatch({ type: 'UPDATE_PROJECT', project: p })}
          onClose={() => setSharing(false)}
        />
      )}
      {collab && <CollaboratorsModal project={project} onClose={() => setCollab(false)} />}
    </div>
  )
}
