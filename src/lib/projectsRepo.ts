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
}

function rowToProject(r: ProjectRow): Project {
  // Run through migrateProject so any stageData fields added since the row was
  // written are backfilled to the current shape.
  return migrateProject({
    id: r.id,
    name: r.name,
    type: r.type,
    description: r.description,
    targetDate: r.target_date ?? '',
    createdAt: r.created_at,
    totalXp: 0,
    completedStages: (r.completed_stages ?? []) as StageId[],
    currentStage: r.current_stage ?? 0,
    stageData: r.stage_data as StageData,
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
