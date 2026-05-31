import type { Project, StageData, StageId } from '@/types'
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
