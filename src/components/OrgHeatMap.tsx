import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Flame, GitMerge, RotateCcw, Users } from 'lucide-react'
import type { Impact, Project, Readiness } from '@/types'

/**
 * Organization-wide change heat map. Aggregates the impacted groups from every
 * project to show which teams are absorbing the most change across all
 * initiatives — the "change load" that signals fatigue/risk. Because the same
 * team is often typed slightly differently across projects ("Sales" vs "Sales
 * Team"), users can combine similar names for cleaner reporting; the mapping is
 * remembered locally.
 */

const ALIAS_KEY = 'adaptus.groupAliases'
const IMPACT_W: Record<Impact, number> = { High: 3, Medium: 2, Low: 1 }
const READY_RANK: Record<Readiness, number> = { Low: 0, Medium: 1, High: 2 }
const READY_LABEL = ['Low', 'Medium', 'High']
const READY_COLOR = ['#ef4444', '#f59e0b', '#22c55e']

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
const loose = (s: string) => norm(s).replace(/[^a-z0-9]/g, '').replace(/(teams?|departments?|depts?|groups?|divisions?|orgs?)$/, '')
const heatColor = (ratio: number) => (ratio >= 0.66 ? '#ef4444' : ratio >= 0.33 ? '#f59e0b' : '#22c55e')

interface GroupAgg {
  key: string
  display: string
  initiatives: string[]
  people: number
  load: number
  readyWorst: number
  rows: { project: string; impact: Impact; readiness: Readiness; people: number }[]
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

  const resolve = useMemo(() => {
    return (n: string) => {
      let cur = n
      const seen = new Set<string>()
      while (aliases[cur] && !seen.has(cur)) {
        seen.add(cur)
        cur = aliases[cur]
      }
      return cur
    }
  }, [aliases])

  const groups = useMemo(() => {
    const map = new Map<string, GroupAgg & { rawCounts: Record<string, number> }>()
    for (const p of projects) {
      const pname = p.name || 'Untitled project'
      for (const g of p.stageData.groups.groups) {
        const name = g.name.trim()
        if (!name) continue
        const key = resolve(norm(name))
        let e = map.get(key)
        if (!e) {
          e = { key, display: name, initiatives: [], people: 0, load: 0, readyWorst: 2, rows: [], rawCounts: {} }
          map.set(key, e)
        }
        if (!e.initiatives.includes(pname)) e.initiatives.push(pname)
        const ppl = parseInt(String(g.size).replace(/[^0-9]/g, ''), 10) || 0
        e.people += ppl
        e.load += IMPACT_W[g.impact] ?? 2
        e.readyWorst = Math.min(e.readyWorst, READY_RANK[g.readiness] ?? 1)
        e.rawCounts[name] = (e.rawCounts[name] || 0) + 1
        e.rows.push({ project: pname, impact: g.impact, readiness: g.readiness, people: ppl })
      }
    }
    const list = [...map.values()].map((e) => {
      e.display = Object.entries(e.rawCounts).sort((a, b) => b[1] - a[1])[0][0]
      return e as GroupAgg
    })
    return list.sort((a, b) => b.load - a.load || b.initiatives.length - a.initiatives.length)
  }, [projects, resolve])

  const maxLoad = Math.max(1, ...groups.map((g) => g.load))

  // Suggested combines: distinct groups that collapse to the same loose key.
  const suggestions = useMemo(() => {
    const byLoose = new Map<string, GroupAgg[]>()
    for (const g of groups) {
      const lk = loose(g.display)
      if (!lk) continue
      const arr = byLoose.get(lk) ?? []
      arr.push(g)
      byLoose.set(lk, arr)
    }
    return [...byLoose.values()].filter((arr) => arr.length > 1).slice(0, 3)
  }, [groups])

