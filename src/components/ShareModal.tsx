import { useRef, useState } from 'react'
import { Check, Copy, FileDown, Link2, Loader2, Presentation, Trash2 } from 'lucide-react'
import type { Project } from '@/types'
import { hasSupabase } from '@/lib/supabase'
import { newProjectId } from '@/lib/id'
import { preparedness, riskColor, riskLabel } from '@/lib/format'
import { StatusBrief } from '@/components/StatusBrief'

/** Strip a leading '#' so hex colours suit pptxgenjs (which wants bare hex). */
const hx = (c: string) => c.replace('#', '')

/**
 * Build a native, editable 16:9 slide of the status brief (real text + shapes,
 * not a flattened image), so it drops cleanly into a leadership deck. `pptx` is
 * a live PptxGenJS instance (typed loose to keep the lib a lazy import).
 */
function buildStatusSlide(pptx: any, project: Project) {
  const sd = project.stageData
  const prep = preparedness(project)
  const pct = prep.pct
  const statusColor = pct >= 80 ? '22C55E' : pct >= 50 ? 'F59E0B' : 'EF4444'
  const statusWord = pct >= 80 ? 'On track' : pct >= 50 ? 'At risk' : 'Needs attention'
  const goLive = sd.milestones.goLiveDate
    ? new Date(sd.milestones.goLiveDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : project.targetDate || '-'
  const longDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const scoreOf = (l: number, i: number) => Math.round(((l * i) / 9) * 100) / 10
  const topRisks = sd.risk.items
    .filter((r) => r.description.trim())
    .map((r) => ({ ...r, score: scoreOf(r.likelihood, r.impact) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
  const named = sd.stakeholders.rows.filter((r) => r.name.trim())
  const advocates = named.filter((r) => r.support === 'Advocate').length
  const resistant = named.filter((r) => r.support === 'Resistant').length
  const ask = sd.executive.ask?.trim()
  const branded = !sd.executive.hideBranding

  const PANEL = '1B2130', MUTED = 'AEB9C4', LIGHT = 'B8D0DE', TEXT = 'E8EDF2'
  const slide = pptx.addSlide()
  slide.background = { color: '11141F' }

  // Header band
  slide.addShape('rect', { x: 0, y: 0, w: 13.33, h: 1.4, fill: { color: '2C4A5F' } })
  if (branded) slide.addText('✦  ADAPTUS', { x: 0.5, y: 0.18, w: 4, h: 0.25, fontSize: 9, bold: true, color: 'CFE0EA', charSpacing: 2 })
  slide.addText(project.name || 'Change initiative', { x: 0.5, y: 0.4, w: 9.4, h: 0.6, fontSize: 26, bold: true, color: 'FFFFFF', valign: 'middle' })
  slide.addText(`${project.type || 'Change initiative'}   ·   Status Brief   ·   ${longDate}`, { x: 0.5, y: 1.0, w: 9.4, h: 0.3, fontSize: 11, color: LIGHT })
  slide.addShape('roundRect', { x: 10.5, y: 0.48, w: 2.33, h: 0.52, rectRadius: 0.08, fill: { color: statusColor } })
  slide.addText(`${statusWord} · ${pct}% ready`, { x: 10.5, y: 0.48, w: 2.33, h: 0.52, fontSize: 11, bold: true, color: '11141F', align: 'center', valign: 'middle' })

  // Metric tiles
  const tiles = [
    { v: `${pct}%`, l: 'Launch ready', c: statusColor },
    { v: goLive, l: 'Go-live', c: 'FFFFFF' },
    { v: prep.total ? `${prep.done}/${prep.total}` : '-', l: 'Steps complete', c: 'FFFFFF' },
  ]
  const tileW = 3.97, gap = 0.2, tileY = 1.7
  tiles.forEach((t, i) => {
    const x = 0.5 + i * (tileW + gap)
    slide.addShape('roundRect', { x, y: tileY, w: tileW, h: 1.1, rectRadius: 0.06, fill: { color: PANEL }, line: { color: '2A3242', width: 1 } })
    slide.addText(t.v, { x: x + 0.22, y: tileY + 0.12, w: tileW - 0.44, h: 0.6, fontSize: t.v.length > 8 ? 20 : 28, bold: true, color: t.c, valign: 'middle' })
    slide.addText(t.l.toUpperCase(), { x: x + 0.22, y: tileY + 0.74, w: tileW - 0.44, h: 0.26, fontSize: 10, color: MUTED, charSpacing: 1 })
  })

  // Left column: top risks
  const colY = 3.2
  slide.addText('TOP RISKS TO WATCH', { x: 0.5, y: colY, w: 6, h: 0.3, fontSize: 12, bold: true, color: LIGHT, charSpacing: 1 })
  let ry = colY + 0.5
  const addRisk = (text: string, sev: string | null, color: string) => {
    slide.addShape('ellipse', { x: 0.55, y: ry + 0.06, w: 0.14, h: 0.14, fill: { color } })
    slide.addText(
      [{ text, options: {} }, ...(sev ? [{ text: `   ${sev}`, options: { color, bold: true } }] : [])],
      { x: 0.85, y: ry - 0.03, w: 5.6, h: 0.5, fontSize: 12, color: TEXT, valign: 'top' },
    )
    ry += 0.62
  }
  if (sd.sponsor.noSponsor) addRisk('No executive sponsor identified', 'Critical', 'EF4444')
  if (topRisks.length) topRisks.forEach((r) => addRisk(r.description, riskLabel(r.score), hx(riskColor(r.score))))
  else if (!sd.sponsor.noSponsor) slide.addText('No risks logged yet.', { x: 0.85, y: ry, w: 5.6, h: 0.3, fontSize: 12, italic: true, color: MUTED })

  // Right column: coalition + the ask
  const rx = 7.0
  slide.addText('WHO’S ON BOARD?', { x: rx, y: colY, w: 5.83, h: 0.3, fontSize: 12, bold: true, color: LIGHT, charSpacing: 1 })
  const sponsorLine = sd.sponsor.noSponsor
    ? '⚠ No executive sponsor — flagged as a risk'
    : sd.sponsor.name
      ? `Sponsor: ${sd.sponsor.name}${sd.sponsor.role ? ` (${sd.sponsor.role})` : ''}`
      : 'No sponsor named yet'
  slide.addText(sponsorLine, { x: rx, y: colY + 0.42, w: 5.83, h: 0.35, fontSize: 12.5, bold: !sd.sponsor.noSponsor, color: sd.sponsor.noSponsor ? 'FCA5A5' : 'FFFFFF' })
  if (named.length) {
    const parts = [`${advocates} advocate${advocates === 1 ? '' : 's'}`]
    if (resistant) parts.push(`${resistant} need engagement`)
    parts.push(`${named.length} mapped`)
    slide.addText(parts.join('    ·    '), { x: rx, y: colY + 0.82, w: 5.83, h: 0.3, fontSize: 11, color: MUTED })
  }

  const askY = colY + 1.45
  slide.addText('WHAT I NEED FROM YOU', { x: rx, y: askY, w: 5.83, h: 0.3, fontSize: 12, bold: true, color: LIGHT, charSpacing: 1 })
  if (ask) {
    slide.addShape('roundRect', { x: rx, y: askY + 0.42, w: 5.83, h: 1.75, rectRadius: 0.05, fill: { color: '17263A' }, line: { color: '5B86A3', width: 1 } })
    slide.addText(ask, { x: rx + 0.25, y: askY + 0.55, w: 5.33, h: 1.5, fontSize: 12.5, color: TEXT, valign: 'top' })
  } else {
    slide.addText('Add a clear ask — it’s the line that gets your sponsor to reply.', { x: rx, y: askY + 0.42, w: 5.83, h: 0.4, fontSize: 12, italic: true, color: MUTED })
  }

  if (branded) slide.addText('Made with Adaptus', { x: 0.5, y: 7.08, w: 6, h: 0.3, fontSize: 10, color: '6B7A88' })
}

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

  const fileBase = () =>
    (project.name || 'status-brief').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '') || 'status-brief'
  // Rasterise the brief once; both PDF and PPTX build from this canvas.
  const captureBrief = async () => {
    const el = briefRef.current
    if (!el) return null
    const { default: html2canvas } = await import('html2canvas-pro')
    return html2canvas(el, { scale: 2, backgroundColor: '#11141f', useCORS: true })
  }

  // Option: render the brief to a one-click PDF download.
  const downloadPdf = async () => {
    if (busy) return
    commitAsk()
    setBusy('pdf')
    try {
      const canvas = await captureBrief()
      if (!canvas) return
      const { default: jsPDF } = await import('jspdf')
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
      pdf.save(`${fileBase()}-status-brief.pdf`)
    } catch (err) {
      console.error('[adaptus] PDF generation failed', err)
    } finally {
      setBusy(null)
    }
  }

  // Option: export the brief as a native, editable 16:9 PowerPoint slide.
  const downloadPptx = async () => {
    if (busy) return
    commitAsk()
    setBusy('pptx')
    try {
      const { default: PptxGenJS } = await import('pptxgenjs')
      const pptx = new PptxGenJS()
      pptx.layout = 'LAYOUT_WIDE' // 13.33 x 7.5 in (16:9)
      buildStatusSlide(pptx, previewProject)
      await pptx.writeFile({ fileName: `${fileBase()}-status-brief.pptx` })
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
          A read-only, one-glance summary anyone can open, no login. Forward it to your sponsor or exec.
        </p>

        {!hasSupabase ? (
          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '14px 16px', fontSize: '13px', color: 'var(--text)', lineHeight: 1.6 }}>
            Sharing needs the cloud. It’ll work on the deployed site once Supabase is configured.
          </div>
        ) : (
          <>
            {/* Three ways to share, side by side, at the top. */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '22px' }}>
              <button type="button" onClick={shareLinkAction} className="share-option">
                <Link2 size={20} color="#5B86A3" />
                <span className="share-option-title">{token ? 'Copy link' : 'Shareable link'}</span>
                <span className="share-option-sub">A no-login web link to forward.</span>
              </button>
              <button type="button" onClick={downloadPdf} disabled={!!busy} className="share-option" style={{ opacity: busy && busy !== 'pdf' ? 0.55 : 1 }}>
                {busy === 'pdf' ? <Loader2 size={20} color="#5B86A3" className="spin" /> : <FileDown size={20} color="#5B86A3" />}
                <span className="share-option-title">PDF</span>
                <span className="share-option-sub">{busy === 'pdf' ? 'Building your PDF…' : 'Download the brief as a PDF.'}</span>
              </button>
              <button type="button" onClick={downloadPptx} disabled={!!busy} className="share-option" style={{ opacity: busy && busy !== 'pptx' ? 0.55 : 1 }}>
                {busy === 'pptx' ? <Loader2 size={20} color="#5B86A3" className="spin" /> : <Presentation size={20} color="#5B86A3" />}
                <span className="share-option-title">PowerPoint</span>
                <span className="share-option-sub">{busy === 'pptx' ? 'Building your slide…' : 'Export the brief as a slide.'}</span>
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
