import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Check,
  Download,
  FlaskConical,
  Lightbulb,
  Map,
  Pencil,
  Plus,
  RotateCcw,
  Rocket,
  Search,
  Sparkles,
  TrendingUp,
  Trash2,
  Upload,
  type LucideIcon,
} from 'lucide-react'
import { useApp } from '@/state/AppContext'
import { ESSENTIAL_COUNT, STAGES } from '@/data/stages'
import { avgRisk, essentialsDone, isComplete, pct, riskColor, riskLabel } from '@/lib/format'
import { parseImportedProjects, projectsToJson } from '@/lib/storage'
import { createSeed, emptyProject } from '@/data/seed'
import { uid } from '@/lib/id'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Wizard, type ProjectDraft } from '@/components/Wizard'
import { EditProjectModal } from '@/components/EditProjectModal'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { Project } from '@/types'

type SortKey = 'recent' | 'progress' | 'name'

const ghostBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '7px',
  background: 'rgba(var(--fg),0.04)',
  border: '1px solid rgba(var(--fg),0.12)',
  borderRadius: '10px',
  padding: '10px 14px',
  color: 'rgba(var(--fg),0.7)',
  fontWeight: 600,
  fontSize: '13px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '7px',
  background: 'linear-gradient(135deg,#5B86A3,#3E6580)',
  border: 'none',
  borderRadius: '10px',
  padding: '10px 20px',
  color: 'var(--on-accent)',
  fontWeight: 700,
  fontSize: '14px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

