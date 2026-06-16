import { useState } from 'react'
import type { Project } from '@/types'
import { CHANGE_TYPES } from '@/data/constants'

const sideBtn: React.CSSProperties = {
  flex: 1,
  background: 'rgba(var(--fg),0.04)',
  border: '1px solid rgba(var(--fg),0.1)',
  borderRadius: '10px',
  padding: '12px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '14px',
}

/**
 * Edit an existing project's identifying details (name, type, description,
 * target date). Stage data is left untouched; this only updates the metadata
 * captured by the new-project wizard.
 */
export function EditProjectModal({ project, onClose, onSave }: { project: Project; onClose: () => void; onSave: (updated: Project) => void }) {
  const [name, setName] = useState(project.name)
  const [type, setType] = useState(project.type)
  const [description, setDescription] = useState(project.description)
  const [targetDate, setTargetDate] = useState(project.targetDate)

  const isValid = name.trim().length > 0 && type.length > 0

  const save = () => {
    if (!isValid) return
    onSave({ ...project, name: name.trim(), type, description: description.trim(), targetDate })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,20,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: 'var(--surface-card)', border: '1px solid rgba(var(--fg),0.08)', borderRadius: '20px', padding: '36px 44px', width: '500px', maxWidth: '90vw' }}>
        <div style={{ fontSize: '11px', color: '#5B86A3', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
          Edit project
        </div>
        <h2 style={{ margin: '0 0 22px', fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>Project details</h2>

        <div className="cq-lbl">Project name</div>
        <input
          type="text"
          className="cq-input"
          autoFocus
          value={name}
          placeholder="e.g., Salesforce CRM Rollout Q3"
          style={{ marginBottom: '18px' }}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="cq-lbl">Change type</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '6px 0 18px' }}>
          {CHANGE_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className={'ch-btn' + (type === t ? ' sel' : '')}
              style={{ fontSize: '12px' }}
              onClick={() => setType(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="cq-lbl">Brief description</div>
        <textarea
          className="cq-textarea"
          rows={4}
          value={description}
          placeholder="What are you changing? Who's affected? What's the goal?"
          style={{ marginBottom: '18px' }}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="cq-lbl">Target completion date (optional)</div>
        <input
          type="date"
          className="cq-input"
          style={{ maxWidth: '200px' }}
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />

        <div style={{ display: 'flex', gap: '10px', marginTop: '26px' }}>
          <button type="button" style={{ ...sideBtn, color: 'rgba(var(--fg),0.4)' }} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            style={{
              flex: 2,
              border: 'none',
              borderRadius: '10px',
              padding: '12px',
              fontWeight: 700,
              fontSize: '14px',
              fontFamily: 'inherit',
              background: isValid ? 'linear-gradient(135deg,#5B86A3,#3E6580)' : 'rgba(91,134,163,0.2)',
              color: isValid ? 'var(--on-accent)' : 'rgba(var(--fg),0.3)',
              cursor: isValid ? 'pointer' : 'default',
            }}
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  )
}
