import type { ComponentType } from 'react'
import type { StageId } from '@/types'
import { DefineStage } from '@/components/stages/DefineStage'
import { GroupsStage } from '@/components/stages/GroupsStage'
import { SponsorStage } from '@/components/stages/SponsorStage'
import { StakeholdersStage } from '@/components/stages/StakeholdersStage'
import { RiskStage } from '@/components/stages/RiskStage'
import { CommsStage } from '@/components/stages/CommsStage'
import { TrainingStage } from '@/components/stages/TrainingStage'
import { MilestonesStage } from '@/components/stages/MilestonesStage'
import { AdoptionStage } from '@/components/stages/AdoptionStage'
import { ResistanceStage } from '@/components/stages/ResistanceStage'
import { ExecutiveStage } from '@/components/stages/ExecutiveStage'
import { SustainmentStage } from '@/components/stages/SustainmentStage'
import { CloseoutStage } from '@/components/stages/CloseoutStage'

/** Maps each stage id to the component that renders its form. */
export const STAGE_COMPONENTS: Record<StageId, ComponentType> = {
  define: DefineStage,
  groups: GroupsStage,
  sponsor: SponsorStage,
  stakeholders: StakeholdersStage,
  risk: RiskStage,
  comms: CommsStage,
  training: TrainingStage,
  milestones: MilestonesStage,
  adoption: AdoptionStage,
  resistance: ResistanceStage,
  executive: ExecutiveStage,
  sustainment: SustainmentStage,
  closeout: CloseoutStage,
}
