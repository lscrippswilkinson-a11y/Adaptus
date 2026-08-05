import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, LineChart, Minus } from 'lucide-react'
import type { Project } from '@/types'
import { TREND_SERIES, trendSeries, type Snapshot, type TrendKey, type TrendPoint } from '@/lib/snapshots'
import { useLanguage } from '@/i18n/LanguageContext'
import { htmlLang } from '@/i18n'

/**
 * How the change has moved over time.
 *
 * Drawn as SMALL MULTIPLES — one measure per panel — rather than three lines in
 * one frame. Readiness, risk and plan progress answer three different questions,
 * and separating them means each panel carries a single series that its own
 * title identifies, so no colour has to do the work of telling series apart.
 *
 * All three panels share ONE fixed 0–100 axis. Auto-scaling each panel to its
 * own data would make a two-point wobble look like a collapse, which is the
 * classic way a trend chart lies.
 *
 * The series colours come from `--series-*` in index.css: a validated set that
 * stays distinguishable under the three common kinds of colour blindness, and
 * deliberately NOT the app's green/amber/red status ramp, which means
 * "good/warning/bad" everywhere else and must not double as series identity.
 */

const VB_H = 106
const PAD = { top: 10, right: 8, bottom: 10, left: 8 }
const PLOT_H = VB_H - PAD.top - PAD.bottom

const dayMs = (d: string) => new Date(`${d}T00:00:00Z`).getTime()

const yOf = (value: number) => PAD.top + (1 - Math.max(0, Math.min(100, value)) / 100) * PLOT_H

