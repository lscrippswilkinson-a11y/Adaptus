import { useState } from 'react'
import { Check, MessageSquare, RotateCcw, Send, Trash2 } from 'lucide-react'
import type { FeedbackItem, StageId } from '@/types'
import { addFeedback, deleteFeedback, setFeedbackResolved } from '@/lib/projectsRepo'

/** Short relative time, e.g. "just now", "3h ago", "2d ago". */
function ago(iso: string): string {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  return `${d}d ago`
}

/**
 * The review thread for one section (stage). Any collaborator — including
 * view-only reviewers — can post feedback here; the author or the project
 * owner can resolve or delete it. Rendered outside the workspace's read-only
 * lock so reviewers can comment even though they can't edit the plan.
 */
export function FeedbackPanel({
  projectId,
  stageId,
  stageLabel,
  items,
  currentUserId,
  isOwner,
  onChanged,
}: {
  projectId: string
  stageId: StageId
  stageLabel: string
  items: FeedbackItem[]
  currentUserId: string
  isOwner: boolean
  onChanged: () => void
}) {
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [showResolved, setShowResolved] = useState(false)

  const open = items.filter((i) => !i.resolved)
  const resolved = items.filter((i) => i.resolved)
  const shown = showResolved ? items : open

  const post = async () => {
    if (!draft.trim() || busy) return
    setBusy(true)
    try {
      await addFeedback(projectId, stageId, draft)
      setDraft('')
      onChanged()
    } catch (err) {
      console.error('[adaptus] post feedback failed', err)
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (i: FeedbackItem) => {
    try {
      await setFeedbackResolved(i.id, !i.resolved)
      onChanged()
    } catch (err) {
      console.error('[adaptus] resolve feedback failed', err)
    }
  }

  const remove = async (i: FeedbackItem) => {
    try {
      await deleteFeedback(i.id)
      onChanged()
    } catch (err) {
      console.error('[adaptus] delete feedback failed', err)
    }
  }

  return (
    <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(var(--fg),0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <MessageSquare size={16} color="var(--accent-text)" />
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>Feedback on “{stageLabel}”</span>
        {open.length > 0 && (
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--on-accent)', background: '#5B86A3', borderRadius: '999px', padding: '1px 8px' }}>{open.length} open</span>
        )}
      </div>
      <div style={{ fontSize: '12px', color: 'rgba(var(--fg),0.45)', marginBottom: '14px' }}>
        Anyone you’ve shared this project with can leave review notes here.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
        {shown.length === 0 ? (
          <div style={{ fontSize: '13px', color: 'rgba(var(--fg),0.4)', fontStyle: 'italic' }}>No open feedback on this section.</div>
        ) : (
          shown.map((i) => {
            const mine = i.authorId === currentUserId
            const canManage = mine || isOwner
            return (
              <div key={i.id} style={{ background: 'rgba(var(--fg),0.02)', border: '1px solid rgba(var(--fg),0.07)', borderRadius: '10px', padding: '10px 12px', opacity: i.resolved ? 0.55 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>{i.authorName}{mine ? ' (you)' : ''}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(var(--fg),0.4)' }}>{ago(i.createdAt)}</span>
                  {i.resolved && <span style={{ fontSize: '10px', fontWeight: 700, color: '#86efac', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Resolved</span>}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                    {canManage && (
                      <button type="button" onClick={() => toggle(i)} title={i.resolved ? 'Reopen' : 'Resolve'} aria-label={i.resolved ? 'Reopen' : 'Resolve'} style={iconBtn}>
                        {i.resolved ? <RotateCcw size={13} /> : <Check size={14} />}
                      </button>
                    )}
                    {canManage && (
                      <button type="button" onClick={() => remove(i)} title="Delete" aria-label="Delete" style={{ ...iconBtn, color: 'rgba(252,165,165,0.8)' }}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(var(--fg),0.85)', lineHeight: 1.55, whiteSpace: 'pre-wrap', textDecoration: i.resolved ? 'line-through' : 'none' }}>{i.body}</div>
              </div>
            )
          })
        )}
      </div>

      {resolved.length > 0 && (
        <button type="button" onClick={() => setShowResolved((s) => !s)} style={{ background: 'none', border: 'none', color: 'var(--accent-text)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0, marginBottom: '14px' }}>
          {showResolved ? 'Hide resolved' : `Show ${resolved.length} resolved`}
        </button>
      )}

      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <textarea
          className="cq-textarea"
          rows={2}
          value={draft}
          placeholder="Leave feedback on this section…"
          style={{ flex: 1, resize: 'vertical' }}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) post() }}
        />
        <button
          type="button"
          onClick={post}
          disabled={!draft.trim() || busy}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0, background: draft.trim() ? 'linear-gradient(135deg,#5B86A3,#3E6580)' : 'rgba(91,134,163,0.25)', border: 'none', borderRadius: '10px', padding: '10px 16px', color: 'var(--on-accent)', fontWeight: 700, fontSize: '13px', cursor: draft.trim() && !busy ? 'pointer' : 'default', fontFamily: 'inherit' }}
        >
          <Send size={14} /> Post
        </button>
      </div>
    </div>
  )
}

const iconBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'rgba(var(--fg),0.45)',
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px',
  fontFamily: 'inherit',
}
