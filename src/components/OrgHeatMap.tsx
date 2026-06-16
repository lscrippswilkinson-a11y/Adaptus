import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Flame, GitMerge, RotateCcw, Users } from 'lucide-react'
import type { Project } from '@/types'
import { buildHeatMap, looseKey, readinessBand, type HeatTeam, type LoadBand, type ReadinessBand } from '@/lib/heatmap'

/**
 * Organization-wide change heat map. All values come from `buildHeatMap` (one
 * source of truth on one absolute scale), so the gauges, stat cards and team
 * rows always agree. Similar group names can be combined for cleaner reporting;
 * the mapping is remembered locally.
 */

const ALIAS_KEY = 'adaptus.groupAliases'
// Semantic colour tokens, one meaning each.
//  • Load heat ramp: good green → caution amber → hot ORANGE (never the alarm
//    red, so red can't mean two things).
//  • Readiness: its own scale; "Low" is rose, distinct from load-orange.
//  • Alarm: pure red, reserved for genuine at-risk states only.
const LOAD_COLOR: Record<LoadBand, string> = { Light: '#22c55e', Moderate: '#f59e0b', Heavy: '#f97316' }
const READY_COLOR: Record<ReadinessBand, string> = { Strong: '#22c55e', Mixed: '#f59e0b', Low: '#fb7185' }
const IMPACT_COLOR = { High: '#fb923c', Medium: '#fcd34d', Low: 'rgba(var(--fg),0.5)' } as const
const ALARM = '#ef4444'
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))

/**
 * A 180° SVG arc gauge: value in the bowl, scale shown as "/ 100", and a
 * directional cue so the user can tell at a glance whether high is good or bad
 * (readiness: higher is better; load: lower is better).
 */
