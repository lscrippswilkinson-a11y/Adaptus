import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Check, ChevronLeft, ChevronRight, Pencil } from 'lucide-react'
import type { StageId } from '@/types'
import { STAGES } from '@/data/stages'
import { useWizardMode } from '@/state/WizardModeContext'
import { FieldCoachVariant, StageIntro } from '@/components/ui'
import { TipBox } from '@/components/TipBox'

export interface WizardStep {
  /** Stable key, e.g. 'statement'. */
  id: string
  /** Short label for the "X of N" indicator and the review row, e.g. 'Scope'. */
  title: string
  /** The field/builder UI — the same JSX the summary view renders. */
  node: ReactNode
  /** Compact read-back of the entered value for the review screen. */
  summary?: ReactNode
  /** Placeholder shown on the review screen when nothing's entered. */
  emptyLabel?: string
  /** Whether the user has entered something (drives the review tick). */
  isFilled?: boolean
  /**
   * Hub mode only: marks the first screen of an item, so "Back" returns to the
   * hub instead of stepping into the previous item.
   */
  itemFirst?: boolean
  /**
   * Hub mode only: marks the last screen of an item, so the primary button
   * ("Done") returns to the hub instead of stepping into the next item.
   */
  itemLast?: boolean
}

export interface StageFlowProps {
  /** The stage's id — used to look up its title and tips. */
  stageId: StageId
  /** Emoji used on the intro screen and the summary-mode banner. */
  icon: string
  /** 2–3 sentence "what & why" shown on the intro screen and summary banner. */
  blurb: ReactNode
  /** Extra summary-only chrome (e.g. a stage-level InsightCallout). */
  extra?: ReactNode
  steps: WizardStep[]
  /**
   * Hub mode (list stages): when provided, the guided flow becomes
   * hub-and-spoke. The "review" screen renders this hub — a summary of all
   * items with add/continue affordances — and editing one item (its
   * `itemFirst`…`itemLast` run of screens) returns here when finished.
   * `editItem` jumps to a given step index (an item's first screen).
   */
  hub?: (ctx: { editItem: (stepIndex: number) => void }) => ReactNode
}

/**
 * Lets the wizard tell the Workspace whether the "Mark this step complete" button
 * should show. It's hidden while stepping through questions and revealed only on
 * the review screen (or in summary view). Defaults to a no-op so stages rendered
 * outside a Workspace (or without a wizard) keep showing the button.
 */
const StageGateCtx = createContext<(showComplete: boolean) => void>(() => {})

/**
 * Read-only mode (e.g. a viewer-role collaborator). When set, every stage
 * renders as the all-at-once summary — no intro gate or step navigation to get
 * trapped behind — and the Workspace disables the inputs around it.
 */
export const ReadOnlyCtx = createContext(false)

/**
 * Lets StageFlow tell the Workspace when the guided intro screen is showing, so
 * the Workspace can hide its (otherwise duplicate) stage title there — the big
 * hero title on the intro carries it.
 */
export const StageScreenCtx = createContext<(onIntro: boolean) => void>(() => {})

export function StageGateProvider({ onChange, children }: { onChange: (showComplete: boolean) => void; children: ReactNode }) {
  return <StageGateCtx.Provider value={onChange}>{children}</StageGateCtx.Provider>
}

/**
 * Lets a step's own UI drive wizard navigation — e.g. an "Add another" button
 * that appends an item and advances to it in one tap. Null outside a guided flow.
 */
const StageNavCtx = createContext<{ next: () => void; prev: () => void } | null>(null)

export function useStageNav() {
  return useContext(StageNavCtx)
}

const CONTENT_MAX = 680

const pillBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  background: 'linear-gradient(135deg,#5B86A3,#3E6580)',
  border: 'none',
  borderRadius: '999px',
  padding: '13px 30px',
  color: 'var(--on-accent)',
  fontWeight: 700,
  fontSize: '15px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  boxShadow: '0 6px 18px rgba(62,101,128,0.35)',
}

const ghostBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  background: 'transparent',
  border: '1px solid rgba(var(--fg),0.15)',
  borderRadius: '999px',
  padding: '12px 20px',
  color: 'rgba(var(--fg),0.6)',
  fontWeight: 600,
  fontSize: '14px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