export function Dashboard() {
  const { state, dispatch } = useApp()
  const [wizardOpen, setWizardOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('recent')
  // Soft delete: removed projects can be restored from the undo toast for a few seconds.
  const [deleted, setDeleted] = useState<{ snapshot: Project[]; name: string } | null>(null)
  const undoTimer = useRef<number | null>(null)
  const narrow = useMediaQuery('(max-width: 720px)')

  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current) }, [])

  const completed = state.projects.filter(isComplete).length
  const total = state.projects.length

  const createProject = (draft: ProjectDraft) => {
    const project = { ...emptyProject(), name: draft.name, type: draft.type, description: draft.description, targetDate: draft.targetDate }
    dispatch({ type: 'ADD_PROJECT', project })
  }

  // Add the pre-filled demo without navigating into it, so it lands in the list.
  const loadExample = () => dispatch({ type: 'SET_PROJECTS', projects: [...state.projects, { ...createSeed(), id: uid() }] })

  const deleteProject = (proj: Project) => {
    const snapshot = state.projects
    dispatch({ type: 'DELETE_PROJECT', id: proj.id })
    setDeleted({ snapshot, name: proj.name })
    if (undoTimer.current) clearTimeout(undoTimer.current)
    undoTimer.current = window.setTimeout(() => setDeleted(null), 6000)
  }

  const undoDelete = () => {
    if (deleted) dispatch({ type: 'SET_PROJECTS', projects: deleted.snapshot })
    setDeleted(null)
    if (undoTimer.current) clearTimeout(undoTimer.current)
  }

  // Filtered + sorted view of the projects for the grid.
  const visible = state.projects
    .filter((p) => {
      const q = query.trim().toLowerCase()
      return !q || p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name)
      if (sortKey === 'progress') return pct(b) - pct(a)
      return b.createdAt.localeCompare(a.createdAt) // recent first
    })

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

  const howItWorks: { icon: LucideIcon; title: string; desc: string }[] = [
    { icon: Map, title: '1. Plan', desc: 'Define the change, line up your sponsor, and get the right people on board.' },
    { icon: Rocket, title: '2. Prepare to launch', desc: 'Turn the plan into a checklist and track your readiness to go live.' },
    { icon: TrendingUp, title: '3. Post-launch', desc: 'Measure how it’s landing and print a report on how the launch went.' },
  ]

  const active = state.projects.find((p) => !isComplete(p))
  const nextStage = active ? STAGES[active.currentStage] : null

  return (
    <div className="cq-root">
      {/* Header */}
      <div style={{ padding: '22px 34px', borderBottom: '1px solid rgba(var(--fg),0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg,#5B86A3,#8FB3C7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FlaskConical size={20} color="var(--on-accent)" /></div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px' }}>Adaptus</div>
            <div style={{ fontSize: '10px', color: 'rgba(var(--fg),0.35)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Guided Change Management</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ThemeToggle />
          {state.projects.length > 0 && (
            <button type="button" onClick={backup} style={ghostBtn} title="Download a backup file of all your projects">
              <Download size={15} /> Back up
            </button>
          )}
          <button type="button" onClick={() => fileRef.current?.click()} style={ghostBtn} title="Restore projects from a backup file">
            <Upload size={15} /> Restore
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={restore} />
          <button type="button" onClick={() => setWizardOpen(true)} style={primaryBtn}>
            <Plus size={16} /> New Project
          </button>
        </div>
      </div>

      <div style={{ padding: '28px 34px' }}>
        {/* Welcome hero */}
        <div style={{ display: 'flex', alignItems: 'center', gap: narrow ? '0' : '32px', background: 'radial-gradient(620px 340px at 85% -20%, rgba(255,255,255,0.14), transparent 60%), linear-gradient(120deg, #3e6079 0%, #2c4a60 100%)', borderRadius: '18px', padding: narrow ? '40px 26px' : '60px 48px', marginBottom: '26px', boxShadow: '0 12px 32px rgba(20,40,55,0.28)', overflow: 'hidden' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: narrow ? '27px' : '34px', fontWeight: 800, color: '#fff', lineHeight: 1.12, letterSpacing: '-0.6px' }}>Lead your change with confidence</h1>
            <p style={{ margin: '16px 0 26px', fontSize: '15px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.65, maxWidth: '600px' }}>
              Adaptus walks you through rolling out a change from start to finish — planning it, getting everyone ready,
              launching, and making it stick. No change-management experience required.
            </p>
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #2dd4bf 0%, #12b3a1 100%)', color: '#06302b', border: 'none', borderRadius: '10px', padding: '13px 24px', fontWeight: 700, fontSize: '14.5px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(18,179,161,0.4)' }}
            >
              {total === 0 ? (
                <>Start your first project <ArrowRight size={17} /></>
              ) : (
                <><Plus size={17} /> Start a new project</>
              )}
            </button>
          </div>
          {!narrow && <FlaskConical size={150} color="rgba(255,255,255,0.88)" strokeWidth={1.1} style={{ flexShrink: 0 }} />}
        </div>

        {/* How it works */}
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(var(--fg),0.45)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '12px' }}>How it works</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: '12px', marginBottom: '30px' }}>
          {howItWorks.map((h) => (
            <div key={h.title} style={{ background: 'var(--surface-1)', border: '1px solid var(--surface-1-border)', borderRadius: '12px', padding: '18px 20px', boxShadow: 'var(--box-shadow)' }}>
              <div style={{ marginBottom: '10px' }}><h.icon size={24} color="#8FB3C7" /></div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '5px' }}>{h.title}</div>
              <div style={{ fontSize: '12.5px', color: 'rgba(var(--fg),0.5)', lineHeight: 1.55 }}>{h.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700 }}>Your Projects</span>
            {total > 0 && (
              <span style={{ fontSize: '12px', color: 'rgba(var(--fg),0.5)' }}>
                {total} project{total === 1 ? '' : 's'} · {completed} complete
              </span>
            )}
          </div>
          {total > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', color: 'rgba(var(--fg),0.4)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search projects"
                  aria-label="Search projects"
                  style={{ background: 'rgba(var(--fg),0.05)', border: '1px solid rgba(var(--fg),0.12)', borderRadius: '10px', padding: '8px 12px 8px 30px', color: 'var(--text)', fontSize: '13px', outline: 'none', fontFamily: 'inherit', width: '180px' }}
                />
              </div>
              <select className="cq-select" value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} aria-label="Sort projects" style={{ width: 'auto', fontSize: '13px' }}>
                <option value="recent">Recent</option>
                <option value="progress">Progress</option>
                <option value="name">Name (A–Z)</option>
              </select>
            </div>
          )}
        </div>

        {total === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 40px', background: 'rgba(var(--fg),0.02)', border: '1px dashed rgba(var(--fg),0.1)', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}><Map size={44} color="#8FB3C7" strokeWidth={1.4} /></div>
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No projects yet</div>
            <div style={{ color: 'rgba(var(--fg),0.5)', marginBottom: '22px', fontSize: '14px' }}>Start your first guided change management journey — or explore a finished example first.</div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setWizardOpen(true)} style={{ ...primaryBtn, padding: '12px 24px' }}>
                Create your first project <ArrowRight size={16} />
              </button>
              <button type="button" onClick={loadExample} style={ghostBtn} title="Add a pre-filled sample project you can explore, then delete">
                <Sparkles size={16} /> Load an example
              </button>
            </div>
          </div>
        ) : visible.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 40px', color: 'rgba(var(--fg),0.5)', fontSize: '14px', background: 'rgba(var(--fg),0.02)', border: '1px dashed rgba(var(--fg),0.1)', borderRadius: '16px' }}>
            No projects match “{query}”.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: '12px' }}>
            {visible.map((proj) => {
              const cs = STAGES[proj.currentStage]
              return (
                <ProjectCard
                  key={proj.id}
                  name={proj.name}
                  type={proj.type}
                  p2={pct(proj)}
                  stageIcon={cs.icon}
                  stageTag={cs.tag}
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
            <Lightbulb size={22} color="var(--accent-text)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--accent-text)', marginBottom: '2px' }}>Next Best Action</div>
              <div style={{ color: 'rgba(var(--fg),0.6)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {active && nextStage ? (
                  <>
                    <span>Continue “{active.name}” →</span>
                    <nextStage.icon size={14} color="var(--accent-text)" />
                    <span>{nextStage.label}</span>
                  </>
                ) : (
                  'All projects complete! Start a new change initiative.'
                )}
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

      {deleted && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: 'var(--surface-card)',
            border: '1px solid var(--surface-1-border)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            zIndex: 200,
          }}
        >
          <span style={{ fontSize: '13px', color: 'var(--text)' }}>Deleted “{deleted.name}”</span>
          <button
            type="button"
            onClick={undoDelete}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--accent-text)', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <RotateCcw size={14} /> Undo
          </button>
        </div>
      )}
    </div>
  )
}

