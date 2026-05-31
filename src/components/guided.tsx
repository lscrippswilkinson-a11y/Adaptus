import type { CSSProperties, ReactNode } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'
import { useStageNav } from '@/components/StageFlow'

/**
 * Shared building blocks for the per-item guided flows (one question per
 * screen, TurboTax-style). Each list stage — groups, stakeholders, risks,
 * etc. — walks the user through one item's fields a screen at a time using
 * these primitives, so the look and behaviour stay identical across stages.
 */

/* ---- Shared screen styles ---- */

/** The big question headline at the top of a guided screen. */
export const headline: CSSProperties = { margin: '0 0 12px', fontSize: '24px', lineHeight: 1.3, fontWeight: 800, color: 'var(--text)' }
/** The plain-language "why this matters" paragraph under the headline. */
export const whyStyle: CSSProperties = { fontSize: '15px', color: 'rgba(var(--fg),0.72)', lineHeight: 1.7, margin: '0 0 22px' }

const addBtn: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '18px',
  background: 'rgba(91,134,163,0.12)', border: '1px solid rgba(91,134,163,0.35)', borderRadius: '999px',
  padding: '9px 16px', color: 'var(--accent-text)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
}
const removeBtnStyle: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '16px',
  background: 'none', border: 'none', color: 'rgba(var(--fg),0.45)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
}

/* ---- Option-card picker (with descriptions) ---- */

export interface LevelOption<T extends string> {
  value: T
  label: string
  desc: string
}

/** Big, explained option cards — replaces a bare dropdown for a guided feel. */
export function LevelPicker<T extends string>({ value, options, onChange }: { value: T; options: LevelOption<T>[]; onChange: (v: T) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {options.map((o) => {
        const sel = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              textAlign: 'left',
              width: '100%',
              background: sel ? 'rgba(91,134,163,0.12)' : 'rgba(var(--fg),0.02)',
              border: `1.5px solid ${sel ? '#5B86A3' : 'rgba(var(--fg),0.1)'}`,
              borderRadius: '12px',
              padding: '14px 16px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                flexShrink: 0,
                marginTop: '1px',
                border: `2px solid ${sel ? '#5B86A3' : 'rgba(var(--fg),0.25)'}`,
                background: sel ? '#5B86A3' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {sel && <Check size={12} strokeWidth={3} color="var(--on-accent)" />}
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '3px' }}>{o.label}</div>
              <div style={{ fontSize: '13px', color: 'rgba(var(--fg),0.7)', lineHeight: 1.5 }}>{o.desc}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

/* ---- Chip picker (compact, for plain string lists) ---- */

/**
 * A wrapping row of selectable chips for a flat list of options (categories,
 * formats, types…) where a full description card would be overkill. Pass
 * `colorFor` to tint the selected chip (e.g. status colours).
 */
export function ChipPicker({
  value,
  options,
  onChange,
  colorFor,
}: {
  value: string
  options: readonly string[]
  onChange: (v: string) => void
  colorFor?: (v: string) => string
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {options.map((o) => {
        const sel = o === value
        const accent = colorFor?.(o) ?? '#5B86A3'
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: sel ? 'rgba(91,134,163,0.14)' : 'rgba(var(--fg),0.03)',
              border: `1.5px solid ${sel ? accent : 'rgba(var(--fg),0.12)'}`,
              borderRadius: '999px',
              padding: '9px 16px',
              color: sel ? 'var(--text)' : 'rgba(var(--fg),0.65)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {sel && <Check size={13} strokeWidth={3} color={accent} />}
            {o}
          </button>
        )
      })}
    </div>
  )
}

/* ---- A field label + helper line that matches the hero look ---- */

export function GuidedLabel({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', margin: '0 0 7px' }}>{children}</div>
}

/* ---- Add / remove item buttons ---- */

/** A plain add button (no navigation) — used for empty-state "Add your first X". */
export function AddItemButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" style={{ ...addBtn, marginTop: 0 }} onClick={onClick}>
      <Plus size={15} /> {label}
    </button>
  )
}

/** Adds an item and jumps to its first screen in one tap (uses wizard nav). */
export function AddAnotherButton({ label, onAdd }: { label: string; onAdd: () => void }) {
  const nav = useStageNav()
  return (
    <button type="button" style={addBtn} onClick={() => { onAdd(); nav?.next() }}>
      <Plus size={15} /> {label}
    </button>
  )
}

/** "Remove this X" link shown on an item's first screen when more than one exists. */
export function RemoveItemButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" style={removeBtnStyle} onClick={onClick}>
      <Trash2 size={13} /> {label}
    </button>
  )
}