/**
 * The plot's width in CSS pixels, so the SVG viewBox can be 1 unit = 1 pixel.
 *
 * Without this the viewBox has to guess a width, and `preserveAspectRatio`
 * letterboxes the drawing inside its panel: visible dead space either side, and
 * — worse — a hover x that no longer matches where the pointer actually is.
 * Measuring means no scaling happens at all, so stroke widths and marker radii
 * are exactly what they say they are.
 */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setW(entry.contentRect.width))
    ro.observe(el)
    setW(el.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

interface PanelProps {
  label: string
  color: string
  goodWhenLow: boolean
  points: TrendPoint[]
  hoverDay: string | null
  onHover: (day: string | null) => void
  fmtDate: (day: string) => string
}

function TrendChart({ label, color, goodWhenLow, points, hoverDay, onHover, fmtDate }: PanelProps) {
  const { t, tp } = useLanguage()
  const [boxRef, boxW] = useWidth<HTMLDivElement>()
  const plotW = Math.max(0, boxW - PAD.left - PAD.right)
  const first = dayMs(points[0].day)
  const span = dayMs(points[points.length - 1].day) - first
  // x is spaced by REAL elapsed time, so a gap in the data reads as a gap.
  const xOf = (day: string) => PAD.left + (span === 0 ? plotW / 2 : ((dayMs(day) - first) / span) * plotW)
  const xs = points.map((p) => ({ ...p, x: xOf(p.day), y: yOf(p.value) }))
  const line = xs.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L ${xs[xs.length - 1].x.toFixed(1)} ${(PAD.top + PLOT_H).toFixed(1)} L ${xs[0].x.toFixed(1)} ${(PAD.top + PLOT_H).toFixed(1)} Z`

  const latest = points[points.length - 1]
  const delta = latest.value - points[0].value
  // "Better" is direction-aware: risk falling is the same good news as
  // readiness rising, so the arrow follows the measure, not the sign.
  const better = delta === 0 ? null : goodWhenLow ? delta < 0 : delta > 0
  const deltaColor = better === null ? 'rgba(var(--fg),0.5)' : better ? '#22c55e' : '#f59e0b'
  const hovered = hoverDay ? xs.find((p) => p.day === hoverDay) ?? null : null

  const gradientId = `trend-${label.replace(/\W+/g, '')}`

  return (
    <div style={{ background: 'rgba(var(--fg),0.03)', border: '1px solid rgba(var(--fg),0.07)', borderRadius: '12px', padding: '14px 14px 8px' }}>
      {/* The coloured mark carries the series identity; the text stays in text
          tokens so a value never depends on colour to be read. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        <span style={{ width: '9px', height: '9px', borderRadius: '3px', background: color, flexShrink: 0 }} />
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(var(--fg),0.7)' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '9px', margin: '6px 0 2px' }}>
        <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
          {hovered ? hovered.value : latest.value}
        </span>
        <span style={{ fontSize: '11px', color: 'rgba(var(--fg),0.45)' }}>/ 100</span>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '12px', fontWeight: 700, color: deltaColor }}>
          {delta === 0 ? <Minus size={12} /> : delta > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
          {delta === 0 ? t('no change') : tp('{delta} pts', { delta: delta > 0 ? `+${delta}` : String(delta) })}
        </span>
      </div>
      <div style={{ fontSize: '10.5px', color: 'rgba(var(--fg),0.45)', minHeight: '14px' }}>
        {hovered ? fmtDate(hovered.day) : tp('since {date}', { date: fmtDate(points[0].day) })}
      </div>

      <div ref={boxRef} style={{ marginTop: '4px' }}>
      {boxW > 0 && (
      <svg
        viewBox={`0 0 ${boxW} ${VB_H}`}
        width={boxW}
        height={VB_H}
        role="img"
        aria-label={tp('{label}: {value} out of 100, {delta} points since {date}.', {
          label,
          value: latest.value,
          delta: delta > 0 ? `+${delta}` : String(delta),
          date: fmtDate(points[0].day),
        })}
        style={{ display: 'block', overflow: 'visible', touchAction: 'none' }}
        onMouseLeave={() => onHover(null)}
        onMouseMove={(e) => {
          // 1 viewBox unit == 1 CSS pixel, so the pointer's offset in the box is
          // already the x to search against — no scaling, no letterbox offset.
          const x = e.clientX - e.currentTarget.getBoundingClientRect().left
          let best = xs[0]
          for (const p of xs) if (Math.abs(p.x - x) < Math.abs(best.x - x)) best = p
          onHover(best.day)
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Recessive grid: the 0/50/100 rules only, so the marks stay dominant. */}
        {[0, 50, 100].map((v) => (
          <line key={v} x1={PAD.left} x2={boxW - PAD.right} y1={yOf(v)} y2={yOf(v)} stroke="rgba(var(--fg),0.09)" strokeWidth={1} />
        ))}

        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {hovered && (
          <>
            <line x1={hovered.x} x2={hovered.x} y1={PAD.top} y2={PAD.top + PLOT_H} stroke="rgba(var(--fg),0.28)" strokeWidth={1} />
            {/* 2px surface ring so the marker reads against the line it sits on. */}
            <circle cx={hovered.x} cy={hovered.y} r={5} fill={color} stroke="var(--surface-card)" strokeWidth={2} />
          </>
        )}
        {/* The latest point is always marked and its value is the figure above,
            so the panel is legible without hovering anything. */}
        {!hovered && <circle cx={xs[xs.length - 1].x} cy={xs[xs.length - 1].y} r={4} fill={color} stroke="var(--surface-card)" strokeWidth={2} />}
      </svg>
      )}
      </div>
    </div>
  )
}

export function TrendPanel({ snapshots, projects }: { snapshots: Snapshot[]; projects: Project[] }) {
  const { t, tp, lang } = useLanguage()
  const [scope, setScope] = useState<string>('all')
  const [hoverDay, setHoverDay] = useState<string | null>(null)

  const fmtDate = useMemo(() => {
    // timeZone UTC to match how the day was stored: without it, a reading dated
    // 4 July renders as "Jul 3" for every user west of UTC.
    const f = new Intl.DateTimeFormat(htmlLang(lang), { day: 'numeric', month: 'short', timeZone: 'UTC' })
    return (day: string) => f.format(new Date(`${day}T00:00:00Z`))
  }, [lang])

  const scoped = useMemo(
    () => (scope === 'all' ? snapshots : snapshots.filter((s) => s.projectId === scope)),
    [snapshots, scope],
  )
  const series = useMemo(
    () => TREND_SERIES.map((s) => ({ ...s, points: trendSeries(scoped, s.key as TrendKey) })),
    [scoped],
  )

  const days = new Set(scoped.map((s) => s.day)).size
  const drawable = series.filter((s) => s.points.length >= 2)

  return (
    <div className="cq-card" style={{ marginTop: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <LineChart size={17} color="var(--accent-text)" />
        <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>{t('How it’s changed over time')}</span>
      </div>
      <div style={{ fontSize: '12px', color: 'rgba(var(--fg),0.62)', marginBottom: '14px', lineHeight: 1.5 }}>
        {t('A reading is kept each day you work on a change, so you can show that things are moving, not just where they stand today.')}
      </div>

      {/* Filters in one row above the charts. */}
      {projects.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <label htmlFor="trend-scope" style={{ fontSize: '12px', color: 'rgba(var(--fg),0.55)' }}>{t('Showing')}</label>
          <select id="trend-scope" className="cq-select" value={scope} onChange={(e) => setScope(e.target.value)} style={{ width: 'auto', fontSize: '13px' }}>
            <option value="all">{t('All projects')}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name || t('Untitled project')}</option>
            ))}
          </select>
        </div>
      )}

      {drawable.length === 0 ? (
        <div style={{ background: 'rgba(var(--fg),0.03)', border: '1px dashed rgba(var(--fg),0.12)', borderRadius: '12px', padding: '26px 22px', textAlign: 'center', fontSize: '13px', color: 'rgba(var(--fg),0.55)', lineHeight: 1.6 }}>
          {days <= 1
            ? t('The first reading is in. Come back after you next work on this and the trend starts to draw itself.')
            : t('No trend yet — the numbers haven’t moved since the first reading.')}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '12px' }}>
            {drawable.map((s) => (
              <TrendChart
                key={s.key}
                label={t(s.label)}
                color={s.color}
                goodWhenLow={s.goodWhenLow}
                points={s.points}
                hoverDay={hoverDay}
                onHover={setHoverDay}
                fmtDate={fmtDate}
              />
            ))}
          </div>
          {/* The same data as a table, for anyone who can't read the marks. */}
          <details style={{ marginTop: '12px' }}>
            <summary style={{ cursor: 'pointer', fontSize: '12px', color: 'rgba(var(--fg),0.5)' }}>{t('Show the numbers')}</summary>
            <div style={{ overflowX: 'auto', marginTop: '8px' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: '12px', minWidth: '100%' }}>
                <thead>
                  <tr>
                    <th style={cell(true)}>{t('Date')}</th>
                    {drawable.map((s) => <th key={s.key} style={cell(true)}>{t(s.label)}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[...new Set(drawable.flatMap((s) => s.points.map((p) => p.day)))].sort().map((day) => (
                    <tr key={day}>
                      <td style={cell(false)}>{fmtDate(day)}</td>
                      {drawable.map((s) => (
                        <td key={s.key} style={cell(false)}>{s.points.find((p) => p.day === day)?.value ?? '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <div style={{ fontSize: '11px', color: 'rgba(var(--fg),0.4)', marginTop: '10px' }}>
            {tp('{count} daily readings so far. Risk is better when it falls; the other two are better when they rise.', { count: days })}
          </div>
        </>
      )}
    </div>
  )
}

const cell = (head: boolean): React.CSSProperties => ({
  textAlign: 'left',
  padding: '5px 12px 5px 0',
  borderBottom: '1px solid rgba(var(--fg),0.07)',
  color: head ? 'rgba(var(--fg),0.6)' : 'rgba(var(--fg),0.8)',
  fontWeight: head ? 700 : 400,
  whiteSpace: 'nowrap',
})
