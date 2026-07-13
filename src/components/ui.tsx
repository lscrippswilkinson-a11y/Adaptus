import {
  createContext,
  useContext,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { Plus, X } from 'lucide-react'

/**
 * Lets an ancestor switch FieldCoach into a larger "hero" presentation, used by
 * the guided wizard so a single question reads like a headline rather than a
 * dense form field. Defaults to the compact form used everywhere else.
 */
const FieldCoachVariantCtx = createContext<'default' | 'hero'>('default')

export function FieldCoachVariant({ variant, children }: { variant: 'default' | 'hero'; children: ReactNode }) {
  return <FieldCoachVariantCtx.Provider value={variant}>{children}</FieldCoachVariantCtx.Provider>
}

/**
 * When true (set by <FlatContainers>), Cards drop their boxed chrome: border,
 * background, shadow, padding, and render as plain spaced blocks. The summary
 * view uses this so a stage reads as one clean form rather than a stack of boxes.
 */
const FlatContainerCtx = createContext(false)

/**
 * Renders the summary view's fields as a flat, divided list (styled by the
 * `.cq-summary-fields` rules in index.css) and tells descendant Cards / FieldCoach
 * to drop their boxed chrome.
 */
export function FlatContainers({ children }: { children: ReactNode }) {
  return (
    <FlatContainerCtx.Provider value={true}>
      <div className="cq-summary-fields">{children}</div>
    </FlatContainerCtx.Provider>
  )
}

/** Section card (.cq-card), flattened to a plain block inside <FlatContainers>. */
export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  const flat = useContext(FlatContainerCtx)
  if (flat) return <div style={style}>{children}</div>
  return (
    <div className="cq-card" style={style}>
      {children}
    </div>
  )
}

/** Header used per field in the flat summary view, clear, but smaller than the guided hero. */
const summaryHeaderStyle: CSSProperties = { margin: '0 0 6px', fontSize: '17px', fontWeight: 700, lineHeight: 1.35, color: 'var(--text)' }

/**
 * A section title that reads as a proper header in the flat summary view and as
 * a compact uppercase field label everywhere else.
 */
export function SectionTitle({ children }: { children: ReactNode }) {
  const flat = useContext(FlatContainerCtx)
  if (flat) return <h3 style={summaryHeaderStyle}>{children}</h3>
  return <Label>{children}</Label>
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

/** Rough characters per line at the textarea's width, used to size it. */
const CHARS_PER_LINE = 58

export function TextArea({ value, onCommit, placeholder, rows = 4, style }: TextAreaProps) {
  const [local, setLocal] = useState(value)
  useEffect(() => setLocal(value), [value])
  // Placeholders carry the worked example, which can run to a few sentences, so
  // grow the box enough to show all of it rather than clipping it. Sized off the
  // placeholder (not the value) so the box doesn't resize as the user types.
  const fit = placeholder ? Math.ceil(placeholder.length / CHARS_PER_LINE) : 0
  return (
    <textarea
      className="cq-textarea"
      value={local}
      placeholder={placeholder}
      rows={Math.max(rows, fit)}
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
  /** Shown as a disabled first option when the value is empty (e.g. "Audience"). */
  placeholder?: string
}

export function Select({ value, options, onChange, style, placeholder }: SelectProps) {
  return (
    <select
      className="cq-select"
      value={value}
      style={style}
      onChange={(e) => onChange(e.target.value)}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
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
  /** The input itself. Pass the worked example as its `placeholder`. */
  children: ReactNode
}

/**
 * A field wrapped with point-of-entry coaching: the question, the "why", and the
 * input. This is the core "learn as you go" pattern for non-expert users. The
 * worked example belongs in the input's own placeholder, where the user reads it
 * without having to open anything and it clears itself the moment they type.
 */
export function FieldCoach({ label, why, children }: FieldCoachProps) {
  const hero = useContext(FieldCoachVariantCtx) === 'hero'
  const flat = useContext(FlatContainerCtx)
  const cardStyle: CSSProperties | undefined = hero
    ? { borderRadius: '20px', padding: '34px 36px', boxShadow: '0 12px 40px rgba(0,0,0,0.10)', marginBottom: 0 }
    : undefined
  return (
    <Card style={cardStyle}>
      {hero ? (
        <h2 style={{ margin: '0 0 12px', fontSize: '24px', lineHeight: 1.3, fontWeight: 800, color: 'var(--text)' }}>{label}</h2>
      ) : flat ? (
        <h3 style={summaryHeaderStyle}>{label}</h3>
      ) : (
        <Label>{label}</Label>
      )}
      <div style={hero
        ? { fontSize: '15px', color: 'rgba(var(--fg),0.72)', lineHeight: 1.7, margin: '0 0 22px' }
        : { fontSize: '13px', color: 'rgba(var(--fg),0.62)', lineHeight: 1.6, margin: '0 0 12px' }}>{why}</div>
      {children}
    </Card>
  )
}
