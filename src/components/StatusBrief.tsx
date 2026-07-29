import type { Project } from '@/types'
import { avgRisk, buildTimeline, collectLaunchTasks, preparedness, riskColor, riskLabel, type PrepTask } from '@/lib/format'
import { alpha, brandOf, brandVars, shade } from '@/lib/brand'
import { getLang, htmlLang, t, tp } from '@/i18n'
import { TSplit } from '@/i18n/TSplit'

// Friendlier labels for a couple of task groups on the exec-facing brief. The
// keys are the canonical English group names the data layer emits.
const GROUP_LABELS: Record<string, string> = { 'Launch readiness': 'Go-live checklist', 'Your tasks': 'Additional tasks', 'Stakeholders': 'Key people', 'Resistance': 'Pushback', 'Dependencies': 'Things you’re waiting on', 'Impacted groups': 'Who’s affected', 'Sponsor commitments': 'Backer commitments' }
const groupLabel = (g: string) => t(GROUP_LABELS[g] ?? g)

/**
 * The forwardable artifact: a forward-looking, exec-shaped status brief derived
 * from a project's stage data. Structured around the four questions a busy
 * leader scans for: Are we on track? What could go wrong? Who's on board? What
 * do you need from me? plus an adoption snapshot. Rendered both in the in-app
 * share preview and on the public, no-login share page (`publicView`).
 */

const longDate = (d: Date) => d.toLocaleDateString(htmlLang(getLang()), { month: 'long', day: 'numeric', year: 'numeric' })
const shortDate = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString(htmlLang(getLang()), { month: 'short', day: 'numeric' })
const prepColor = (p: number) => (p >= 80 ? '#22c55e' : p >= 50 ? '#f59e0b' : '#ef4444')
const statusWord = (p: number) => (p >= 80 ? t('On track') : p >= 50 ? t('At risk') : t('Needs attention'))

/** Normalise a risk item's likelihood × impact (each 1–3) to a 1–10 score. */
const itemScore = (likelihood: number, impact: number) => Math.round((likelihood * impact) / 9 * 10 * 10) / 10
const sevClass = (score: number) => (score <= 3 ? 'g' : score <= 6 ? 'a' : 'r')

