import type { Project } from '@/types'
import { avgRisk, buildTimeline, collectLaunchTasks, preparedness, riskColor, riskLabel, type PrepTask } from '@/lib/format'
import { bare, brandOf, shade } from '@/lib/brand'

/**
 * PowerPoint export. Builds native, editable 16:9 slides (real text and shapes,
 * not a flattened screenshot), so what lands in a leadership deck can be picked
 * apart and re-used. Shared by the share panel (the whole brief) and the launch
 * dashboard (the timeline on its own).
 *
 * pptx params are typed loose (`any`) to keep pptxgenjs a lazy import: the
 * library is heavy and only pulled in when someone actually exports.
 */

/** Strip a leading '#' so hex colours suit pptxgenjs (which wants bare hex). */
const hx = (c: string) => c.replace('#', '')

// Shared deck palette (bare hex for pptxgenjs) and helpers, so the follow-on
// slides match the summary slide and the on-screen brief. BAND and LIGHT are
// derived per-project from the user's brand colour (see deckPalette).
const DECK = { BG: '11141F', BAND: '2C4A5F', PANEL: '1B2130', LINE: '2A3242', MUTED: 'AEB9C4', SUB: '8593A0', LIGHT: 'B8D0DE', TEXT: 'E8EDF2' }

/** The deck palette for a project: the shared dark base, re-accented in its brand colour. */
function deckPalette(project: Project) {
  const brand = brandOf(project)
  return {
    ...DECK,
    BAND: bare(shade(brand.color, -0.35)),
    LIGHT: bare(shade(brand.color, 0.45)),
    BAND_FG: bare(brand.fg === '#FFFFFF' ? '#FFFFFF' : '#11141F'),
    logo: brand.logo,
    logoRatio: brand.logoRatio,
  }
}
type Deck = ReturnType<typeof deckPalette>

/** Drop the user's logo into a slide's top-right, sized to a fixed height. */
function addLogo(slide: any, deck: Deck, y = 0.22, h = 0.46) {
  if (!deck.logo) return
  const w = Math.min(2.6, h * deck.logoRatio)
  slide.addImage({ data: deck.logo, x: 13.33 - 0.5 - w, y, w, h })
}
// Friendlier task-group labels — mirrors StatusBrief so the deck reads the same.
const GROUP_LABELS: Record<string, string> = { 'Launch readiness': 'Go-live checklist', 'Your tasks': 'Additional tasks', 'Stakeholders': 'Key people', 'Resistance': 'Pushback', 'Dependencies': 'Things you’re waiting on', 'Impacted groups': 'Who’s affected', 'Sponsor commitments': 'Backer commitments' }
const groupLabel = (g: string) => GROUP_LABELS[g] ?? g
const shortDate = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
// Vertical bounds of a content slide's body (inches), between the title band and footer.
const BODY_TOP = 1.25, BODY_BOTTOM = 7.05

/** A fresh 16:9 content slide with the shared dark background + a slim title band. */
function addContentSlide(pptx: any, title: string, deck: Deck) {
  const slide = pptx.addSlide()
  slide.background = { color: deck.BG }
  slide.addShape('rect', { x: 0, y: 0, w: 13.33, h: 0.9, fill: { color: deck.BAND } })
  slide.addText(title, { x: 0.5, y: 0.16, w: 12.3, h: 0.55, fontSize: 22, bold: true, color: deck.BAND_FG, valign: 'middle' })
  addLogo(slide, deck)
  return slide
}

/** Rough wrapped-line count for a text box, so paginated rows don't overlap. */
const estLines = (text: string, charsPerLine: number) => Math.max(1, Math.ceil((text.length || 1) / charsPerLine))

/**
 * Build a native, editable 16:9 slide of the status brief (real text + shapes,
 * not a flattened image), so it drops cleanly into a leadership deck. `pptx` is
 * a live PptxGenJS instance (typed loose to keep the lib a lazy import).
 */
