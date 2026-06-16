import { useState } from 'react'
import { Rocket, X } from 'lucide-react'

export interface ProjectDraft {
  name: string
  type: string
  description: string
  targetDate: string
  /** Emails to grant editor access once the project is created. */
  invites: string[]
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function Wizard({ onClose, onCreate }: { onClose: () => void; onCreate: (draft: ProjectDraft) => void }) {
  const [draft, setDraft] = useState<ProjectDraft>({ name: '', type: '', description: '', targetDate: '', invites: [] })
  const [emailInput, setEmailInput] = useState('')

  const isValid = draft.name.trim().length > 0
  const pendingEmail = emailInput.trim().toLowerCase()
  const canAddEmail = EMAIL_RE.test(pendingEmail) && !draft.invites.includes(pendingEmail)

  const addEmail = () => {
    if (!canAddEmail) return
    setDraft({ ...draft, invites: [...draft.invites, pendingEmail] })
    setEmailInput('')
  }

  const removeEmail = (email: string) =>
    setDraft({ ...draft, invites: draft.invites.filter((e) => e !== email) })

  const create = () => {
    if (!isValid) return
    // Fold in any valid email still sitting in the input but not yet added.
    const extra = canAddEmail ? [pendingEmail] : []
    onCreate({ ...draft, invites: [...draft.invites, ...extra] })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,20,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ position: 'relative', background: 'var(--surface-card)', border: '1px solid rgba(var(--fg),0.08)', borderRadius: '20px', padding: '36px 44px', width: '500px', maxWidth: '90vw' }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{ position: 'absolute', top: '18px', right: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: 'transparent', border: 'none', color: 'rgba(var(--fg),0.45)', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <X size={18} />
        </button>

        <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>Name your change initiative</h2>
        <p style={{ margin: '0 0 22px', color: 'rgba(var(--fg),0.4)', fontSize: '14px' }}>Give it an identity.</p>

        <div className="cq-lbl">Project name</div>
        <input
          type="text"
          className="cq-input"
          autoFocus
          value={draft.name}
          placeholder="e.g., Salesforce CRM Rollout Q3"
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') create()
          }}
        />

        <div className="cq-lbl" style={{ marginTop: '20px' }}>Launch date <span style={{ color: 'rgba(var(--fg),0.4)', fontWeight: 400 }}>(optional)</span></div>
        <input
          type="date"
          className="cq-input"
          value={draft.targetDate}
          onChange={(e) => setDraft({ ...draft, targetDate: e.target.value })}
        />
        <p style={{ margin: '6px 0 0', color: 'rgba(var(--fg),0.4)', fontSize: '12px' }}>If you already have a target go-live, add it. You can change it later.</p>

        <div className="cq-lbl" style={{ marginTop: '20px' }}>Grant access <span style={{ color: 'rgba(var(--fg),0.4)', fontWeight: 400 }}>(optional)</span></div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="email"
            className="cq-input"
            style={{ flex: 1 }}
            value={emailInput}
            placeholder="teammate@company.com"
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault()
                addEmail()
              }
            }}
          />
          <button
            type="button"
            onClick={addEmail}
            disabled={!canAddEmail}
            style={{
              border: 'none',
              borderRadius: '10px',
              padding: '0 16px',
              fontWeight: 700,
              fontSize: '14px',
              fontFamily: 'inherit',
              background: canAddEmail ? 'rgba(91,134,163,0.18)' : 'rgba(var(--fg),0.05)',
              color: canAddEmail ? 'var(--accent-text)' : 'rgba(var(--fg),0.3)',
              cursor: canAddEmail ? 'pointer' : 'default',
            }}
          >
            Add
          </button>
        </div>
        <p style={{ margin: '6px 0 0', color: 'rgba(var(--fg),0.4)', fontSize: '12px' }}>They’ll join as editors and get access the next time they sign in.</p>

        {draft.invites.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
            {draft.invites.map((email) => (
              <span
                key={email}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(91,134,163,0.14)', border: '1px solid rgba(91,134,163,0.25)', borderRadius: '999px', padding: '5px 8px 5px 12px', fontSize: '13px', color: 'var(--text)' }}
              >
                {email}
                <button
                  type="button"
                  onClick={() => removeEmail(email)}
                  aria-label={`Remove ${email}`}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '999px', background: 'transparent', border: 'none', color: 'rgba(var(--fg),0.5)', cursor: 'pointer', padding: 0 }}
                >
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', marginTop: '26px' }}>
          <button
            type="button"
            onClick={create}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
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
            <Rocket size={16} /> Launch project
          </button>
        </div>
      </div>
    </div>
  )
}
