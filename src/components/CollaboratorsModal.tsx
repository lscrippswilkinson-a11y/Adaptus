import { useEffect, useState } from 'react'
import { Check, Copy, Crown, Link2, Lock, Mail, Trash2, UserPlus } from 'lucide-react'
import type { Invite, InviteLink, Member, Project, Role } from '@/types'
import { hasSupabase } from '@/lib/supabase'
import {
  createInviteLink,
  fetchCollaborators,
  fetchInviteLinks,
  inviteCollaborator,
  removeMember,
  revokeInvite,
  revokeInviteLink,
  updateMemberRole,
} from '@/lib/projectsRepo'
import { UpgradeModal } from '@/components/UpgradeModal'
import { usePlan } from '@/state/PlanContext'
import { FREE_COLLABORATOR_LIMIT } from '@/lib/plan'
import { t, tp } from '@/i18n'
import { tr } from '@/i18n/rich'

/**
 * Manage who can access a project: invite teammates by email at editor/viewer
 * roles, change roles, and remove people or pending invites. Only the owner
 * sees the management controls (RLS enforces it server-side too).
 */
export function CollaboratorsModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const isOwner = (project.role ?? 'owner') === 'owner'
  const { isPremium, loading: planLoading } = usePlan()
  const [upsell, setUpsell] = useState<string | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [links, setLinks] = useState<InviteLink[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Exclude<Role, 'owner'>>('editor')
  const [linkRole, setLinkRole] = useState<Exclude<Role, 'owner'>>('viewer')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState('')

  const linkUrl = (token: string) => `${window.location.origin}/?join=${token}`

  // Seats in use, not counting the owner: people already on the project plus
  // invites they haven't claimed yet. An open invite link is a seat about to be
  // taken, so it counts too, otherwise one link is an unlimited side door.
  const seatsUsed = members.filter((m) => m.role !== 'owner').length + invites.length + links.length
  const seatLimited = !isPremium && !planLoading && seatsUsed >= FREE_COLLABORATOR_LIMIT

  /** The bottleneck they've just hit: bringing a second person in. */
  const askForSeat = () => {
    setUpsell(t('The free plan covers one teammate on a project. Upgrade to bring in everyone the change involves.'))
  }

  const load = async () => {
    try {
      const [collab, lks] = await Promise.all([fetchCollaborators(project.id), fetchInviteLinks(project.id)])
      setMembers(collab.members)
      setInvites(collab.invites)
      setLinks(lks)
    } catch (err) {
      console.error('[adaptus] failed to load collaborators', err)
      setError(t('Couldn’t load collaborators.'))
    } finally {
      setLoading(false)
    }
  }

  const makeLink = async () => {
    setError('')
    if (seatLimited) {
      askForSeat()
      return
    }
    try {
      await createInviteLink(project.id, linkRole)
      await load()
    } catch (err) {
      console.error('[adaptus] create invite link failed', err)
      setError(t('Couldn’t create an invite link.'))
    }
  }

  const copyLink = async (link: InviteLink) => {
    try {
      await navigator.clipboard.writeText(linkUrl(link.token))
      setCopiedId(link.id)
      window.setTimeout(() => setCopiedId(''), 1800)
    } catch {
      /* clipboard blocked */
    }
  }

  const dropLink = async (link: InviteLink) => {
    setLinks((ls) => ls.filter((l) => l.id !== link.id))
    try {
      await revokeInviteLink(link.id)
    } catch (err) {
      console.error('[adaptus] revoke link failed', err)
      load()
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
      setError(t('Enter a valid email address.'))
      return
    }
    if (seatLimited) {
      askForSeat()
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
      setError(t('Couldn’t send that invite.'))
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
        <div style={{ fontSize: '11px', color: '#5B86A3', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>{t('Collaborators')}</div>
        <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>{tp('Share “{project}”', { project: project.name || t('this project') })}</h2>
        <p style={{ margin: '0 0 22px', fontSize: '13px', color: 'rgba(var(--fg),0.6)', lineHeight: 1.6 }}>
          {tr('Share a link or invite by email. **Editors** can change the plan; **viewers** can only read it.', { color: 'var(--text)' })}
        </p>

        {!hasSupabase ? (
          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '14px 16px', fontSize: '13px', color: 'var(--text)', lineHeight: 1.6 }}>
            {t('Collaboration needs the cloud. It’ll work on the deployed site once Supabase is configured.')}
          </div>
        ) : (
          <>
            {/* Invite link, the easy path: send it yourself, anyone can join. */}
            {isOwner && (
              <div style={{ marginBottom: '18px' }}>
                <div className="cq-lbl">{t('Invite link')}</div>
                <div style={{ fontSize: '12px', color: 'rgba(var(--fg),0.55)', margin: '2px 0 10px', lineHeight: 1.5 }}>
                  {t('Anyone who opens the link joins as the role you pick, send it however you like.')}
                </div>
                {links.map((l) => (
                  <div key={l.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'capitalize', color: 'var(--accent-text)', background: 'rgba(91,134,163,0.12)', border: '1px solid rgba(91,134,163,0.3)', borderRadius: '6px', padding: '4px 8px', flexShrink: 0 }}>{t(l.role === 'editor' ? 'Editor' : 'Viewer')}</span>
                    <input type="text" className="cq-input" readOnly value={linkUrl(l.token)} onFocus={(e) => e.target.select()} style={{ flex: 1, minWidth: 0, fontSize: '12px' }} />
                    <button type="button" onClick={() => copyLink(l)} title={t('Copy link')} aria-label={t('Copy link')} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', flexShrink: 0, background: 'rgba(91,134,163,0.15)', border: '1px solid rgba(91,134,163,0.3)', borderRadius: '8px', padding: '8px 12px', color: 'var(--accent-text)', fontWeight: 700, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {copiedId === l.id ? <><Check size={14} /> {t('Copied')}</> : <><Copy size={14} /> {t('Copy')}</>}
                    </button>
                    <button type="button" onClick={() => dropLink(l)} aria-label={t('Revoke link')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(var(--fg),0.4)', flexShrink: 0, display: 'inline-flex' }}><Trash2 size={15} /></button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: links.length ? '4px' : 0 }}>
                  <select className="cq-select" value={linkRole} onChange={(e) => setLinkRole(e.target.value as Exclude<Role, 'owner'>)} style={{ width: 'auto' }}>
                    <option value="viewer">{t('Viewer')}</option>
                    <option value="editor">{t('Editor')}</option>
                  </select>
                  <button type="button" onClick={makeLink} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg,#5B86A3,#3E6580)', border: 'none', borderRadius: '10px', padding: '9px 16px', color: 'var(--on-accent)', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <Link2 size={15} /> {t('Create invite link')}
                  </button>
                </div>
              </div>
            )}

            {isOwner && (
              <div className="cq-lbl" style={{ marginBottom: '8px' }}>{t('Or invite by email')}</div>
            )}
            {isOwner && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input type="email" className="cq-input" value={email} placeholder={t('teammate@company.com')} style={{ flex: 1, minWidth: 0 }} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && invite()} />
                <select className="cq-select" value={role} onChange={(e) => setRole(e.target.value as Exclude<Role, 'owner'>)} style={{ width: 'auto' }}>
                  <option value="editor">{t('Editor')}</option>
                  <option value="viewer">{t('Viewer')}</option>
                </select>
                <button type="button" onClick={invite} disabled={busy} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0, background: 'linear-gradient(135deg,#5B86A3,#3E6580)', border: 'none', borderRadius: '10px', padding: '0 16px', color: 'var(--on-accent)', fontWeight: 700, fontSize: '13px', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1, fontFamily: 'inherit' }}>
                  <UserPlus size={15} /> {t('Invite')}
                </button>
              </div>
            )}
            {error && <div style={{ fontSize: '12px', color: '#fca5a5', marginBottom: '10px' }}>{error}</div>}

            {/* Say it before they type an address, so the ask lands as a fact
                about the plan rather than a rejected invite. */}
            {isOwner && seatLimited && (
              <button
                type="button"
                onClick={askForSeat}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', textAlign: 'left', background: 'rgba(91,134,163,0.1)', border: '1px solid rgba(91,134,163,0.3)', borderRadius: '10px', padding: '10px 12px', marginBottom: '10px', fontFamily: 'inherit', cursor: 'pointer' }}
              >
                <Lock size={14} color="var(--accent-text)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: 'rgba(var(--fg),0.7)', lineHeight: 1.5 }}>
                  {t('One teammate is included free. Adaptus Premium adds the rest of the team.')}
                </span>
              </button>
            )}

            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {loading ? (
                <div style={{ fontSize: '13px', color: 'rgba(var(--fg),0.5)', padding: '8px 0' }}>{t('Loading…')}</div>
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
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: '#fcd34d', flexShrink: 0 }}><Crown size={13} /> {t('Owner')}</span>
                      ) : isOwner ? (
                        <>
                          <select className="cq-select" value={m.role} onChange={(e) => changeRole(m, e.target.value as Role)} style={{ width: 'auto', fontSize: '12px', padding: '5px 8px' }}>
                            <option value="editor">{t('Editor')}</option>
                            <option value="viewer">{t('Viewer')}</option>
                          </select>
                          <button type="button" onClick={() => kick(m)} aria-label={t('Remove')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(var(--fg),0.4)', flexShrink: 0, display: 'inline-flex' }}><Trash2 size={15} /></button>
                        </>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'rgba(var(--fg),0.5)', flexShrink: 0 }}>{t(m.role === 'editor' ? 'Editor' : 'Viewer')}</span>
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
                        <div style={{ fontSize: '11px', color: 'rgba(var(--fg),0.5)' }}>{tp('Invited · {role} · pending', { role: t(inv.role === 'editor' ? 'Editor' : 'Viewer') })}</div>
                      </div>
                      {isOwner && (
                        <button type="button" onClick={() => unInvite(inv)} aria-label={t('Revoke invite')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(var(--fg),0.4)', flexShrink: 0, display: 'inline-flex' }}><Trash2 size={15} /></button>
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
            <Check size={15} /> {t('Done')}
          </button>
        </div>
      </div>

      {upsell && <UpgradeModal reason={upsell} onClose={() => setUpsell(null)} />}
    </div>
  )
}