function buildStatusSlide(pptx: any, project: Project, deck: Deck) {
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

  const PANEL = deck.PANEL, MUTED = deck.MUTED, LIGHT = deck.LIGHT, TEXT = deck.TEXT
  const slide = pptx.addSlide()
  slide.background = { color: deck.BG }

  // Header band, in the project's brand colour when it has one.
  slide.addShape('rect', { x: 0, y: 0, w: 13.33, h: 1.4, fill: { color: deck.BAND } })
  // The user's own logo takes the mark; the Adaptus one shows only without it.
  if (deck.logo) addLogo(slide, deck, 0.16, 0.5)
  else if (branded) slide.addText('✦  ADAPTUS', { x: 0.5, y: 0.18, w: 4, h: 0.25, fontSize: 9, bold: true, color: LIGHT, charSpacing: 2 })
  slide.addText(project.name || 'Change project', { x: 0.5, y: 0.4, w: 9.4, h: 0.6, fontSize: 26, bold: true, color: deck.BAND_FG, valign: 'middle' })
  slide.addText(`${project.type || 'Change project'}   ·   Status Brief   ·   ${longDate}`, { x: 0.5, y: 1.0, w: 9.4, h: 0.3, fontSize: 11, color: LIGHT })
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
  if (sd.sponsor.noSponsor) addRisk('No senior backer identified', 'Critical', 'EF4444')
  if (topRisks.length) topRisks.forEach((r) => addRisk(r.description, riskLabel(r.score), hx(riskColor(r.score))))
  else if (!sd.sponsor.noSponsor) {
    // No individual risks logged: fall back to the overall risk-going-in score,
    // just as the brief does, rather than showing an empty section.
    const avg = avgRisk(sd.risk.items)
    if (avg !== null) addRisk(`Overall risk going in: ${riskLabel(avg)} (${avg}/10)`, null, hx(riskColor(avg)))
    else slide.addText('No risks logged yet.', { x: 0.85, y: ry, w: 5.6, h: 0.3, fontSize: 12, italic: true, color: MUTED })
  }

  // Right column: coalition + the ask
  const rx = 7.0
  slide.addText('WHO’S ON BOARD?', { x: rx, y: colY, w: 5.83, h: 0.3, fontSize: 12, bold: true, color: LIGHT, charSpacing: 1 })
  const sponsorLine = sd.sponsor.noSponsor
    ? '⚠ No senior backer — flagged as a risk'
    : sd.sponsor.name
      ? `Backer: ${sd.sponsor.name}${sd.sponsor.role ? ` (${sd.sponsor.role})` : ''}`
      : 'No backer named yet'
  slide.addText(sponsorLine, { x: rx, y: colY + 0.42, w: 5.83, h: 0.35, fontSize: 12.5, bold: !sd.sponsor.noSponsor, color: sd.sponsor.noSponsor ? 'FCA5A5' : 'FFFFFF' })
  if (named.length) {
    const parts = [`${advocates} on board`]
    if (resistant) parts.push(`${resistant} to win over`)
    parts.push(`${named.length} listed`)
    slide.addText(parts.join('    ·    '), { x: rx, y: colY + 0.82, w: 5.83, h: 0.3, fontSize: 11, color: MUTED })
  }

  const askY = colY + 1.45
  slide.addText('WHAT I NEED FROM YOU', { x: rx, y: askY, w: 5.83, h: 0.3, fontSize: 12, bold: true, color: LIGHT, charSpacing: 1 })
  if (ask) {
    slide.addShape('roundRect', { x: rx, y: askY + 0.42, w: 5.83, h: 1.75, rectRadius: 0.05, fill: { color: '17263A' }, line: { color: bare(brandOf(project).color), width: 1 } })
    slide.addText(ask, { x: rx + 0.25, y: askY + 0.55, w: 5.33, h: 1.5, fontSize: 12.5, color: TEXT, valign: 'top' })
  } else {
    slide.addText('Add a clear ask — it’s the line that gets your backer to reply.', { x: rx, y: askY + 0.42, w: 5.83, h: 0.4, fontSize: 12, italic: true, color: MUTED })
  }

  if (branded) slide.addText('Made with Adaptus', { x: 0.5, y: 7.08, w: 6, h: 0.3, fontSize: 10, color: '6B7A88' })
}

