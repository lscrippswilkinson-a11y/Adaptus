import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Check,
  FlaskConical,
  Lightbulb,
  LogOut,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { useApp } from '@/state/AppContext'
import { ESSENTIAL_COUNT, STAGES } from '@/data/stages'
import { avgRisk, essentialsDone, isComplete, pct, riskColor, riskLabel } from '@/lib/format'
import { emptyProject } from '@/data/seed'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { hasSupabase } from '@/lib/supabase'
import { useAuth } from '@/state/AuthContext'
import { Wizard, type ProjectDraft } from '@/components/Wizard'
import { EditProjectModal } from '@/components/EditProjectModal'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { Project, Role } from '@/types'

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
  const { session, signOut } = useAuth()
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


  // "Pick up where you left off" points at the first project still in progress.
  const active = state.projects.find((p) => !isComplete(p))
  const nextStage = active ? STAGES[active.currentStage] : null

  return (
    <div className="cq-root">
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(var(--fg),0.06)' }}>
       <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '22px 34px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg,#5B86A3,#8FB3C7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FlaskConical size={20} color="var(--on-accent)" /></div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px' }}>Adaptus</div>
            <div style={{ fontSize: '10px', color: 'rgba(var(--fg),0.35)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Guided Change Management</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ThemeToggle prominent />
          {hasSupabase && session && (
            <button type="button" onClick={signOut} style={ghostBtn} title={session.user.email ? `Sign out (${session.user.email})` : 'Sign out'}>
              <LogOut size={15} /> Sign out
            </button>
          )}
          <button type="button" onClick={() => setWizardOpen(true)} style={primaryBtn}>
            <Plus size={16} /> New Project
          </button>
        </div>
       </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 34px' }}>
        {total === 0 ? (
          /* First run — a compact, left-aligned hero whose primary action is to
             create the first project, kept near the top-left so it's the obvious
             next step (no big centered empty state taking up the page). */
          <div style={{ maxWidth: '680px', background: 'radial-gradient(560px 240px at 92% -40%, rgba(255,255,255,0.16), transparent 60%), linear-gradient(120deg, #3e6079 0%, #2c4a60 100%)', borderRadius: '16px', padding: narrow ? '24px 22px' : '30px 32px', boxShadow: '0 12px 32px rgba(20,40,55,0.28)' }}>
            <h1 style={{ margin: 0, fontSize: narrow ? '23px' : '27px', fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.5px' }}>Lead your change with confidence</h1>
            <p style={{ margin: '10px 0 22px', fontSize: '14.5px', color: 'rgba(255,255,255,0.82)', lineHeight: 1.55, maxWidth: '460px' }}>
              Adaptus walks you through rolling out a change from start to finish — no change-management experience required.
            </p>
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', background: '#fff', border: 'none', borderRadius: '12px', padding: '14px 24px', color: '#1f3445', fontWeight: 800, fontSize: '15.5px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 18px rgba(0,0,0,0.22)' }}
            >
              <Plus size={19} strokeWidth={2.5} /> Create your first project <ArrowRight size={19} />
            </button>
          </div>
        ) : (
          <>
            {/* Top guide-me slot — pick up the first in-progress project, or, if
                everything's done, a prompt to start the next one. */}
            {active && nextStage ? (
              <button
                type="button"
                onClick={() => dispatch({ type: 'OPEN_PROJECT', id: active.id, stageIdx: active.currentStage })}
                style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(91,134,163,0.1)', border: '1px solid rgba(91,134,163,0.3)', borderRadius: '14px', padding: '18px 22px', marginBottom: '22px', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0, background: 'rgba(91,134,163,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lightbulb size={22} color="var(--accent-text)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-text)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '3px' }}>Pick up where you left off</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{active.name || 'Untitled project'}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(var(--fg),0.6)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    Next step: <nextStage.icon size={14} color="var(--accent-text)" /> {nextStage.label}
                  </div>
                </div>
                <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'linear-gradient(135deg, #2dd4bf 0%, #12b3a1 100%)', color: '#06302b', borderRadius: '10px', padding: '11px 18px', fontWeight: 700, fontSize: '14px', boxShadow: '0 4px 14px rgba(18,179,161,0.35)' }}>
                  Continue <ArrowRight size={17} />
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setWizardOpen(true)}
                style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(91,134,163,0.1)', border: '1px solid rgba(91,134,163,0.3)', borderRadius: '14px', padding: '18px 22px', marginBottom: '22px', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0, background: 'rgba(91,134,163,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={22} color="var(--accent-text)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-text)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '3px' }}>All caught up</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>Start your next change project</div>
                </div>
                <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'linear-gradient(135deg, #2dd4bf 0%, #12b3a1 100%)', color: '#06302b', borderRadius: '10px', padding: '11px 18px', fontWeight: 700, fontSize: '14px', boxShadow: '0 4px 14px rgba(18,179,161,0.35)' }}>
                  New project <ArrowRight size={17} />
                </span>
              </button>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700 }}>Your Projects</span>
                <span style={{ fontSize: '12px', color: 'rgba(var(--fg),0.62)' }}>
                  {total} project{total === 1 ? '' : 's'} · {completed} complete
                </span>
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

            {visible.length === 0 ? (
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
                      role={proj.role}
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

          </>
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
          <span style={{ fontSize: '13px', color: 'var(--text)' }}>Deleted “{deleted.name || 'Untitled project'}”</span>
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
  role?: Role
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

function ProjectCard({ name, type, role, p2, stageIcon: StageIcon, stageTag, avg, coreDone, complete, onClick, onEdit, onDelete }: ProjectCardProps) {
  const [hover, setHover] = useState(false)
  // Mouse users: reveal the edit/delete icons on hover only (less clutter).
  // Touch users (no hover): keep them visible since there's nothing to hover.
  const canHover = useMediaQuery('(hover: hover)')
  const actionsShown = !canHover || hover
  const shared = !!role && role !== 'owner'
  const canEdit = role !== 'viewer' // owner/editor/undefined
  const canDelete = !role || role === 'owner'
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
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Header: title region is a fixed 2-line height so subtitle/progress/tags
          line up across cards regardless of title length or completion state. */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', marginBottom: '4px', minHeight: '37px' }}>
            <div style={{ flex: 1, minWidth: 0, fontSize: '14px', fontWeight: 700, lineHeight: 1.3, color: name ? 'var(--text)' : 'rgba(var(--fg),0.45)', fontStyle: name ? 'normal' : 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{name || 'Untitled project'}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(var(--fg),0.55)', minWidth: 0 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{type}</span>
            {shared && <span style={{ flexShrink: 0, textTransform: 'capitalize', color: 'var(--accent-text)', border: '1px solid rgba(91,134,163,0.3)', borderRadius: '6px', padding: '1px 6px', fontWeight: 600 }}>Shared · {role}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Revealed on hover for mouse users; always shown on touch (no hover). */}
          {canEdit && (
            <button type="button" style={{ ...cardIconBtn, opacity: actionsShown ? 1 : 0, pointerEvents: actionsShown ? 'auto' : 'none', transition: 'opacity 0.15s' }} title="Edit project details" aria-label="Edit project details" onClick={stop(onEdit)}><Pencil size={13} /></button>
          )}
          {canDelete && (
            <button type="button" style={{ ...cardIconBtn, color: '#fca5a5', opacity: actionsShown ? 1 : 0, pointerEvents: actionsShown ? 'auto' : 'none', transition: 'opacity 0.15s' }} title="Delete project" aria-label="Delete project" onClick={stop(onDelete)}><Trash2 size={13} /></button>
          )}
        </div>
      </div>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
          <span style={{ fontSize: '11px', color: 'rgba(var(--fg),0.55)' }}>Progress</span>
          {complete ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: '#86efac' }}><Check size={12} strokeWidth={3} /> Complete</span>
          ) : (
            <span style={{ fontSize: '11px', color: 'var(--accent-text)', fontWeight: 600 }}>{p2}%</span>
          )}
        </div>
        <div style={{ height: '4px', background: 'rgba(var(--fg),0.08)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${complete ? 100 : p2}%`, background: complete ? '#22c55e' : 'linear-gradient(90deg,#5B86A3,#8FB3C7)', borderRadius: '2px' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: 'auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(var(--fg),0.04)', border: '1px solid rgba(var(--fg),0.07)', borderRadius: '8px', padding: '4px 9px', fontSize: '11px', color: 'rgba(var(--fg),0.62)' }}><StageIcon size={12} /> {stageTag}</div>
        {avg !== null && (
          <div style={{ background: `rgba(${riskRgb},0.1)`, border: `1px solid rgba(${riskRgb},0.25)`, borderRadius: '8px', padding: '4px 9px', fontSize: '11px', color: riskColor(avg) }}>
            Risk: {riskLabel(avg)}
          </div>
        )}
        <div style={{ background: 'rgba(var(--fg),0.04)', border: '1px solid rgba(var(--fg),0.07)', borderRadius: '8px', padding: '4px 9px', fontSize: '11px', color: 'rgba(var(--fg),0.55)' }}>
          {coreDone} of {ESSENTIAL_COUNT} essential steps
        </div>
      </div>
    </div>
  )
}
