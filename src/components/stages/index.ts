import type { ComponentType } from 'react'
import type { StageId } from '@/types'
import { DefineStage } from '@/components/stages/DefineStage'
import { GroupsStage } from '@/components/stages/GroupsStage'
import { SponsorStage } from '@/components/stages/SponsorStage'
import { StakeholdersStage } from '@/components/stages/StakeholdersStage'
import { RiskStage } from '@/components/stages/RiskStage'
import { ResistanceStage } from '@/components/stages/ResistanceStage'
import { CommsStage } from '@/components/stages/CommsStage'
import { TrainingStage } from '@/components/stages/TrainingStage'
import { TestingStage } from '@/components/stages/TestingStage'
import { DependenciesStage } from '@/components/stages/DependenciesStage'
import { DashboardStage } from '@/components/stages/DashboardStage'
import { AdoptionStage } from '@/components/stages/AdoptionStage'
import { SustainmentStage } from '@/components/stages/SustainmentStage'
import { ReportStage } from '@/components/stages/ReportStage'

/**
 * Maps each navigable section id to its component. Keyed by the ids that appear
 * in STAGES (a subset of StageId, e.g. `closeout` is a data slice edited
 * inside the report, not its own section), so this is a Partial record.
 */
export const STAGE_COMPONENTS: Partial<Record<StageId, ComponentType>> = {
  define: DefineStage,
  groups: GroupsStage,
  sponsor: SponsorStage,
  stakeholders: StakeholdersStage,
  risk: RiskStage,
  resistance: ResistanceStage,
  comms: CommsStage,
  training: TrainingStage,
  testing: TestingStage,
  dependencies: DependenciesStage,
  milestones: DashboardStage, // Launch Preparation Dashboard
  adoption: AdoptionStage,
  sustainment: SustainmentStage,
  executive: ReportStage, // Launch Success Report
}