/**
 * "What's left before launch": every open launch task, grouped by section with
 * owner/due, paginated across as many slides as needed (same source + grouping
 * as the brief, but never truncated). Adds nothing when there are no open tasks.
 */
function buildTasksSlides(pptx: any, project: Project, deck: Deck) {
  const openTasks = collectLaunchTasks(project).filter((t) => !t.done)
  const prep = preparedness(project)
  if (prep.total === 0 || openTasks.length === 0) {
    // Match the brief's positive states rather than emitting a blank slide.
    const slide = addContentSlide(pptx, 'What’s left before launch', deck)
    slide.addText(
      prep.total === 0 ? 'Launch tasks haven’t been mapped yet.' : `✓ All ${prep.total} tasks complete — ready to launch.`,
      { x: 0.5, y: BODY_TOP, w: 12.3, h: 0.4, fontSize: 14, italic: prep.total === 0, bold: prep.total !== 0, color: prep.total === 0 ? deck.MUTED : '86EFAC' },
    )
    return
  }

  const openByGroup = openTasks.reduce<{ group: string; items: PrepTask[] }[]>((acc, t) => {
    const g = acc.find((x) => x.group === t.group) ?? (acc.push({ group: t.group, items: [] }), acc[acc.length - 1])
    g.items.push(t)
    return acc
  }, [])

  let slide = addContentSlide(pptx, 'What’s left before launch', deck)
  let y = BODY_TOP
  const nextPage = () => { slide = addContentSlide(pptx, 'What’s left before launch (cont.)', deck); y = BODY_TOP }

  for (const { group, items } of openByGroup) {
    // Keep a group header with at least its first row; otherwise start a page.
    if (y + 0.95 > BODY_BOTTOM) nextPage()
    slide.addText(`${groupLabel(group).toUpperCase()}   ·   ${items.length} left`, { x: 0.5, y, w: 12.3, h: 0.3, fontSize: 12, bold: true, color: deck.LIGHT, charSpacing: 1 })
    y += 0.44

    for (const t of items) {
      const hasSub = !!(t.owner || t.due)
      const rowH = 0.3 * estLines(t.label, 108) + (hasSub ? 0.26 : 0.14)
      if (y + rowH > BODY_BOTTOM) {
        nextPage()
        slide.addText(`${groupLabel(group).toUpperCase()} (CONT.)`, { x: 0.5, y, w: 12.3, h: 0.3, fontSize: 12, bold: true, color: deck.LIGHT, charSpacing: 1 })
        y += 0.44
      }
      slide.addShape('roundRect', { x: 0.55, y: y + 0.03, w: 0.17, h: 0.17, rectRadius: 0.03, fill: { color: deck.BG }, line: { color: '6E7C8A', width: 1 } })
      slide.addText(t.label, { x: 0.9, y: y - 0.03, w: 11.85, h: 0.3 * estLines(t.label, 108), fontSize: 12.5, color: deck.TEXT, valign: 'top' })
      if (hasSub) {
        const sub = [t.owner ? `Owner: ${t.owner}` : '', t.due ? `Due ${shortDate(t.due)}` : ''].filter(Boolean).join('     ·     ')
        slide.addText(sub, { x: 0.9, y: y + 0.3 * estLines(t.label, 108) - 0.06, w: 11.85, h: 0.24, fontSize: 10, color: deck.SUB })
      }
      y += rowH
    }
    y += 0.16
  }
}

/**
 * "Launch timeline": open tasks that have a due date, chronological, paginated.
 * Mirrors the brief's "Coming up, by date" (open dated tasks only — no
 * milestone/done rows). Adds nothing when no open task is dated.
 */