interface ProjectCardProps {
  name: string
  type: string
  p2: number
  stageIcon: LucideIcon
  stageTag: string
  avg: number | null
  coreDone: number
  complete: boolean
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
}

const cardIconBtn: React.CSSProperties = {
  background: 'rgba(var(--fg),0.06)',
  border: '1px solid rgba(var(--fg),0.12)',
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

function ProjectCard({ name, type, p2, stageIcon: StageIcon, stageTag, avg, coreDone, complete, onClick, onEdit, onDelete }: ProjectCardProps) {
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
        background: 'var(--surface-card)',
        border: `1px solid ${hover ? 'rgba(91,134,163,0.4)' : 'var(--surface-1-border)'}`,
        borderRadius: '14px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        transform: hover ? 'translateY(-2px)' : 'none',
        boxShadow: 'var(--box-shadow)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '3px' }}>{name}</div>
          <div style={{ fontSize: '11px', color: 'rgba(var(--fg),0.55)' }}>{type}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {complete && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '20px', padding: '4px 10px', fontSize: '11px', color: '#86efac', fontWeight: 600 }}><Check size={12} strokeWidth={3} /> Complete</div>
          )}
          {/* Always rendered so they're reachable on touch; emphasised on hover. */}
          <button type="button" style={{ ...cardIconBtn, opacity: hover ? 1 : 0.7 }} title="Edit project details" aria-label="Edit project details" onClick={stop(onEdit)}><Pencil size={13} /></button>
          <button type="button" style={{ ...cardIconBtn, color: '#fca5a5', opacity: hover ? 1 : 0.7 }} title="Delete project" aria-label="Delete project" onClick={stop(onDelete)}><Trash2 size={13} /></button>
        </div>
      </div>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px', color: 'rgba(var(--fg),0.4)' }}>Core progress</span>
          <span style={{ fontSize: '11px', color: 'var(--accent-text)', fontWeight: 600 }}>{p2}%</span>
        </div>
        <div style={{ height: '4px', background: 'rgba(var(--fg),0.08)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${p2}%`, background: 'linear-gradient(90deg,#5B86A3,#8FB3C7)', borderRadius: '2px' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(var(--fg),0.04)', border: '1px solid rgba(var(--fg),0.07)', borderRadius: '8px', padding: '4px 9px', fontSize: '11px', color: 'rgba(var(--fg),0.5)' }}><StageIcon size={12} /> {stageTag}</div>
        {avg !== null && (
          <div style={{ background: `rgba(${riskRgb},0.1)`, border: `1px solid rgba(${riskRgb},0.25)`, borderRadius: '8px', padding: '4px 9px', fontSize: '11px', color: riskColor(avg) }}>
            Risk: {riskLabel(avg)}
          </div>
        )}
        <div style={{ background: 'rgba(var(--fg),0.04)', border: '1px solid rgba(var(--fg),0.07)', borderRadius: '8px', padding: '4px 9px', fontSize: '11px', color: 'rgba(var(--fg),0.4)' }}>
          {coreDone}/{ESSENTIAL_COUNT} core steps
        </div>
      </div>
    </div>
  )
}