  const combine = (keys: string[]) => {
    if (keys.length < 2) return
    // Merge into the highest-load group (first, since `groups` is load-sorted).
    const ordered = groups.filter((g) => keys.includes(g.key)).sort((a, b) => b.load - a.load)
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

  if (groups.length === 0) return null

  const hasCombines = Object.keys(aliases).length > 0

  return (
    <div className="cq-card" style={{ marginTop: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <Flame size={17} color="#f59e0b" />
        <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>Organization change heat map</span>
      </div>
      <div style={{ fontSize: '12px', color: 'rgba(var(--fg),0.5)', marginBottom: '16px', lineHeight: 1.5 }}>
        Which teams are absorbing the most change across all your initiatives. Higher load = more concurrent change — watch for fatigue.
      </div>

      {/* Suggested combines */}
      {suggestions.map((cluster, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(91,134,163,0.08)', border: '1px solid rgba(91,134,163,0.2)', borderRadius: '10px', padding: '10px 14px', marginBottom: '10px' }}>
          <GitMerge size={15} color="var(--accent-text)" style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: '12.5px', color: 'rgba(var(--fg),0.7)', lineHeight: 1.5 }}>
            These look like the same team: {cluster.map((g) => `“${g.display}”`).join(', ')}
          </span>
          <button type="button" onClick={() => combine(cluster.map((g) => g.key))} style={combineBtn}>Combine</button>
        </div>
      ))}

      {/* Manual combine bar */}
      {selected.size >= 2 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(91,134,163,0.12)', border: '1px solid rgba(91,134,163,0.3)', borderRadius: '10px', padding: '10px 14px', marginBottom: '10px' }}>
          <span style={{ flex: 1, fontSize: '12.5px', color: 'var(--accent-text)', fontWeight: 600 }}>{selected.size} groups selected</span>
          <button type="button" onClick={() => combine([...selected])} style={combineBtn}>Combine selected</button>
          <button type="button" onClick={() => setSelected(new Set())} style={{ ...combineBtn, background: 'transparent', color: 'rgba(var(--fg),0.5)', border: '1px solid rgba(var(--fg),0.15)' }}>Clear</button>
        </div>
      )}

      {/* Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {groups.map((g) => {
          const ratio = g.load / maxLoad
          const isOpen = expanded === g.key
          const isSel = selected.has(g.key)
          return (
            <div key={g.key} style={{ border: `1px solid ${isSel ? 'rgba(91,134,163,0.45)' : 'rgba(var(--fg),0.07)'}`, borderRadius: '10px', background: 'rgba(var(--fg),0.02)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px' }}>
                <input type="checkbox" checked={isSel} onChange={() => toggleSelect(g.key)} aria-label={`Select ${g.display}`} style={{ flexShrink: 0, cursor: 'pointer', accentColor: '#5B86A3' }} />
                <button type="button" onClick={() => setExpanded(isOpen ? null : g.key)} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0, textAlign: 'left' }}>
                  {isOpen ? <ChevronDown size={14} color="rgba(var(--fg),0.4)" /> : <ChevronRight size={14} color="rgba(var(--fg),0.4)" />}
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.display}</span>
                    <span style={{ display: 'block', fontSize: '11px', color: 'rgba(var(--fg),0.5)', marginTop: '1px' }}>
                      {g.initiatives.length} initiative{g.initiatives.length === 1 ? '' : 's'}{g.people > 0 ? ` · ~${g.people} people` : ''}
                    </span>
                  </span>
                </button>
                <span style={{ fontSize: '11px', fontWeight: 600, color: READY_COLOR[g.readyWorst], flexShrink: 0 }}>{READY_LABEL[g.readyWorst]} readiness</span>
                {/* Heat bar */}
                <div style={{ width: '110px', flexShrink: 0 }}>
                  <div style={{ height: '8px', background: 'rgba(var(--fg),0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.round(ratio * 100)}%`, background: heatColor(ratio), borderRadius: '4px' }} />
                  </div>
                </div>
              </div>
              {isOpen && (
                <div style={{ borderTop: '1px solid rgba(var(--fg),0.06)', padding: '8px 12px 10px 38px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {g.rows.map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'rgba(var(--fg),0.65)' }}>
                      <Users size={12} style={{ flexShrink: 0, opacity: 0.6 }} />
                      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.project}</span>
                      <span style={{ flexShrink: 0, color: r.impact === 'High' ? '#fca5a5' : r.impact === 'Medium' ? '#fcd34d' : 'rgba(var(--fg),0.5)' }}>{r.impact} impact</span>
                      <span style={{ flexShrink: 0, color: READY_COLOR[READY_RANK[r.readiness]] }}>{r.readiness} ready</span>
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
