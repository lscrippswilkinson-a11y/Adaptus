import { useState, type CSSProperties, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * A short, calm welcome deck shown once when a user first opens a project,
 * before they reach Stage 1. Three slides: why this exists, the ADKAR
 * framework it's built on, and the three phases they'll work through. Purely
 * presentational; the parent decides when it shows and persists "seen".
 */

const pillBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  background: 'linear-gradient(135deg,#5B86A3,#3E6580)',
  border: 'none',
  borderRadius: '999px',
  padding: '14px 30px',
  color: 'var(--on-accent)',
  fontWeight: 700,
  fontSize: '15px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  boxShadow: '0 6px 18px rgba(62,101,128,0.35)',
}

const backBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  background: 'none',
  border: 'none',
  color: 'rgba(var(--fg),0.45)',
  fontWeight: 600,
  fontSize: '14px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const headlineStyle: CSSProperties = { margin: '0 0 18px', fontSize: '28px', lineHeight: 1.25, fontWeight: 800, color: 'var(--text)' }
const bodyStyle: CSSProperties = { fontSize: '16px', lineHeight: 1.75, color: 'rgba(var(--fg),0.78)' }

/** The calm "here's the takeaway" line that closes each slide. */
function BottomLine({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        marginTop: '26px',
        background: 'rgba(91,134,163,0.1)',
        border: '1px solid rgba(91,134,163,0.25)',
        borderRadius: '12px',
        padding: '14px 18px',
        fontSize: '14px',
        lineHeight: 1.6,
        color: 'rgba(var(--fg),0.72)',
      }}
    >
      {children}
    </div>
  )
}

const PHASES: { n: number; label: string; line: string }[] = [
  { n: 1, label: 'Planning', line: "Define the change, identify who's affected, line up your sponsor and stakeholders." },
  { n: 2, label: 'Launch Preparation', line: 'Build your comms plan, training roadmap, and go-live checklist.' },
  { n: 3, label: 'Post-Launch', line: 'Track adoption, manage resistance, sustain the change.' },
]

function SlideWelcome() {
  return (
    <div>
      <h1 style={headlineStyle}>Let’s build your change plan</h1>
      <p style={bodyStyle}>
        Adaptus walks you through a proven, structured approach to managing organizational change, from the first
        conversation to long-term adoption. Most change initiatives fail not because the solution was wrong, but because
        people weren’t brought along. This process fixes that.
      </p>
      <BottomLine>
        It’s built on <strong style={{ color: 'var(--accent-text)' }}>ADKAR</strong>, the most widely used change
        framework, so you’re following an approach that’s proven, not improvised. You won’t have to learn it; it’s baked
        into every step.
      </BottomLine>
    </div>
  )
}

function SlidePhases() {
  return (
    <div>
      <h1 style={headlineStyle}>Three phases, one complete plan</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {PHASES.map((p) => (
          <div
            key={p.n}
            style={{
              background: 'rgba(var(--fg),0.03)',
              border: '1px solid rgba(var(--fg),0.1)',
              borderRadius: '12px',
              padding: '16px 18px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--accent-text)', marginBottom: '5px' }}>
              Phase {p.n}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>{p.label}</div>
            <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'rgba(var(--fg),0.7)' }}>{p.line}</div>
          </div>
        ))}
      </div>
      <BottomLine>
        Most users complete their first project in 2–3 focused sessions. Your progress saves automatically.
      </BottomLine>
    </div>
  )
}

const SLIDES = [SlideWelcome, SlidePhases]
const NEXT_LABELS = ['Next', 'Start Planning']

export function ProjectOnboarding({ onDone }: { onDone: () => void }) {
  const [slide, setSlide] = useState(0)
  const Current = SLIDES[slide]
  const isLast = slide === SLIDES.length - 1

  const next = () => (isLast ? onDone() : setSlide((s) => s + 1))
  const back = () => setSlide((s) => Math.max(0, s - 1))

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'transparent' }}>
      <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column' }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '9px', marginBottom: '40px' }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setSlide(i)}
              style={{
                width: i === slide ? '26px' : '9px',
                height: '9px',
                borderRadius: '999px',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                background: i === slide ? 'linear-gradient(90deg,#5B86A3,#8FB3C7)' : 'rgba(var(--fg),0.15)',
                transition: 'width 0.3s, background 0.3s',
              }}
            />
          ))}
        </div>

        {/* Slide body */}
        <div style={{ minHeight: '340px' }}>
          <Current />
        </div>

        {/* Nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '32px' }}>
          {slide > 0 ? (
            <button type="button" style={backBtn} onClick={back}>
              <ChevronLeft size={16} /> Back
            </button>
          ) : (
            <span />
          )}
          <button type="button" style={pillBtn} onClick={next}>
            {NEXT_LABELS[slide]} <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
