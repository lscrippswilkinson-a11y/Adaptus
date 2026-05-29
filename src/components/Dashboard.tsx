import { useState } from 'react'
import { useApp } from '@/state/AppContext'
import { STAGES } from '@/data/stages'
import { LEVELS, getLvl, getNext } from '@/data/levels'
import { avgRisk, pct, riskColor, riskLabel, totalXp } from '@/lib/format'
import { emptyProject } from '@/data/seed'
import { XpBar } from '@/components/XpBar'
import { Wizard, type ProjectDraft } from '@/components/Wizard'

export function Dashboard() {
  const { state, dispatch } = useApp()
  const [wizardOpen, setWizardOpen] = useState(false)

  const xp = totalXp(state.projects)
  const curLv = getLvl(xp)
  const nextLv = getNext(xp)
  const completed = state.projects.filter((p) => p.completedStages.length === STAGES.length).length

  const createProject = (draft: ProjectDraft) => {
    const project = { ...emptyProject(), name: draft.name, type: draft.type, description: draft.description, targetDate: draft.targetDate }
    dispatch({ type: 'ADD_PROJECT', project })
  }

  const stats = [
    { label: 'Active Projects', value: state.projects.length, icon: '📋' },
    { label: 'Total XP', value: `${xp.toLocaleString()} XP`, icon: '⚡' },
    { label: 'Stages Done', value: state.projects.reduce((s, p) => s + p.completedStages.length, 0), icon: '✅' },
    { label: 'Completed', value: completed, icon: '🏆' },
  ]

  const active = state.projects.find((p) => p.completedStages.length < STAGES.length)
  const nextStage = active ? STAGES[active.currentStage] : null

  return (
    <div className="cq-root">
      {/* Header */}
      <div style={{ padding: '22px 34px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg,#5B86A3,#8FB3C7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>⚗️</div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px' }}>Adaptus</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Guided Change Management</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setWizardOpen(true)}
          style={{ background: 'linear-gradient(135deg,#5B86A3,#3E6580)', border: 'none', borderRadius: '10px', padding: '10px 20px', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          + New Project
        </button>
      </div>

      <div style={{ padding: '28px 34px' }}>
        {/* Player card */}
        <div style={{ background: '#13132b', border: `1px solid ${curLv.border}`, borderRadius: '16px', padding: '22px 26px', marginBottom: '22px', display: 'flex', alignItems: 'center', gap: '22px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '14px', background: curLv.bg, border: `2px solid ${curLv.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', flexShrink: 0 }}>
            {curLv.badge}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: curLv.color }}>{curLv.title}</div>
              <div style={{ fontSize: '12px', background: curLv.bg, border: `1px solid ${curLv.border}`, color: curLv.color, borderRadius: '20px', padding: '3px 10px', fontWeight: 700 }}>Level {curLv.level}</div>
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '10px' }}>
              {nextLv ? `${xp.toLocaleString()} XP · ${(nextLv.xpNeeded - xp).toLocaleString()} XP to ${nextLv.title}` : `${xp.toLocaleString()} XP · Max level achieved!`}
            </div>
            <XpBar xp={xp} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', flexShrink: 0 }}>
            {[...LEVELS].reverse().map((lv) => (
              <div key={lv.level} style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: lv.level > curLv.level ? 0.25 : 1 }}>
                <span style={{ fontSize: '12px' }}>{lv.badge}</span>
                <div style={{ fontSize: '11px', color: lv.level === curLv.level ? lv.color : 'rgba(255,255,255,0.4)', fontWeight: lv.level === curLv.level ? 700 : 400 }}>{lv.title}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '22px' }}>
          {stats.map((s) => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px 18px' }}>
              <div style={{ fontSize: '18px', marginBottom: '6px' }}>{s.icon}</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '3px' }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>Your Projects</div>

        {state.projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 40px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🗺️</div>
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No projects yet</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '22px', fontSize: '14px' }}>Start your first guided change management journey.</div>
            <button type="button" onClick={() => setWizardOpen(true)} style={{ background: 'linear-gradient(135deg,#5B86A3,#3E6580)', border: 'none', borderRadius: '10px', padding: '12px 24px', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
              Create Your First Project →
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: '12px' }}>
            {state.projects.map((proj) => {
              const p2 = pct(proj)
              const avg = avgRisk(proj.stageData.risk.items)
              const cs = STAGES[proj.currentStage]
              return (
                <ProjectCard
                  key={proj.id}
                  name={proj.name}
                  type={proj.type}
                  xp={proj.totalXp}
                  p2={p2}
                  stageTag={`${cs.icon} ${cs.tag}`}
                  avg={avg}
                  completedCount={proj.completedStages.length}
                  onClick={() => dispatch({ type: 'OPEN_PROJECT', id: proj.id, stageIdx: proj.currentStage })}
                />
              )
            })}
          </div>
        )}

        {state.projects.length > 0 && (
          <div style={{ marginTop: '18px', background: 'rgba(91,134,163,0.08)', border: '1px solid rgba(91,134,163,0.2)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '22px' }}>💡</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#B8D0DE', marginBottom: '2px' }}>Next Best Action</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                {active && nextStage
                  ? `Continue "${active.name}" → ${nextStage.icon} ${nextStage.label} (Stage ${active.currentStage + 1})`
                  : 'All projects complete! Start a new change initiative.'}
              </div>
            </div>
          </div>
        )}
      </div>

      {wizardOpen && <Wizard onClose={() => setWizardOpen(false)} onCreate={createProject} />}
    </div>
  )
}

interface ProjectCardProps {
  name: string
  type: string
  xp: number
  p2: number
  stageTag: string
  avg: number | null
  completedCount: number
  onClick: () => void
}

function ProjectCard({ name, type, xp, p2, stageTag, avg, completedCount, onClick }: ProjectCardProps) {
  const [hover, setHover] = useState(false)
  const riskRgb = avg === null ? '' : avg <= 3 ? '34,197,94' : avg <= 6 ? '245,158,11' : '239,68,68'
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: '#13132b',
        border: `1px solid ${hover ? 'rgba(91,134,163,0.4)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '14px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        transform: hover ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '3px' }}>{name}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{type}</div>
        </div>
        <div style={{ background: 'rgba(240,82,61,0.15)', border: '1px solid rgba(240,82,61,0.3)', borderRadius: '20px', padding: '4px 10px', fontSize: '11px', color: '#F0523D', fontWeight: 600 }}>⚡ {xp} XP</div>
      </div>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Progress</span>
          <span style={{ fontSize: '11px', color: '#B8D0DE', fontWeight: 600 }}>{p2}%</span>
        </div>
        <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${p2}%`, background: 'linear-gradient(90deg,#5B86A3,#8FB3C7)', borderRadius: '2px' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '4px 9px', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{stageTag}</div>
        {avg !== null && (
          <div style={{ background: `rgba(${riskRgb},0.1)`, border: `1px solid rgba(${riskRgb},0.25)`, borderRadius: '8px', padding: '4px 9px', fontSize: '11px', color: riskColor(avg) }}>
            Risk: {riskLabel(avg)}
          </div>
        )}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '4px 9px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
          {completedCount}/{STAGES.length} stages
        </div>
      </div>
    </div>
  )
}