export function StatusBrief({ project, publicView = false }: { project: Project; publicView?: boolean }) {
  const sd = project.stageData
  const prep = preparedness(project)
  const avg = avgRisk(sd.risk.items)
  // The user's own logo + colour, or the Adaptus default when unbranded.
  const brand = brandOf(project)

  const goLive = sd.milestones.goLiveDate
    ? new Date(sd.milestones.goLiveDate + 'T00:00:00').toLocaleDateString(htmlLang(getLang()), { month: 'short', day: 'numeric', year: 'numeric' })
    : project.targetDate || '-'

  const topRisks = sd.risk.items
    .filter((r) => r.description.trim())
    .map((r) => ({ ...r, score: itemScore(r.likelihood, r.impact) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  const named = sd.stakeholders.rows.filter((r) => r.name.trim())
  const advocates = named.filter((r) => r.support === 'Advocate').length
  const resistant = named.filter((r) => r.support === 'Resistant').length

  const metrics = sd.adoption.metrics.filter((m) => m.name.trim())
  const ask = sd.executive.ask?.trim()
  // White-label: when on, the brief carries no "Adaptus" mark and no CTA.
  const branded = !sd.executive.hideBranding

  // Outstanding launch tasks, grouped by category (same source the Launch
  // Preparation dashboard uses), so the brief shows what's still left to do.
  const openTasks = collectLaunchTasks(project).filter((t) => !t.done)
  const openByGroup = openTasks.reduce<{ group: string; items: PrepTask[] }[]>((acc, t) => {
    const g = acc.find((x) => x.group === t.group) ?? (acc.push({ group: t.group, items: [] }), acc[acc.length - 1])
    g.items.push(t)
    return acc
  }, [])

  // The full launch timeline (dated tasks + go-live + post-launch reviews), the
  // same builder the dashboard uses.
  const timeline = buildTimeline(project)

  return (
    <div className="brief-wrap" style={brandVars(brand)}>
      <div
        className="brief-hdr"
        style={{
          background: `radial-gradient(130% 150% at 88% -25%, ${alpha(brand.fg, 0.2)}, ${alpha(brand.fg, 0)} 55%), linear-gradient(135deg, ${shade(brand.color, 0.16)} 0%, ${shade(brand.color, -0.15)} 58%, ${shade(brand.color, -0.35)} 100%)`,
        }}
      >
        {/* The user's own logo takes the header mark; the Adaptus one only shows
            when they haven't uploaded theirs (and haven't white-labelled). */}
        {brand.logo ? (
          <img className="brief-logo" src={brand.logo} alt="" />
        ) : (
          branded && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '12px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--brand-fg, #fff)', marginBottom: '14px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '6px', background: 'var(--brand-fg-15)', border: '1px solid var(--brand-fg-25)', fontSize: '12px' }}>✦</span>
              Adaptus
            </div>
          )
        )}
        <div className="brief-badge">
          {statusWord(prep.pct)} · {tp('{pct}% ready', { pct: prep.pct })}
        </div>
        <h1>{project.name || t('Change project')}</h1>
        <div className="bm">{project.type ? t(project.type) : t('Change project')} · {t('Status Brief')} · {longDate(new Date())}</div>
      </div>

      <div className="brief-body">
        {/* 1: Are we on track? */}
        <div className="bs bs-wide">
          <div className="bst">{t('Are we on track?')}</div>
          <div className="bsg">
            <div className="bsc"><div className="v" style={{ color: prepColor(prep.pct) }}>{prep.pct}%</div><div className="l">{t('Launch ready')}</div></div>
            <div className="bsc"><div className="v">{goLive}</div><div className="l">{t('Go-live')}</div></div>
            <div className="bsc"><div className="v">{prep.total ? `${prep.done}/${prep.total}` : '-'}</div><div className="l">{t('Steps complete')}</div></div>
          </div>
        </div>

        {/* 2: What's still left to do? (mirrors the launch-prep task list) */}
        <div className="bs">
          <div className="bst">{t('What’s left before launch')}</div>
          {prep.total === 0 ? (
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>{t('Launch tasks haven’t been mapped yet.')}</div>
          ) : openByGroup.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#86efac', fontWeight: 600 }}>{tp('✓ All {total} tasks complete — ready to launch.', { total: prep.total })}</div>
          ) : (
            openByGroup.map(({ group, items }) => (
              <div key={group} style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#B8D0DE', marginBottom: '8px' }}>
                  {groupLabel(group)} <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>· {tp('{count} left', { count: items.length })}</span>
                </div>
                {items.slice(0, 6).map((task) => (
                  <div key={task.key} className="bai">
                    {/* A bullet, not a checkbox: the brief is read-only, and an
                        empty tick-box invites a recipient to check something
                        they can't. */}
                    <div className="bad" style={{ background: 'rgba(255,255,255,0.35)' }} />
                    <div style={{ flex: 1 }}>
                      <div>{task.label}</div>
                      {(task.owner || task.due) && (
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', marginTop: '3px' }}>
                          {task.owner ? tp('Owner: {owner}', { owner: task.owner }) : ''}{task.owner && task.due ? '  ·  ' : ''}{task.due ? tp('Due {date}', { date: shortDate(task.due) }) : ''}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {items.length > 6 && (
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginLeft: '16px', marginTop: '2px' }}>{tp('+{count} more', { count: items.length - 6 })}</div>
                )}
              </div>
            ))
          )}
        </div>

        {/* 2b: Actions with due dates, in chronological order — the launch timeline. */}
        {/* The launch timeline: every dated item, the go-live, and the reviews
            that follow it. Not truncated, this is the plan the recipient is
            being asked to act on, and it's the same timeline the dashboard shows. */}
        {timeline.length > 0 && (
          <div className="bs">
            <div className="bst">{t('Timeline')}</div>
            {timeline.map((entry) => (
              <div key={entry.key} className="bai" style={entry.milestone ? { fontWeight: 700 } : undefined}>
                <div style={{ width: '52px', flexShrink: 0, fontSize: '12px', fontWeight: 700, color: 'var(--brand-soft, #B8D0DE)' }}>{shortDate(entry.date)}</div>
                <div style={{ flex: 1, opacity: entry.done ? 0.55 : 1 }}>
                  {entry.milestone ? '🚀 ' : ''}
                  <span style={{ textDecoration: entry.done ? 'line-through' : 'none' }}>{entry.label}</span>
                  {(entry.owner || entry.postLaunch) && (
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {entry.owner ? ` · ${entry.owner}` : ''}
                      {entry.postLaunch ? ' · after launch' : ''}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3: What could go wrong? */}
        <div className="bs">
          <div className="bst">{t('Top risks to watch')}</div>
          {/* A declared lack of executive sponsor is the single biggest predictor
              of failure, so it leads the list as a critical risk. */}
          {sd.sponsor.noSponsor && (
            <div className="bai">
              <div className="bad" style={{ background: '#ef4444' }} />
              <div style={{ flex: 1 }}>
                {t('No senior backer identified')}
                <span className="btag r" style={{ marginLeft: '8px' }}>{t('Critical')}</span>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '3px' }}>
                  {t('The top predictor of change failure — a senior leader needs to own this.')}
                </div>
              </div>
            </div>
          )}
          {topRisks.length ? (
            topRisks.map((r) => (
              <div key={r.id} className="bai">
                <div className="bad" style={{ background: riskColor(r.score) }} />
                <div style={{ flex: 1 }}>
                  {r.description}
                  <span className={`btag ${sevClass(r.score)}`} style={{ marginLeft: '8px' }}>{t(riskLabel(r.score))}</span>
                </div>
              </div>
            ))
          ) : !sd.sponsor.noSponsor ? (
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>{t('No risks logged yet.')}</div>
          ) : null}
        </div>

        {/* 3: Who's on board? */}
        <div className="bs">
          <div className="bst">{t('Who’s on board?')}</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.78)', lineHeight: 1.7 }}>
            {sd.sponsor.noSponsor ? (
              <span style={{ color: '#fca5a5', fontWeight: 600 }}>{t('⚠ No senior backer — flagged as a risk')}</span>
            ) : sd.sponsor.name ? (
              <TSplit
                source="Backer: {name}"
                slot="{name}"
                node={<><strong style={{ color: '#fff' }}>{sd.sponsor.name}</strong>{sd.sponsor.role ? ` (${sd.sponsor.role})` : ''}</>}
              />
            ) : (
              <span style={{ color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>{t('No backer named yet')}</span>
            )}
          </div>
          {named.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <span className="btag g">{tp('{count} on board', { count: advocates })}</span>
              {resistant > 0 && <span className="btag a">{tp('{count} to win over', { count: resistant })}</span>}
              <span className="btag b">{tp('{count} listed', { count: named.length })}</span>
            </div>
          )}
        </div>

        {/* 4: What do you need from me? (the reply hook) */}
        {(ask || !publicView) && (
          <div className="bs bs-wide">
            <div className="bst">{t('What I need from you')}</div>
            {ask ? (
              <div style={{ background: 'rgba(91,134,163,0.12)', borderLeft: '3px solid #5B86A3', borderRadius: '0 8px 8px 0', padding: '12px 16px', fontSize: '14px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                {ask}
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>
                {t('Add a clear ask, it’s the line that gets your backer to reply.')}
              </div>
            )}
          </div>
        )}

        {/* Adoption snapshot */}
        {metrics.length > 0 && (
          <div className="bs">
            <div className="bst">{t('Real use')}</div>
            {metrics.map((m) => {
              const c = parseFloat(m.current)
              const target = parseFloat(m.target)
              const has = isFinite(c) && isFinite(target) && target !== 0
              const p2 = has ? Math.min(100, Math.round((c / target) * 100)) : 0
              const status = p2 >= 80 ? { label: t('On track'), c: '#86efac' } : p2 >= 50 ? { label: t('Behind target'), c: '#fcd34d' } : { label: t('Well behind'), c: '#fca5a5' }
              const bar = p2 >= 80 ? '#22c55e' : p2 >= 50 ? '#f59e0b' : '#ef4444'
              return (
                <div key={m.id} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{m.name}</span>
                    <span style={{ fontSize: '13px', color: '#B8D0DE', fontWeight: 700 }}>{m.current ? `${m.current}${t(m.unit)} / ${m.target}${t(m.unit)}` : ''}</span>
                  </div>
                  {has && (
                    <>
                      <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${p2}%`, background: bar, borderRadius: '4px' }} />
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: status.c, marginTop: '4px' }}>{status.label}</div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {avg !== null && topRisks.length === 0 && (
          <div className="bs">
            <div className="bst">{t('Risk going in')}</div>
            <span className={`btag ${sevClass(avg)}`}>{tp('{level} risk · {score}/10', { level: t(riskLabel(avg)), score: avg })}</span>
          </div>
        )}
      </div>

      {/* Footer carries the branding + growth CTA; white-labeled briefs drop it
          entirely for public viewers, and keep only the date in owner preview. */}
      {!(publicView && !branded) && (
        <div className="brief-ft">
          {branded ? (
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
              <TSplit
                source="Generated from your {adaptus} change plan"
                slot="{adaptus}"
                node={<span style={{ color: '#B8D0DE' }}>Adaptus</span>}
              />
            </div>
          ) : (
            <span />
          )}
          {publicView ? (
            <a
              href="/"
              style={{ fontSize: '12px', fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#5B86A3,#3E6580)', borderRadius: '999px', padding: '7px 16px', textDecoration: 'none' }}
            >
              {t('Build your own change plan →')}
            </a>
          ) : (
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{longDate(new Date())}</div>
          )}
        </div>
      )}
    </div>
  )
}
