import { useState } from 'react'
import { Check, Copy, Link2, Trash2 } from 'lucide-react'
import type { Project } from '@/types'
import { hasSupabase } from '@/lib/supabase'
import { newProjectId } from '@/lib/id'
import { StatusBrief } from '@/components/StatusBrief'

/**
 * Share a project's status brief via a public, no-login link. Generates a
 * share token (persisted on the project), lets the owner edit the "what I need
 * from you" ask, previews the exact brief recipients will see, and can revoke
 * the link. Updates flow back through `onUpdate` (a project-level dispatch).
 */
export function ShareModal({ project, onUpdate, onClose }: { project: Project; onUpdate: (p: Project) => void; onClose: () => void }) {
  const [ask, setAsk] = useState(project.stageData.executive.ask ?? '')
  const [copied, setCopied] = useState(false)

  const token = project.shareToken ?? null
  const shareUrl = token ? `${window.location.origin}/?share=${token}` : ''

  // Preview reflects the in-progress ask edit, even before it's committed.
  const previewProject: Project = {
    ...project,
    stageData: { ...project.stageData, executive: { ...project.stageData.executive, ask } },
  }

  const commitAsk = () => {
    if (ask !== project.stageData.executive.ask) {
      onUpdate({ ...project, stageData: { ...project.stageData, executive: { ...project.stageData.executive, ask } } })
    }
  }

  const createLink = () => {
    commitAsk()
    onUpdate({ ...project, shareToken: newProjectId(), stageData: { ...project.stageData, executive: { ...project.stageData.executive, ask } } })
  }

  const revoke = () => onUpdate({ ...project, shareToken: null })

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard blocked — the URL is still selectable in the field */
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,20,0.85)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 100, overflowY: 'auto', padding: '40px 20px' }} onClick={onClose}>
      <div
        style={{ background: 'var(--surface-card)', border: '1px solid rgba(var(--fg),0.08)', borderRadius: '20px', padding: '32px 36px', width: '560px', maxWidth: '92vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: '11px', color: '#5B86A3', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>Share</div>
        <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>Status brief for leadership</h2>
        <p style={{ margin: '0 0 22px', fontSize: '13px', color: 'rgba(var(--fg),0.6)', lineHeight: 1.6 }}>
          A read-only, one-glance summary anyone can open — no login. Forward it to your sponsor or exec.
        </p>

        {!hasSupabase ? (
          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '14px 16px', fontSize: '13px', color: 'var(--text)', lineHeight: 1.6 }}>
            Sharing needs the cloud. It’ll work on the deployed site once Supabase is configured.
          </div>
        ) : (
          <>
            {/* The "what I need from you" ask */}
            <div className="cq-lbl">What I need from leadership</div>
            <textarea
              className="cq-textarea"
              rows={3}
              value={ask}
              placeholder="The one clear ask that gets a reply — e.g., “Email all staff before go-live, and join the launch all-hands.”"
              style={{ marginBottom: '20px' }}
              onChange={(e) => setAsk(e.target.value)}
              onBlur={commitAsk}
            />

            {/* Link controls */}
            {token ? (
              <>
                <div className="cq-lbl">Share link</div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input type="text" className="cq-input" readOnly value={shareUrl} onFocus={(e) => e.target.select()} style={{ flex: 1, minWidth: 0 }} />
                  <button
                    type="button"
                    onClick={copy}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0, background: 'linear-gradient(135deg,#5B86A3,#3E6580)', border: 'none', borderRadius: '10px', padding: '0 16px', color: 'var(--on-accent)', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {copied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy</>}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={revoke}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'rgba(var(--fg),0.45)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0, marginBottom: '24px' }}
                >
                  <Trash2 size={13} /> Revoke link
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={createLink}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg,#5B86A3,#3E6580)', border: 'none', borderRadius: '10px', padding: '12px 22px', color: 'var(--on-accent)', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', marginBottom: '24px' }}
              >
                <Link2 size={16} /> Create share link
              </button>
            )}

            {/* Live preview of exactly what recipients see */}
            <div className="cq-lbl" style={{ marginBottom: '10px' }}>Preview</div>
            <StatusBrief project={previewProject} />
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button
            type="button"
            onClick={() => { commitAsk(); onClose() }}
            style={{ background: 'rgba(var(--fg),0.06)', border: '1px solid rgba(var(--fg),0.1)', borderRadius: '10px', padding: '10px 22px', color: 'var(--text)', fontWeight: 600, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
