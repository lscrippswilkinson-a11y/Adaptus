import { useRef, useState } from 'react'
import { useApp } from '@/state/AppContext'
import { ESSENTIAL_COUNT, STAGES } from '@/data/stages'
import { avgRisk, essentialsDone, isComplete, pct, riskColor, riskLabel } from '@/lib/format'
import { parseImportedProjects, projectsToJson } from '@/lib/storage'
import { emptyProject } from '@/data/seed'
import { Wizard, type ProjectDraft } from '@/components/Wizard'
import { EditProjectModal } from '@/components/EditProjectModal'
import type { Project } from '@/types'

const ghostBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '10px',
  padding: '10px 14px',
  color: 'rgba(255,255,255,0.7)',
  fontWeight: 600,
  fontSize: '13px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

export function Dashboard() {
  const { state, dispatch } = useApp()
  const [wizardOpen, setWizardOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)

  const completed = state.projects.filter(isComplete).length
  const total = state.projects.length

  const createProject = (draft: ProjectDraft) => {
    const project = { ...emptyProject(), name: draft.name, type: draft.type, description: draft.description, targetDate: draft.targetDate }
    dispatch({ type: 'ADD_PROJECT', project })
  }

  const deleteProject = (proj: Project) => {
    if (confirm(`Delete "${proj.name}"? This permanently removes the project and all its planning. This can't be undone.`)) {
      dispatch({ type: 'DELETE_PROJECT', id: proj.id })
    }
  }

  // Backup (download) / restore (upload) all projects as a JSON file.
  const fileRef = useRef<HTMLInputElement>(null)
  const backup = () => {
    const blob = new Blob([projectsToJson(state.projects)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `adaptus-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  const restore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const projects = parseImportedProjects(String(reader.result))
      if (!projects) {
        alert('That doesn’t look like a valid Adaptus backup file.')
        return
      }
      if (confirm(`Restore ${projects.length} project${projects.length === 1 ? '' : 's'} from this backup? This replaces your current projects.`)) {
        dispatch({ type: 'SET_PROJECTS', projects })
      }
    }
    reader.readAsText(file)
  }

  const howItWorks = [
    { icon: '🗺️', title: '1. Plan', desc: 'Define the change, line up your sponsor, and get the right people on board.' },
    { icon: '🚀', title: '2. Prepare to launch', desc: 'Turn the plan into a checklist and track your readiness to go live.' },
    { icon: '📈', title: '3. Post-launch', desc: 'Measure how it’s landing and print a report on how the launch went.' },
  ]

  const active = state.projects.find((p) => !isComplete(p))
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {state.projects.length > 0 && (
            <button type="button" onClick={backup} style={ghostBtn} title="Download a backup file of all your projects">
              ⤓ Back up
            </button>
          )}
          <button type="button" onClick={() => fileRef.current?.click()} style={ghostBtn} title="Restore projects from a backup file">
            ⤒ Restore
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={restore} />
          <button
            type="button"
            onClick={() => setWizardOpen(true)}
            style={{ background: 'linear-gradient(135deg,#5B86A3,#3E6580)', border: 'none', borderRadius: '10px', padding: '10px 20px', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            + New Project
          </button>
        </div>
      </div>

      <div style={{ padding: '28px 34px' }}>
        {/* Welcome hero */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', background: 'linear-gradient(135deg, rgba(91,134,163,0.18), rgba(62,101,128,0.06))', border: '1px solid rgba(91,134,163,0.25)', borderRadius: '16px', padding: '28px 30px', marginBottom: '26px' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>Lead your change with confidence</h1>
            <p style={{ margin: '10px 0 18px', fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, maxWidth: '580px' }}>
              Adaptus walks you through rolling out a change from start to finish — planning it, getting everyone ready,
              launching, and making it stick. No change-management experience required.
            </p>
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              style={{ background: 'linear-gradient(135deg,#5B86A3,#3E6580)', border: 'none', borderRadius: '10px', padding: '11px 22px', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {total === 0 ? 'Start your first project →' : '+ Start a new project'}
            </button>
          </div>
          <div style={{ fontSize: '76px', flexShrink: 0, lineHeight: 1 }}>⚗️</div>
        </div>

        {/* How it works */}
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '12px' }}>How it works</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: '12px', marginBottom: '30px' }}>
          {howItWorks.map((h) => (
            <div key={h.title} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '18px 20px' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>{h.icon}</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '5px' }}>{h.title}</div>
              <div style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.55 }}>{h.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '14px' }}>
          <span style={{ fontSize: '16px', fontWeight: 700 }}>Your Projects</span>
          {total > 0 && (
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
              {total} project{total === 1 ? '' : 's'} · {completed} complete
            </span>
          )}
        </div>

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
              const cs = STAGES[proj.currentStage]
              return (
                <ProjectCard
                  key={proj.id}
                  name={proj.name}
                  type={proj.type}
                  p2={pct(proj)}
                  stageTag={`${cs.icon} ${cs.tag}`}
                  avg={avgRisk(proj.stageData.risk.items)}
                  coreDone={essentialsDone(proj)}
                  complete={isComplete(proj)}
                  onClick={() => dispatch({ type: 'OPEN_PROJECT', id: proj.id, stageIdx: proj.currentStage })}
                  onEdit={() => setEditing(proj)}
                  onDelete={() => deleteProject(proj)}
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
                  ? `Continue "${active.name}" → ${nextStage.icon} ${nextStage.label}`
                  : 'All projects complete! Start a new change initiative.'}
              </div>
            </div>
          </div>
        )}
      </div>

      {wizardOpen && <Wizard onClose={() => setWizardOpen(false)} onCreate={createProject} />}
      {editing && (
        <EditProjectModal
          project={editing}
          onClose={() => setEditing(null)}
          onSave={(updated) => {
            dispatch({ type: 'UPDATE_PROJECT', project: updated })
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

interface ProjectCardProps {
  name: string
  type: string
  p2: number
  stageTag: string
  avg: number | null
  coreDone: number
  complete: boolean
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
}

const cardIconBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '7px',
  width: '26px',
  height: '26px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  lineHeight: 1,
}

function ProjectCard({ name, type, p2, stageTag, avg, coreDone, complete, onClick, onEdit, onDelete }: ProjectCardProps) {
  const [hover, setHover] = useState(false)
  // Buttons sit inside the clickable card, so stop the click from opening it.
  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation()
    fn()
  }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {complete && (
            <div style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '20px', padding: '4px 10px', fontSize: '11px', color: '#86efac', fontWeight: 600 }}>✓ Complete</div>
          )}
          {hover && (
            <>
              <button type="button" style={cardIconBtn} title="Edit project details" aria-label="Edit project details" onClick={stop(onEdit)}>✎</button>
              <button type="button" style={{ ...cardIconBtn, color: '#fca5a5' }} title="Delete project" aria-label="Delete project" onClick={stop(onDelete)}>🗑</button>
            </>
          )}
        </div>
      </div>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Core progress</span>
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
          {coreDone}/{ESSENTIAL_COUNT} core steps
        </div>
      </div>
    </div>
  )
}
