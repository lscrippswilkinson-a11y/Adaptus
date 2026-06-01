import { useEffect, useState } from 'react'
import { Check, Crown, Mail, Trash2, UserPlus } from 'lucide-react'
import type { Invite, Member, Project, Role } from '@/types'
import { hasSupabase } from '@/lib/supabase'
import {
  fetchCollaborators,
  inviteCollaborator,
  removeMember,
  revokeInvite,
  updateMemberRole,
} from '@/lib/projectsRepo'

/**
 * Manage who can access a project: invite teammates by email at editor/viewer
 * roles, change roles, and remove people or pending invites. Only the owner
 * sees the management controls (RLS enforces it server-side too).
 */
export function CollaboratorsModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const isOwner = (project.role ?? 'owner') === 'owner'
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Exclude<Role, 'owner'>>('editor')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const { members, invites } = await fetchCollaborators(project.id)
      setMembers(members)
      setInvites(invites)
    } catch (err) {
      console.error('[adaptus] failed to load collaborators', err)
      setError('Couldn’t load collaborators.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hasSupabase) load()
    else setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id])

  const invite = async () => {
    const e = email.trim().toLowerCase()
    if (!e || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
      setError('Enter a valid email address.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await inviteCollaborator(project.id, e, role)
      setEmail('')
      await load()
    } catch (err) {
      console.error('[adaptus] invite failed', err)
      setError('Couldn’t send that invite.')
    } finally {
      setBusy(false)
    }
  }

  const changeRole = async (m: Member, next: Role) => {
    setMembers((ms) => ms.map((x) => (x.userId === m.userId ? { ...x, role: next } : x)))
    try {
      await updateMemberRole(project.id, m.userId, next)
    } catch (err) {
      console.error('[adaptus] role change failed', err)
      load()
    }
  }

  const kick = async (m: Member) => {
    setMembers((ms) => ms.filter((x) => x.userId !== m.userId))
    try {
      await removeMember(project.id, m.userId)
    } catch (err) {
      console.error('[adaptus] remove member failed', err)
      load()
    }
  }

  const unInvite = async (inv: Invite) => {
    setInvites((is) => is.filter((x) => x.id !== inv.id))
    try {
      await revokeInvite(inv.id)
    } catch (err) {
      console.error('[adaptus] revoke invite failed', err)
      load()
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,20,0.85)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 100, overflowY: 'auto', padding: '40px 20px' }} onClick={onClose}>
      <div style={{ background: 'var(--surface-card)', border: '1px solid rgba(var(--fg),0.08)', borderRadius: '20px', padding: '32px 36px', width: '540px', maxWidth: '92vw' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: '11px', color: '#5B86A3', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>Collaborators</div>
        <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>Share “{project.name || 'this project'}”</h2>
        <p style={{ margin: '0 0 22px', fontSize: '13px', color: 'rgba(var(--fg),0.6)', lineHeight: 1.6 }}>
          Invite teammates by email. <strong style={{ color: 'var(--text)' }}>Editors</strong> can change the plan; <strong style={{ color: 'var(--text)' }}>viewers</strong> can only read it.
        </p>

        {!hasSupabase ? (
          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '14px 16px', fontSize: '13px', color: 'var(--text)', lineHeight: 1.6 }}>
            Collaboration needs the cloud. It’ll work on the deployed site once Supabase is configured.
          </div>
        ) : (
          <>
            {isOwner && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input type="email" className="cq-input" value={email} placeholder="teammate@company.com" style={{ flex: 1, minWidth: 0 }} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && invite()} />
                <select className="cq-select" value={role} onChange={(e) => setRole(e.target.value as Exclude<Role, 'owner'>)} style={{ width: 'auto' }}>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button type="button" onClick={invite} disabled={busy} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0, background: 'linear-gradient(135deg,#5B86A3,#3E6580)', border: 'none', borderRadius: '10px', padding: '0 16px', color: 'var(--on-accent)', fontWeight: 700, fontSize: '13px', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1, fontFamily: 'inherit' }}>
                  <UserPlus size={15} /> Invite
                </button>
              </div>
            )}
            {error && <div style={{ fontSize: '12px', color: '#fca5a5', marginBottom: '10px' }}>{error}</div>}

            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {loading ? (
                <div style={{ fontSize: '13px', color: 'rgba(var(--fg),0.5)', padding: '8px 0' }}>Loading…</div>
              ) : (
                <>
                  {members.map((m) => (
                    <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 4px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0, background: 'rgba(91,134,163,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: 'var(--accent-text)' }}>
                        {(m.name || m.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(var(--fg),0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</div>
                      </div>
                      {m.role === 'owner' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: '#fcd34d', flexShrink: 0 }}><Crown size={13} /> Owner</span>
                      ) : isOwner ? (
                        <>
                          <select className="cq-select" value={m.role} onChange={(e) => changeRole(m, e.target.value as Role)} style={{ width: 'auto', fontSize: '12px', padding: '5px 8px' }}>
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <button type="button" onClick={() => kick(m)} aria-label="Remove" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(var(--fg),0.4)', flexShrink: 0, display: 'inline-flex' }}><Trash2 size={15} /></button>
                        </>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'rgba(var(--fg),0.5)', textTransform: 'capitalize', flexShrink: 0 }}>{m.role}</span>
                      )}
                    </div>
                  ))}

                  {invites.map((inv) => (
                    <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 4px', opacity: 0.8 }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0, background: 'rgba(var(--fg),0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(var(--fg),0.45)' }}>
                        <Mail size={14} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.email}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(var(--fg),0.5)' }}>Invited · {inv.role} · pending</div>
                      </div>
                      {isOwner && (
                        <button type="button" onClick={() => unInvite(inv)} aria-label="Revoke invite" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(var(--fg),0.4)', flexShrink: 0, display: 'inline-flex' }}><Trash2 size={15} /></button>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '22px' }}>
          <button type="button" onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(var(--fg),0.06)', border: '1px solid rgba(var(--fg),0.1)', borderRadius: '10px', padding: '10px 22px', color: 'var(--text)', fontWeight: 600, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
            <Check size={15} /> Done
          </button>
        </div>
      </div>
    </div>
  )
}