function buildTimelineSlide(pptx: any, project: Project, deck: Deck) {
  // The same timeline the dashboard and the brief show: dated tasks, the go-live
  // milestone, and the reviews that come after it.
  const timeline = buildTimeline(project)
  if (!timeline.length) return

  let slide = addContentSlide(pptx, 'Launch timeline', deck)
  let y = BODY_TOP
  for (const t of timeline) {
    const suffix = [t.owner, t.postLaunch ? 'after launch' : ''].filter(Boolean).join('   ·   ')
    const label = (t.milestone ? '🚀 ' : '') + t.label + (suffix ? `   ·   ${suffix}` : '')
    const rowH = 0.3 * estLines(label, 104) + 0.2
    if (y + rowH > BODY_BOTTOM) { slide = addContentSlide(pptx, 'Launch timeline (cont.)', deck); y = BODY_TOP }
    slide.addText(shortDate(t.date), { x: 0.5, y, w: 1.1, h: 0.3, fontSize: 12, bold: true, color: deck.LIGHT, valign: 'top' })
    slide.addText(label, {
      x: 1.7, y, w: 11.1, h: 0.3 * estLines(label, 104),
      fontSize: 12.5, bold: t.milestone, strike: t.done, color: t.done ? deck.SUB : deck.TEXT, valign: 'top',
    })
    y += rowH
  }
}

/**
 * "Adoption": each named adoption metric as a labelled progress bar, paginated.
 * Mirrors the brief's adoption snapshot. Adds nothing when no metric is named.
 */
function buildAdoptionSlide(pptx: any, project: Project, deck: Deck) {
  const metrics = project.stageData.adoption.metrics.filter((m) => m.name.trim())
  if (!metrics.length) return

  let slide = addContentSlide(pptx, 'Real use', deck)
  let y = BODY_TOP
  for (const m of metrics) {
    if (y + 0.95 > BODY_BOTTOM) { slide = addContentSlide(pptx, 'Real use (cont.)', deck); y = BODY_TOP }
    const c = parseFloat(m.current)
    const t = parseFloat(m.target)
    const has = isFinite(c) && isFinite(t) && t !== 0
    const p2 = has ? Math.min(100, Math.round((c / t) * 100)) : 0
    const bar = p2 >= 80 ? '22C55E' : p2 >= 50 ? 'F59E0B' : 'EF4444'
    const status = p2 >= 80 ? { t: 'On track', c: '86EFAC' } : p2 >= 50 ? { t: 'Behind target', c: 'FCD34D' } : { t: 'Well behind', c: 'FCA5A5' }

    slide.addText(m.name, { x: 0.5, y, w: 8.8, h: 0.3, fontSize: 13, color: deck.TEXT, valign: 'top' })
    if (m.current) slide.addText(`${m.current}${m.unit} / ${m.target}${m.unit}`, { x: 9.4, y, w: 3.4, h: 0.3, fontSize: 13, bold: true, color: deck.LIGHT, align: 'right', valign: 'top' })
    y += 0.4
    slide.addShape('roundRect', { x: 0.5, y, w: 12.3, h: 0.15, rectRadius: 0.04, fill: { color: deck.LINE } })
    if (has && p2 > 0) slide.addShape('roundRect', { x: 0.5, y, w: Math.max(0.15, (12.3 * p2) / 100), h: 0.15, rectRadius: 0.04, fill: { color: bar } })
    y += 0.26
    if (has) {
      slide.addText(status.t, { x: 0.5, y, w: 6, h: 0.25, fontSize: 10, bold: true, color: status.c })
      y += 0.4
    } else {
      y += 0.24
    }
  }
}

/** Build every slide of the status brief: summary, open tasks, timeline, adoption. */
export function buildBriefDeck(pptx: any, project: Project) {
  const deck = deckPalette(project)
  buildStatusSlide(pptx, project, deck)
  buildTasksSlides(pptx, project, deck)
  buildTimelineSlide(pptx, project, deck)
  buildAdoptionSlide(pptx, project, deck)
}

/** Build the timeline on its own, for the dashboard's quick export. */
export function buildTimelineDeck(pptx: any, project: Project) {
  buildTimelineSlide(pptx, project, deckPalette(project))
}

/**
 * Write a .pptx for a project. `kind` picks what goes in it: the full brief, or
 * just the timeline.
 */
export async function downloadDeck(project: Project, filename: string, kind: 'brief' | 'timeline' = 'brief') {
  const { default: PptxGenJS } = await import('pptxgenjs')
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE' // 13.33 x 7.5 in (16:9)
  if (kind === 'timeline') buildTimelineDeck(pptx, project)
  else buildBriefDeck(pptx, project)
  await pptx.writeFile({ fileName: filename })
}
