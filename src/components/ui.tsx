import {
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { Plus, X } from 'lucide-react'

/** Section card (.cq-card). */
export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="cq-card" style={style}>
      {children}
    </div>
  )
}

/** Uppercase field label (.cq-lbl). */
export function Label({ children }: { children: ReactNode }) {
  return <div className="cq-lbl">{children}</div>
}

interface TextInputProps {
  value: string
  onCommit: (v: string) => void
  placeholder?: string
  style?: CSSProperties
}

/**
 * Text input that mirrors the artifact's behaviour: edits are local while
 * typing and committed on blur, so the global store isn't churned per
 * keystroke. Re-syncs if the upstream value changes (e.g. switching projects).
 */
export function TextInput({ value, onCommit, placeholder, style }: TextInputProps) {
  const [local, setLocal] = useState(value)
  useEffect(() => setLocal(value), [value])
  return (
    <input
      type="text"
      className="cq-input"
      value={local}
      placeholder={placeholder}
      style={style}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => local !== value && onCommit(local)}
    />
  )
}

interface TextAreaProps extends TextInputProps {
  rows?: number
}

export function TextArea({ value, onCommit, placeholder, rows = 4, style }: TextAreaProps) {
  const [local, setLocal] = useState(value)
  useEffect(() => setLocal(value), [value])
  return (
    <textarea
      className="cq-textarea"
      value={local}
      placeholder={placeholder}
      rows={rows}
      style={style}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => local !== value && onCommit(local)}
    />
  )
}

interface SelectProps {
  value: string
  options: readonly string[]
  onChange: (v: string) => void
  style?: CSSProperties
}

export function Select({ value, options, onChange, style }: SelectProps) {
  return (
    <select
      className="cq-select"
      value={value}
      style={style}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}

export function AddButton({ label, onClick, style }: { label: string; onClick: () => void; style?: CSSProperties }) {
  // Labels historically carried a leading "+ "; drop it in favour of the icon.
  const text = label.replace(/^\+\s*/, '')
  return (
    <button
      type="button"
      className="cq-btn-add"
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px', ...style }}
      onClick={onClick}
    >
      <Plus size={16} /> {text}
    </button>
  )
}

export function DelButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="cq-btn-del" onClick={onClick} aria-label="Delete" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <X size={16} />
    </button>
  )
}

/**
 * Plain-language framing shown at the top of a stage for users who are new to
 * change management. Explains, in everyday terms, what the stage is for.
 */
export function StageIntro({ icon = '🧭', children }: { icon?: string; children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        background: 'rgba(91,134,163,0.08)',
        border: '1px solid rgba(91,134,163,0.2)',
        borderRadius: '12px',
        padding: '16px 18px',
        marginBottom: '16px',
        lineHeight: 1.65,
      }}
    >
      <span style={{ fontSize: '20px', flexShrink: 0 }}>{icon}</span>
      <div style={{ fontSize: '13.5px', color: 'rgba(var(--fg),0.72)' }}>{children}</div>
    </div>
  )
}

type InsightTone = 'info' | 'priority' | 'warn' | 'success'

const TONE_STYLES: Record<InsightTone, { bg: string; border: string; color: string; icon: string }> = {
  info: { bg: 'rgba(91,134,163,0.1)', border: 'rgba(91,134,163,0.28)', color: '#B8D0DE', icon: '💡' },
  priority: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.28)', color: '#fcd34d', icon: '🎯' },
  warn: { bg: 'rgba(239,68,68,0.09)', border: 'rgba(239,68,68,0.25)', color: '#fca5a5', icon: '⚠️' },
  success: { bg: 'rgba(34,197,94,0.09)', border: 'rgba(34,197,94,0.25)', color: '#86efac', icon: '✅' },
}

/**
 * A live, contextual teaching note that reacts to what the user entered (e.g.
 * "this group is your #1 priority"). Use it to explain the framework through
 * the user's own choices. `tone` sets the colour + default icon.
 */
export function InsightCallout({ tone = 'info', icon, children, style }: { tone?: InsightTone; icon?: string; children: ReactNode; style?: CSSProperties }) {
  const t = TONE_STYLES[tone]
  return (
    <div
      style={{
        display: 'flex',
        gap: '9px',
        alignItems: 'flex-start',
        background: t.bg,
        border: `1px solid ${t.border}`,
        borderRadius: '8px',
        padding: '9px 12px',
        fontSize: '12.5px',
        lineHeight: 1.55,
        color: 'rgba(var(--fg),0.78)',
        ...style,
      }}
    >
      <span style={{ flexShrink: 0 }}>{icon ?? t.icon}</span>
      <span>{children}</span>
    </div>
  )
}

interface FieldCoachProps {
  /** The question/label for the field. */
  label: string
  /** Plain-language explanation of why this field matters (no jargon). */
  why: ReactNode
  /** An optional worked example the user can read and drop into the field. */
  example?: string
  /** Called when the user clicks "Use this example" — should set the field. */
  onUseExample?: () => void
  /** The input itself. */
  children: ReactNode
}

const linkBtnStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--accent-text)',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 600,
  padding: 0,
  fontFamily: 'inherit',
}

/**
 * A field wrapped with point-of-entry coaching: the "why", the input, and an
 * expandable worked example that can be inserted with one click. This is the
 * core "learn as you go" pattern for non-expert users.
 */
export function FieldCoach({ label, why, example, onUseExample, children }: FieldCoachProps) {
  const [showExample, setShowExample] = useState(false)
  return (
    <Card>
      <Label>{label}</Label>
      <div style={{ fontSize: '13px', color: 'rgba(var(--fg),0.55)', lineHeight: 1.6, margin: '0 0 12px' }}>{why}</div>
      {children}
      {example && (
        <div style={{ marginTop: '10px' }}>
          <button type="button" style={linkBtnStyle} onClick={() => setShowExample((s) => !s)}>
            {showExample ? '▾ Hide example' : '▸ Show an example'}
          </button>
          {showExample && (
            <div style={{ marginTop: '8px', background: 'rgba(91,134,163,0.08)', border: '1px solid rgba(91,134,163,0.2)', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-text)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Example</div>
              <div style={{ fontSize: '13px', color: 'rgba(var(--fg),0.78)', lineHeight: 1.6, fontStyle: 'italic' }}>“{example}”</div>
              {onUseExample && (
                <button
                  type="button"
                  onClick={onUseExample}
                  style={{ marginTop: '12px', background: 'rgba(91,134,163,0.15)', border: '1px solid rgba(91,134,163,0.35)', borderRadius: '6px', padding: '6px 12px', color: 'var(--accent-text)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Use this example →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
