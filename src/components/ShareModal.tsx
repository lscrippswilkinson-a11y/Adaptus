import { useRef, useState } from 'react'
import { Check, Copy, FileDown, Link2, Loader2, Trash2 } from 'lucide-react'
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
  const [hideBranding, setHideBranding] = useState(project.stageData.executive.hideBranding ?? false)
  const [copied, setCopied] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)
  const briefRef = useRef<HTMLDivElement>(null)

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
  // Top-right option: render the brief to a one-click PDF download.
  const downloadPdf = async () => {
    const el = briefRef.current
    if (!el || pdfBusy) return
    commitAsk()
    setPdfBusy(true)
    try {
      // Load the (heavy) PDF libs only on demand, so they stay out of first paint.
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas-pro')])
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#11141f', useCORS: true })
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgW = pageW
      const imgH = (canvas.height * imgW) / canvas.width
      const imgData = canvas.toDataURL('image/png')
      // Paint the dark page background, then lay the (possibly tall) brief
      // across as many pages as it needs by shifting it up one page each time.
      let heightLeft = imgH
      let position = 0
      const fillPage = () => {
        pdf.setFillColor(17, 20, 31) // #11141f, matches the brief
        pdf.rect(0, 0, pageW, pageH, 'F')
      }
      fillPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH)
      heightLeft -= pageH
      while (heightLeft > 0) {
        position -= pageH
        pdf.addPage()
        fillPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH)
        heightLeft -= pageH
      }
      const safeName = (project.name || 'status-brief').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '') || 'status-brief'
      pdf.save(`${safeName}-status-brief.pdf`)
    } catch (err) {
      console.error('[adaptus] PDF generation failed', err)
    } finally {
      setPdfBusy(false)
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
          A read-only, one-glance summary anyone can open, no login. Forward it to your sponsor or exec.
        </p>

        {!hasSupabase ? (
          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '14px 16px', fontSize: '13px', color: 'var(--text)', lineHeight: 1.6 }}>
            Sharing needs the cloud. It’ll work on the deployed site once Supabase is configured.
          </div>
        ) : (
          <>
            {/* Two ways to share, side by side, at the top. */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '22px' }}>
              <button type="button" onClick={shareLinkAction} className="share-option">
                <Link2 size={20} color="#5B86A3" />
                <span className="share-option-title">{token ? 'Copy share link' : 'Shareable link'}</span>
                <span className="share-option-sub">A no-login web link to forward.</span>
              </button>
              <button type="button" onClick={downloadPdf} disabled={pdfBusy} className="share-option" style={{ opacity: pdfBusy ? 0.7 : 1 }}>
                {pdfBusy ? <Loader2 size={20} color="#5B86A3" className="spin" /> : <FileDown size={20} color="#5B86A3" />}
                <span className="share-option-title">Downloadable PDF</span>
                <span className="share-option-sub">{pdfBusy ? 'Building your PDF…' : 'Download the brief as a PDF.'}</span>
              </button>
            </div>

            {/* The "what I need from you" ask */}
            <div className="cq-lbl">What I need from leadership</div>
            <textarea
              className="cq-textarea"
              rows={3}
              value={ask}
              placeholder="The one clear ask that gets a reply, e.g., “Email all staff before go-live, and join the launch all-hands.”"
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

            {/* Live preview of exactly what recipients see. The id scopes the
                print stylesheet so "Download PDF" prints only the brief. */}
            <div className="cq-lbl" style={{ marginBottom: '10px' }}>Preview</div>
            <div id="brief-print" ref={briefRef}>
              <StatusBrief project={previewProject} />
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