/** Segmented Guided / Summary toggle. */
function ModeToggle() {
  const { mode, setMode } = useWizardMode()
  const seg = (active: boolean): CSSProperties => ({
    border: 'none',
    borderRadius: '6px',
    padding: '5px 12px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    background: active ? '#5B86A3' : 'transparent',
    color: active ? 'var(--on-accent)' : 'rgba(var(--fg),0.55)',
  })
  return (
    <div style={{ display: 'inline-flex', gap: '3px', background: 'rgba(var(--fg),0.05)', border: '1px solid rgba(var(--fg),0.1)', borderRadius: '8px', padding: '3px' }}>
      <button type="button" style={seg(mode === 'guided')} onClick={() => setMode('guided')} aria-pressed={mode === 'guided'}>
        Guided
      </button>
      <button type="button" style={seg(mode === 'summary')} onClick={() => setMode('summary')} aria-pressed={mode === 'summary'}>
        Summary view
      </button>
    </div>
  )
}

/**
 * Wraps a stage's fields so they can be worked through one screen at a time
 * (guided mode, TurboTax-style) or all at once (summary mode = the original
 * full-page layout). The step index is local state, so it resets to the intro
 * screen whenever the stage/project remounts.
 */
export function StageFlow({ stageId, icon, blurb, extra, steps, hub }: StageFlowProps) {
  const { mode } = useWizardMode()
  const setShowComplete = useContext(StageGateCtx)
  const setOnIntro = useContext(StageScreenCtx)
  // -1 = intro screen, 0..steps.length-1 = questions, steps.length = review.
  const [step, setStep] = useState(-1)
  const topRef = useRef<HTMLDivElement>(null)
  const mounted = useRef(false)

  const total = steps.length
  const onReview = step >= total
  const title = STAGES.find((s) => s.id === stageId)?.label ?? ''

  // Hub stages ignore the summary toggle — the hub IS their overview. But a
  // read-only viewer always gets the flat summary (all fields, no navigation).
  const readOnly = useContext(ReadOnlyCtx)
  const summaryMode = readOnly || (mode === 'summary' && !hub)

  // The complete button belongs on the review/hub screen, or the summary view —
  // never on the intro card or a question screen. A layout effect (not a plain
  // effect) so it settles before paint and beats the Workspace stage-change
  // reset, avoiding a one-frame flash of the button on the intro.
  useLayoutEffect(() => {
    setShowComplete(summaryMode || onReview)
    setOnIntro(step < 0 && !summaryMode)
    return () => {
      setShowComplete(true)
      setOnIntro(false)
    }
  }, [summaryMode, onReview, step, setShowComplete, setOnIntro])

  // Scroll each new screen to the top (skip the first render).
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    topRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [step])

  // Commit any focused input (they commit on blur) before moving.
  const go = (next: number) => {
    ;(document.activeElement as HTMLElement | null)?.blur?.()
    setStep(Math.max(-1, Math.min(next, total)))
  }

  const header = (
    <div ref={topRef} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: hub ? 0 : '14px' }}>
      {!hub && <ModeToggle />}
    </div>
  )

  if (summaryMode) {
    return (
      <div>
        {header}
        <StageIntro icon={icon}>{blurb}</StageIntro>
        <TipBox stageId={stageId} />
        {extra}
        {steps.map((s) => (
          <div key={s.id}>{s.node}</div>
        ))}
      </div>
    )
  }

  // ---- Guided mode ----
  const current = Math.min(Math.max(step, 0), total - 1)

  // In hub mode, navigation is scoped to the item the current screen belongs to:
  // "Back" off the first screen and "Done" off the last screen return to the hub,
  // and the progress indicator counts within the item rather than across them.
  let itemStart = 0
  let itemEnd = total - 1
  if (hub && !onReview && total > 0) {
    let s = current
    while (s > 0 && !steps[s].itemFirst) s--
    let e = current
    while (e < total - 1 && !steps[e].itemLast) e++
    itemStart = s
    itemEnd = e
  }
  const itemLen = itemEnd - itemStart + 1
  const itemPos = current - itemStart + 1
  const nextIsHub = !!hub && !!steps[current]?.itemLast
  const backIsHub = !!hub && !!steps[current]?.itemFirst
  const goNext = () => (nextIsHub ? go(total) : go(current + 1))
  const goPrev = () => (backIsHub ? go(total) : go(current - 1))

  const progressPct = onReview ? 100 : hub ? Math.round((itemPos / itemLen) * 100) : Math.round(((current + 1) / total) * 100)

  // Intro screen — context and motivation only, no inputs.
  if (step < 0) {
    return (
      <div style={{ maxWidth: `${CONTENT_MAX}px`, margin: '0 auto' }}>
        {header}
        <div ref={topRef} style={{ textAlign: 'center', padding: '36px 0 24px' }}>
          <div style={{ fontSize: '52px', lineHeight: 1, marginBottom: '14px' }}>{icon}</div>
          <h1 style={{ margin: '0 0 18px', fontSize: '28px', fontWeight: 800, color: 'var(--text)' }}>{title}</h1>
          <div style={{ fontSize: '16px', lineHeight: 1.75, color: 'rgba(var(--fg),0.78)', maxWidth: '540px', margin: '0 auto 30px', textAlign: 'left' }}>
            {blurb}
          </div>
          <button type="button" style={pillBtn} onClick={() => go(hub ? total : 0)}>
            Let’s go <ChevronRight size={18} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: `${CONTENT_MAX}px`, margin: '0 auto' }}>
      {header}

      {/* Progress indicator (hidden on the hub) */}
      {!(hub && onReview) && (
        <div style={{ margin: '4px 0 8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '7px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px', color: 'var(--accent-text)', textTransform: 'uppercase' }}>
              {onReview ? 'Review' : hub ? `Step ${itemPos} of ${itemLen}` : `Step ${current + 1} of ${total}`}
            </span>
            {!onReview && <span style={{ fontSize: '12px', color: 'rgba(var(--fg),0.4)' }}>{steps[current].title}</span>}
          </div>
          <div style={{ height: '5px', background: 'rgba(var(--fg),0.08)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#5B86A3,#8FB3C7)', width: `${progressPct}%`, borderRadius: '3px', transition: 'width 0.4s' }} />
          </div>
        </div>
      )}

      {onReview ? (
        hub ? (
          <div style={{ padding: '8px 0 0' }}>{hub({ editItem: (i) => go(i) })}</div>
        ) : (
          <div style={{ padding: '24px 0 0' }}>
            <ReviewScreen steps={steps} onEdit={(i) => go(i)} />
            <div style={{ marginTop: '22px' }}>
              <button type="button" style={ghostBtn} onClick={() => go(total - 1)}>
                <ChevronLeft size={16} /> Back to questions
              </button>
            </div>
          </div>
        )
      ) : (
        <>
          <div style={{ padding: '28px 0 32px' }}>
            <StageNavCtx.Provider value={{ next: goNext, prev: goPrev }}>
              <FieldCoachVariant variant="hero">{steps[current].node}</FieldCoachVariant>
            </StageNavCtx.Provider>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button type="button" style={ghostBtn} onClick={goPrev}>
              <ChevronLeft size={16} /> {backIsHub ? 'Back to list' : 'Back'}
            </button>
            <button type="button" style={pillBtn} onClick={goNext}>
              {nextIsHub ? 'Done' : current === total - 1 ? 'Review' : 'Next'} <ChevronRight size={18} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function ReviewScreen({ steps, onEdit }: { steps: WizardStep[]; onEdit: (i: number) => void }) {
  return (
    <div>
      <h3 style={{ margin: '0 0 4px', fontSize: '19px', fontWeight: 800, color: 'var(--text)' }}>Review your answers</h3>
      <p style={{ margin: '0 0 18px', fontSize: '13px', color: 'rgba(var(--fg),0.55)', lineHeight: 1.6 }}>
        Here’s everything you entered. Click any item to change it — then mark the step complete below.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {steps.map((s, i) => {
          // An empty/whitespace string summary counts as unanswered (so the
          // placeholder shows instead of a blank line).
          const answered = s.isFilled && !(typeof s.summary === 'string' && s.summary.trim() === '') && s.summary != null
          return (
          <button
            key={s.id}
            type="button"
            onClick={() => onEdit(i)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              textAlign: 'left',
              width: '100%',
              background: 'rgba(var(--fg),0.02)',
              border: '1px solid rgba(var(--fg),0.08)',
              borderRadius: '12px',
              padding: '14px 16px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                flexShrink: 0,
                marginTop: '1px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: s.isFilled ? '#22c55e' : 'rgba(var(--fg),0.08)',
                color: s.isFilled ? 'var(--on-accent)' : 'rgba(var(--fg),0.4)',
              }}
            >
              {s.isFilled ? <Check size={13} strokeWidth={3} /> : <span style={{ fontSize: '11px', fontWeight: 700 }}>{i + 1}</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>{s.title}</div>
              <div style={{ fontSize: '13px', color: answered ? 'rgba(var(--fg),0.72)' : 'rgba(var(--fg),0.4)', lineHeight: 1.5, fontStyle: answered ? 'normal' : 'italic' }}>
                {answered ? s.summary : s.emptyLabel ?? 'Not added yet'}
              </div>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0, fontSize: '12px', fontWeight: 600, color: 'var(--accent-text)' }}>
              <Pencil size={12} /> Edit
            </span>
          </button>
          )
        })}
      </div>
    </div>
  )
}
