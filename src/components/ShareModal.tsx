import { useEffect, useRef, useState } from 'react'
import { Check, Copy, FileDown, Link2, Loader2, Presentation, Trash2 } from 'lucide-react'
import type { Project } from '@/types'
import { hasSupabase } from '@/lib/supabase'
import { newProjectId } from '@/lib/id'
import { breakPoints, downloadPdf } from '@/lib/exports'
import { downloadDeck } from '@/lib/deck'
import { StatusBrief } from '@/components/StatusBrief'
import { BrandingPanel } from '@/components/BrandingPanel'

/** The width the brief is laid out and exported at: 8.5in of letter paper at 96dpi. */
const EXPORT_W = 816

/**
 * Share a project's status brief via a public, no-login link. Generates a
 * share token (persisted on the project), lets the owner edit the "what I need
 * from you" ask, previews the exact brief recipients will see, and can revoke
 * the link. Updates flow back through `onUpdate` (a project-level dispatch).
 */
export function ShareModal({ project, onUpdate, onClose }: { project: Project; onUpdate: (p: Project) => void; onClose: () => void }) {
  const [ask, setAsk] = useState(project.stageData.executive.ask ?? '')
  const [hideBranding, setHideBranding] = useState(project.stageData.executive.hideBranding ?? false)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState<null | 'pdf' | 'pptx'>(null)
  /** The off-screen, letter-width brief: the one that gets captured. */
  const briefRef = useRef<HTMLDivElement>(null)
  const previewWrapRef = useRef<HTMLDivElement>(null)
  const previewInnerRef = useRef<HTMLDivElement>(null)
  const [preview, setPreview] = useState({ scale: 1, height: 0 })

  // Fit the letter-width brief into whatever width the modal gives us, and give
  // the (transform-scaled, so zero-height as far as layout is concerned) wrapper
  // its real height back.
  useEffect(() => {
    const wrap = previewWrapRef.current
    const inner = previewInnerRef.current
    if (!wrap || !inner) return
    const measure = () => {
      const scale = Math.min(1, wrap.clientWidth / EXPORT_W)
      setPreview({ scale, height: inner.offsetHeight * scale })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(wrap)
    ro.observe(inner)
    return () => ro.disconnect()
  }, [])

  const token = project.shareToken ?? null
  const shareUrl = token ? `${window.location.origin}/?share=${token}` : ''

  // Preview reflects the in-progress ask edit + branding toggle, pre-commit.
  const previewProject: Project = {
    ...project,
    stageData: { ...project.stageData, executive: { ...project.stageData.executive, ask, hideBranding } },
  }

  const toggleBranding = () => {
    const next = !hideBranding
    setHideBranding(next)
    onUpdate({ ...project, stageData: { ...project.stageData, executive: { ...project.stageData.executive, ask, hideBranding: next } } })
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

  // Top-left option: create the link (or copy it if one already exists).
  const shareLinkAction = () => (token ? copy() : createLink())

  const fileBase = () =>
    (project.name || 'status-brief').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '') || 'status-brief'

  // Option: render the brief to a one-click PDF download. Pages break between
  // the brief's own sections (.bs), so no section is sliced through the middle.
  const savePdf = async () => {
    if (busy) return
    commitAsk()
    setBusy('pdf')
    try {
      const el = briefRef.current
      if (!el) return
      await downloadPdf(el, `${fileBase()}-status-brief.pdf`, { breaks: breakPoints(el, '.bs') })
    } catch (err) {
      console.error('[adaptus] PDF generation failed', err)
    } finally {
      setBusy(null)
    }
  }

  // Option: export the brief as a native, editable 16:9 deck, carrying everything
  // the link/PDF show (summary, open tasks, timeline, adoption) in the project's
  // own brand colour and logo.
  const downloadPptx = async () => {
    if (busy) return
    commitAsk()
    setBusy('pptx')
    try {
      await downloadDeck(previewProject, `${fileBase()}-status-brief.pptx`, 'brief')
    } catch (err) {
      console.error('[adaptus] PPTX generation failed', err)
    } finally {
      setBusy(null)
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard blocked; the URL is still selectable in the field */
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
          A read-only, one-glance summary anyone can open, no login. Forward it to your senior backer or leadership.
        </p>

        {!hasSupabase ? (
          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '14px 16px', fontSize: '13px', color: 'var(--text)', lineHeight: 1.6 }}>
            Sharing needs the cloud. It’ll work on the deployed site once Supabase is configured.
          </div>
        ) : (
          <>
            {/* Three ways to share, side by side, at the top. */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '22px' }}>
              <button type="button" onClick={shareLinkAction} className="share-option">
                <Link2 size={20} color="#5B86A3" />
                <span className="share-option-title">{token ? 'Copy link' : 'Shareable link'}</span>
                <span className="share-option-sub">A no-login web link to forward.</span>
              </button>
              <button type="button" onClick={savePdf} disabled={!!busy} className="share-option" style={{ opacity: busy && busy !== 'pdf' ? 0.55 : 1 }}>
                {busy === 'pdf' ? <Loader2 size={20} color="#5B86A3" className="spin" /> : <FileDown size={20} color="#5B86A3" />}
                <span className="share-option-title">PDF</span>
                <span className="share-option-sub">{busy === 'pdf' ? 'Building your PDF…' : 'Download the brief as a PDF.'}</span>
              </button>
              <button type="button" onClick={downloadPptx} disabled={!!busy} className="share-option" style={{ opacity: busy && busy !== 'pptx' ? 0.55 : 1 }}>
                {busy === 'pptx' ? <Loader2 size={20} color="#5B86A3" className="spin" /> : <Presentation size={20} color="#5B86A3" />}
                <span className="share-option-title">PowerPoint</span>
                <span className="share-option-sub">{busy === 'pptx' ? 'Building your deck…' : 'Export the full brief as slides.'}</span>
              </button>
            </div>

            {/* The "what I need from you" ask */}
            <div className="cq-lbl">What I need from leadership</div>
            <textarea
              className="cq-textarea"
              rows={3}
              value={ask}
              placeholder="The one clear ask that gets a reply. Example: “Email all staff before launch, and join the launch meeting.”"
              style={{ marginBottom: '20px' }}
              onChange={(e) => setAsk(e.target.value)}
              onBlur={commitAsk}
            />

            {/* Link controls (shown once a link exists) */}
            {token && (
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
            )}

            {/* The user's own logo + colour, carried by every report below. */}
            <BrandingPanel project={project} onUpdate={onUpdate} />

            {/* White-label toggle: make the brief look fully the user's own. */}
            <label
              style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', background: 'rgba(var(--fg),0.03)', border: '1px solid rgba(var(--fg),0.1)', borderRadius: '12px', padding: '14px 16px', marginBottom: '24px' }}
            >
              <input
                type="checkbox"
                checked={hideBranding}
                onChange={toggleBranding}
                style={{ width: '18px', height: '18px', marginTop: '1px', accentColor: '#3E6580', cursor: 'pointer', flexShrink: 0 }}
              />
              <span>
                <span style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>Remove Adaptus branding</span>
                <span style={{ display: 'block', fontSize: '12px', color: 'rgba(var(--fg),0.55)', lineHeight: 1.5, marginTop: '3px' }}>
                  Hide the logo and the “Build your own” link so the brief looks entirely your own.
                </span>
              </span>
            </label>

            {/* Live preview of exactly what recipients see. It's the full
                letter-width brief scaled down to fit the modal, rather than a
                narrow re-flow of it, so what's previewed is what's exported.
                The id scopes the print stylesheet to the brief alone. */}
            <div className="cq-lbl" style={{ marginBottom: '10px' }}>Preview</div>
            <div id="brief-print" ref={previewWrapRef} style={{ overflow: 'hidden', height: preview.height || undefined }}>
              <div ref={previewInnerRef} style={{ width: `${EXPORT_W}px`, transform: `scale(${preview.scale})`, transformOrigin: 'top left' }}>
                <StatusBrief project={previewProject} />
              </div>
            </div>

            {/* The copy the PDF and the image are actually captured from, held
                off-screen at full letter width. Capturing the on-screen preview
                would bake in the modal's width, squeezing the two columns to
                about 230px each. */}
            <div aria-hidden style={{ position: 'fixed', top: 0, left: '-10000px', width: `${EXPORT_W}px`, pointerEvents: 'none' }}>
              <div ref={briefRef}>
                <StatusBrief project={previewProject} />
              </div>
            </div>
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