function Gauge({ value, color, label, band, goodWhenLow }: { value: number; color: string; label: string; band: string; goodWhenLow: boolean }) {
  const r = 58
  const cx = 72
  const cy = 72
  const len = Math.PI * r
  const off = len * (1 - clamp(value, 0, 100) / 100)
  const arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`
  return (
    <div style={{ textAlign: 'center', width: '150px', flexShrink: 0 }}>
      <svg width="150" height="80" viewBox="0 0 150 80" role="img" aria-label={`${label}: ${Math.round(value)} out of 100, ${band}, ${goodWhenLow ? 'lower is better' : 'higher is better'}`}>
        <path d={arc} transform="translate(3,0)" fill="none" stroke="rgba(var(--fg),0.1)" strokeWidth={12} strokeLinecap="round" />
        <path d={arc} transform="translate(3,0)" fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset 0.5s' }} />
        <text x={cx + 3} y={62} textAnchor="middle" style={{ fontSize: '26px', fontWeight: 800, fill: 'var(--text)' }}>{Math.round(value)}</text>
        <text x={cx + 3} y={76} textAnchor="middle" style={{ fontSize: '9px', fill: 'rgba(var(--fg),0.55)' }}>/ 100</text>
      </svg>
      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginTop: '-4px' }}>{label}</div>
      <div style={{ fontSize: '11px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{band}</div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: 'rgba(var(--fg),0.62)', marginTop: '1px' }}>
        {goodWhenLow ? <ArrowDown size={10} /> : <ArrowUp size={10} />} {goodWhenLow ? 'lower is better' : 'higher is better'}
      </div>
    </div>
  )
}

/** A compact KPI tile for the heat-map header. */
function Stat({ value, label, color }: { value: string | number; label: string; color?: string }) {
  return (
    <div style={{ background: 'rgba(var(--fg),0.03)', border: '1px solid rgba(var(--fg),0.07)', borderRadius: '12px', padding: '14px 16px' }}>
      <div style={{ fontSize: '24px', fontWeight: 800, color: color ?? 'var(--text)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '11px', color: 'rgba(var(--fg),0.62)', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: '6px' }}>{label}</div>
    </div>
  )
}

export function OrgHeatMap({ projects }: { projects: Project[] }) {
  const [aliases, setAliases] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem(ALIAS_KEY) || '{}')
    } catch {
      return {}
    }
  })
  const [expanded, setExpanded] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      localStorage.setItem(ALIAS_KEY, JSON.stringify(aliases))
    } catch {
      /* ignore storage failures */
    }
  }, [aliases])

  const { teams, summary } = useMemo(() => buildHeatMap(projects, aliases), [projects, aliases])

  // Suggested combines: distinct teams that collapse to the same loose key.
  const suggestions = useMemo(() => {
    const byLoose = new Map<string, HeatTeam[]>()
    for (const t of teams) {
      const lk = looseKey(t.name)
      if (!lk) continue
      const arr = byLoose.get(lk) ?? []
      arr.push(t)
      byLoose.set(lk, arr)
    }
    return [...byLoose.values()].filter((arr) => arr.length > 1).slice(0, 3)
  }, [teams])

  const combine = (keys: string[]) => {
    if (keys.length < 2) return
    const ordered = teams.filter((t) => keys.includes(t.key)).sort((a, b) => b.loadScore - a.loadScore)
    const target = ordered[0].key
    setAliases((prev) => {
      const next = { ...prev }
      for (const k of keys) if (k !== target) next[k] = target
      return next
    })
    setSelected(new Set())
  }

  const toggleSelect = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  if (teams.length === 0) return null

  const hasCombines = Object.keys(aliases).length > 0
  const fmtPeople = summary.peopleAffected >= 1000 ? `${(summary.peopleAffected / 1000).toFixed(1)}k` : String(summary.peopleAffected)

  return (
    <div className="cq-card" style={{ marginTop: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <Flame size={17} color="#f59e0b" />
        <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>Organization change heat map</span>
      </div>
      <div style={{ fontSize: '12px', color: 'rgba(var(--fg),0.62)', marginBottom: '18px', lineHeight: 1.5 }}>
        Which teams are absorbing the most change across all your initiatives. Higher load = more concurrent change, watch for fatigue.
      </div>

      {/* Gauges + KPI tiles */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', alignItems: 'center', marginBottom: '22px', paddingBottom: '20px', borderBottom: '1px solid rgba(var(--fg),0.07)' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <Gauge value={summary.orgLoad} color={LOAD_COLOR[summary.orgBand]} label="Change load" band={summary.orgBand} goodWhenLow />
          <Gauge value={summary.avgReadiness} color={READY_COLOR[readinessBand(summary.avgReadiness)]} label="Avg readiness" band={readinessBand(summary.avgReadiness)} goodWhenLow={false} />
        </div>
        <div style={{ flex: 1, minWidth: '260px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <Stat value={summary.teamsImpacted} label="Teams impacted" />
          <Stat value={summary.initiatives} label="Active initiatives" />
          <Stat value={`~${fmtPeople}`} label="People affected" />
          <Stat value={summary.teamsAtRisk} label="Teams at risk" color={summary.teamsAtRisk > 0 ? ALARM : undefined} />
        </div>
      </div>

      {/* Suggested combines */}
      {suggestions.map((cluster, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(91,134,163,0.08)', border: '1px solid rgba(91,134,163,0.2)', borderRadius: '10px', padding: '10px 14px', marginBottom: '10px' }}>
          <GitMerge size={15} color="var(--accent-text)" style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: '12.5px', color: 'rgba(var(--fg),0.7)', lineHeight: 1.5 }}>
            These look like the same team: {cluster.map((t) => `“${t.name}”`).join(', ')}
          </span>
          <button type="button" onClick={() => combine(cluster.map((t) => t.key))} style={combineBtn}>Combine</button>
        </div>
      ))}

      {/* Manual combine bar, appears on the first tick so the checkboxes
          explain themselves. */}
      {selected.size >= 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(91,134,163,0.12)', border: '1px solid rgba(91,134,163,0.3)', borderRadius: '10px', padding: '10px 14px', marginBottom: '10px' }}>
          <span style={{ flex: 1, fontSize: '12.5px', color: 'var(--accent-text)', fontWeight: 600 }}>
            {selected.size === 1 ? 'Tick another team to combine it with this one' : `${selected.size} teams selected`}
          </span>
          {selected.size >= 2 && <button type="button" onClick={() => combine([...selected])} style={combineBtn}>Combine selected</button>}
          <button type="button" onClick={() => setSelected(new Set())} style={{ ...combineBtn, background: 'transparent', color: 'rgba(var(--fg),0.5)', border: '1px solid rgba(var(--fg),0.15)' }}>Clear</button>
        </div>
      )}

      {/* Rows */}
      {teams.length > 1 && selected.size === 0 && (
        <div style={{ fontSize: '11px', color: 'rgba(var(--fg),0.45)', marginBottom: '8px' }}>
          Tip: tick teams that are the same to combine duplicate names.
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {teams.map((t) => {
          const isOpen = expanded === t.key
          const isSel = selected.has(t.key)
          const borderColor = isSel ? 'rgba(91,134,163,0.45)' : t.isAtRisk ? 'rgba(239,68,68,0.4)' : 'rgba(var(--fg),0.07)'
          return (
            <div key={t.key} style={{ border: `1px solid ${borderColor}`, borderLeft: t.isAtRisk ? `3px solid ${ALARM}` : `1px solid ${borderColor}`, borderRadius: '10px', background: 'rgba(var(--fg),0.02)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px' }}>
                <input type="checkbox" checked={isSel} onChange={() => toggleSelect(t.key)} aria-label={`Select ${t.name}`} style={{ flexShrink: 0, cursor: 'pointer', accentColor: '#5B86A3' }} />
                <button type="button" onClick={() => setExpanded(isOpen ? null : t.key)} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0, textAlign: 'left' }}>
                  {isOpen ? <ChevronDown size={14} color="rgba(var(--fg),0.4)" /> : <ChevronRight size={14} color="rgba(var(--fg),0.4)" />}
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                      {t.isAtRisk && <span style={{ flexShrink: 0, fontSize: '9.5px', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', color: ALARM, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '5px', padding: '1px 6px' }}>At risk</span>}
                    </span>
                    <span style={{ display: 'block', fontSize: '11px', color: 'rgba(var(--fg),0.62)', marginTop: '1px' }}>
                      {t.initiativeCount} initiative{t.initiativeCount === 1 ? '' : 's'}{t.peopleCount > 0 ? ` · ~${t.peopleCount} people` : ''}
                    </span>
                  </span>
                </button>
                <span style={{ fontSize: '11px', fontWeight: 600, color: READY_COLOR[t.readinessBand], flexShrink: 0 }}>{t.readinessBand} readiness</span>
                {/* Heat meter (absolute 0–100) */}
                <div style={{ width: '110px', flexShrink: 0 }}>
                  <div style={{ height: '8px', background: 'rgba(var(--fg),0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${t.loadScore}%`, background: LOAD_COLOR[t.band], borderRadius: '4px', transition: 'width 0.4s' }} />
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: LOAD_COLOR[t.band], textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '3px', textAlign: 'right' }}>{t.band} load</div>
                </div>
              </div>
              {isOpen && (
                <div style={{ borderTop: '1px solid rgba(var(--fg),0.06)', padding: '8px 12px 10px 38px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {t.rows.map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'rgba(var(--fg),0.65)' }}>
                      <Users size={12} style={{ flexShrink: 0, opacity: 0.6 }} />
                      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.project}</span>
                      <span style={{ flexShrink: 0, color: IMPACT_COLOR[r.impact] }}>{r.impact} impact</span>
                      <span style={{ flexShrink: 0, color: 'rgba(var(--fg),0.5)' }}>{r.readiness} ready</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {hasCombines && (
        <button type="button" onClick={() => setAliases({})} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px', background: 'none', border: 'none', color: 'rgba(var(--fg),0.45)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
          <RotateCcw size={13} /> Reset combinations
        </button>
      )}
    </div>
  )
}

const combineBtn: React.CSSProperties = {
  flexShrink: 0,
  background: 'linear-gradient(135deg,#5B86A3,#3E6580)',
  border: 'none',
  borderRadius: '8px',
  padding: '6px 14px',
  color: 'var(--on-accent)',
  fontWeight: 700,
  fontSize: '12px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}
