import type { Invite, Member, Project, Role, StageData, StageId } from '@/types'
import { supabase } from '@/lib/supabase'
import { migrateProject } from '@/lib/storage'

/** Shape of a row in the Supabase `projects` table. */
interface ProjectRow {
  id: string
  owner_id: string
  name: string
  type: string
  description: string
  target_date: string
  current_stage: number
  completed_stages: string[]
  stage_data: unknown
  created_at: string
  share_token?: string | null
}

/** The public-safe subset returned by the get_shared_project RPC (no owner). */
type SharedRow = Omit<ProjectRow, 'owner_id' | 'description' | 'share_token'>

function rowToProject(r: ProjectRow | SharedRow): Project {
  // Run through migrateProject so any stageData fields added since the row was
  // written are backfilled to the current shape.
  return migrateProject({
    id: r.id,
    name: r.name,
    type: r.type,
    description: 'description' in r ? r.description : '',
    targetDate: r.target_date ?? '',
    createdAt: r.created_at,
    totalXp: 0,
    completedStages: (r.completed_stages ?? []) as StageId[],
    currentStage: r.current_stage ?? 0,
    stageData: r.stage_data as StageData,
    shareToken: 'share_token' in r ? r.share_token : null,
  })
}

/** Columns that change as the user edits (owner_id is set only on insert). */
function editableColumns(p: Project) {
  return {
    name: p.name,
    type: p.type,
    description: p.description,
    target_date: p.targetDate,
    current_stage: p.currentStage,
    completed_stages: p.completedStages,
    stage_data: p.stageData,
    share_token: p.shareToken ?? null,
  }
}

/** Every project the signed-in user can see (own + shared), oldest first. */
export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: true })
  if (error) throw error
  return (data as ProjectRow[]).map(rowToProject)
}

/** Create a new project row owned by the given user. */
export async function insertProject(p: Project, ownerId: string): Promise<void> {
  const { error } = await supabase.from('projects').insert({ id: p.id, owner_id: ownerId, ...editableColumns(p) })
  if (error) throw error
}

/** Update an existing project's editable fields (owner_id is left unchanged). */
export async function updateProject(p: Project): Promise<void> {
  const { error } = await supabase.from('projects').update(editableColumns(p)).eq('id', p.id)
  if (error) throw error
}

/** Delete a project (owner only). */
export async function deleteProjectRemote(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}

/**
 * Fetch a project by its public share token — works WITHOUT auth via the
 * `get_shared_project` SECURITY DEFINER RPC, which returns only the public-safe
 * columns of the one matching row (and nothing if the token is wrong/revoked).
 */
export async function fetchSharedProject(token: string): Promise<Project | null> {
  const { data, error } = await supabase.rpc('get_shared_project', { p_token: token })
  if (error) throw error
  if (!data) return null
  return rowToProject(data as SharedRow)
}

/* ----------------------------------------------------------- collaboration */

/** Claim any invites addressed to the signed-in user's email (best-effort). */
export async function acceptPendingInvites(): Promise<void> {
  const { error } = await supabase.rpc('accept_pending_invites')
  if (error) throw error
}

/** The signed-in user's role on each project they're a member of. */
export async function fetchMyRoles(userId: string): Promise<Record<string, Role>> {
  const { data, error } = await supabase.from('project_members').select('project_id, role').eq('user_id', userId)
  if (error) throw error
  const map: Record<string, Role> = {}
  for (const r of (data ?? []) as { project_id: string; role: Role }[]) map[r.project_id] = r.role
  return map
}

interface ProfileRow {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
}

/** Everyone with access to a project, plus the not-yet-claimed email invites. */
export async function fetchCollaborators(projectId: string): Promise<{ members: Member[]; invites: Invite[] }> {
  // No FK between project_members and profiles (both point at auth.users), so
  // PostgREST can't embed — fetch members, then their profiles, and join here.
  const [m, i] = await Promise.all([
    supabase.from('project_members').select('user_id, role').eq('project_id', projectId),
    supabase.from('project_invites').select('id, email, role').eq('project_id', projectId),
  ])
  if (m.error) throw m.error
  if (i.error) throw i.error

  const memberRows = (m.data ?? []) as { user_id: string; role: Role }[]
  const ids = memberRows.map((r) => r.user_id)
  const profiles: Record<string, ProfileRow> = {}
  if (ids.length) {
    const p = await supabase.from('profiles').select('id, email, full_name, avatar_url').in('id', ids)
    if (p.error) throw p.error
    for (const row of (p.data ?? []) as ProfileRow[]) profiles[row.id] = row
  }

  const order: Record<Role, number> = { owner: 0, editor: 1, viewer: 2 }
  const members: Member[] = memberRows
    .map((r) => {
      const pr = profiles[r.user_id]
      return {
        userId: r.user_id,
        role: r.role,
        email: pr?.email ?? '',
        name: pr?.full_name ?? pr?.email ?? 'Member',
        avatarUrl: pr?.avatar_url ?? '',
      }
    })
    .sort((a, b) => order[a.role] - order[b.role])
  const invites = (i.data ?? []) as Invite[]
  return { members, invites }
}

/** Invite someone by email at a given role (owner-only, enforced by RLS). */
export async function inviteCollaborator(projectId: string, email: string, role: Exclude<Role, 'owner'>): Promise<void> {
  const { error } = await supabase.from('project_invites').upsert(
    { project_id: projectId, email: email.trim().toLowerCase(), role },
    { onConflict: 'project_id,email' },
  )
  if (error) throw error
}

export async function updateMemberRole(projectId: string, userId: string, role: Role): Promise<void> {
  const { error } = await supabase.from('project_members').update({ role }).eq('project_id', projectId).eq('user_id', userId)
  if (error) throw error
}

export async function removeMember(projectId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('project_members').delete().eq('project_id', projectId).eq('user_id', userId)
  if (error) throw error
}

export async function revokeInvite(inviteId: string): Promise<void> {
  const { error } = await supabase.from('project_invites').delete().eq('id', inviteId)
  if (error) throw error
}
