/**
 * Core domain types for Adaptus, derived from the original artifact's data
 * shapes (emptyProject + SEED). A user runs multiple change-management
 * Projects; each project walks the same 13 guided stages and accrues XP. The
 * user's global level is a function of XP summed across all projects.
 */

/* ---- Gamification ---- */

export interface Level {
  level: number
  title: string
  xpNeeded: number
  color: string
  bg: string
  border: string
  badge: string
}

/* ---- Stage metadata ---- */

/** The three macro-phases the sections are grouped into. */
export type PhaseId = 'planning' | 'launch' | 'postlaunch'

export interface Phase {
  id: PhaseId
  label: string
}

export interface Stage {
  id: StageId
  label: string
  icon: string
  tag: string
  xp: number
  phase: PhaseId
}

/* ---- Shared enums (used by <select>s) ---- */

export type Impact = 'High' | 'Medium' | 'Low'
export type Readiness = 'High' | 'Medium' | 'Low'
export type Influence = 'High' | 'Medium' | 'Low'
export type Support = 'Advocate' | 'Neutral' | 'Resistant' | 'Unknown'
export type Severity = 'High' | 'Medium' | 'Low'

/* ---- Per-stage data shapes ---- */

export interface DefineData {
  statement: string
  scope: string
  successLooks: string
  whyNow: string
}

export interface ImpactedGroup {
  id: number
  name: string
  size: string
  impact: Impact
  readiness: Readiness
}
export interface GroupsData {
  groups: ImpactedGroup[]
}

export interface SponsorData {
  name: string
  role: string
  sponsorActions: string[]
  commitments: string
  escalationPath: string
}

export interface StakeholderRow {
  id: number
  name: string
  role: string
  influence: Influence
  support: Support
  action: string
}
export interface StakeholdersData {
  rows: StakeholderRow[]
}

export interface RiskItem {
  id: number
  category: string
  description: string
  likelihood: number
  impact: number
  mitigation: string
}
export interface RiskData {
  items: RiskItem[]
}

export type CommsPhase = 'before' | 'launch' | 'after'

export interface CommsTouchpoint {
  id: number
  phase: CommsPhase
  /** Timing, in the user's words, e.g. "6 weeks out", "Go-live day". */
  when: string
  audience: string
  channel: string
  message: string
}

export interface CommsData {
  channels: string[]
  keyMessages: string
  /** Planned communication touchpoints across the three launch phases. */
  schedule: CommsTouchpoint[]
}

export interface TrainingItem {
  id: number
  title: string
  audience: string
  format: string
  duration: string
  owner: string
  done: boolean
}
export interface TrainingData {
  items: TrainingItem[]
}

export interface MilestoneOwner {
  id: number
  name: string
  workstream: string
  email: string
}
/** A user-added task on the Launch Preparation Dashboard. */
export interface LaunchTask {
  id: number
  label: string
  done: boolean
}
export interface MilestonesData {
  owners: MilestoneOwner[]
  goLiveDate: string
  launchChecklist: string[]
  /** Ad-hoc tasks the user adds on the dashboard, beyond the readiness checklist. */
  customTasks: LaunchTask[]
  /**
   * Dashboard checked-off state for planning items that have no completion
   * field of their own (sponsor commitments, stakeholders, comms touchpoints,
   * risks, resistance, groups). Keyed by the task's stable key.
   */
  checkoff: Record<string, boolean>
}

/* ---- Testing & Validation (Planning) ---- */

export type TestStatus = 'Not started' | 'In progress' | 'Passed' | 'Failed'
export interface TestItem {
  id: number
  name: string
  type: string
  owner: string
  status: TestStatus
  notes: string
}
export interface TestingData {
  items: TestItem[]
}

/* ---- Cross-functional Dependencies (Planning) ---- */

export type DependencyType = 'Team' | 'System' | 'Vendor' | 'Other'
export type DependencyStatus = 'Not started' | 'In progress' | 'Ready' | 'At risk'
export interface Dependency {
  id: number
  name: string
  type: DependencyType
  owner: string
  neededBy: string
  status: DependencyStatus
}
export interface DependenciesData {
  items: Dependency[]
}

export interface AdoptionMetric {
  id: number
  name: string
  target: string
  current: string
  unit: string
}
export interface AdoptionData {
  metrics: AdoptionMetric[]
  notes: string
}

export interface ResistanceItem {
  id: number
  type: string
  group: string
  severity: Severity
  intervention: string
}
export interface ResistanceData {
  items: ResistanceItem[]
  generalPlan: string
}

export interface ExecutiveData {
  generated: boolean
}

export interface SustainmentData {
  reinforcementOwner: string
  checkpointDates: string
  metrics: string
  risks: string
  recognitionPlan: string
}

export interface CloseoutData {
  wins: string
  lessons: string
  shoutouts: string
}

export interface StageData {
  define: DefineData
  groups: GroupsData
  sponsor: SponsorData
  stakeholders: StakeholdersData
  risk: RiskData
  resistance: ResistanceData
  comms: CommsData
  training: TrainingData
  testing: TestingData
  dependencies: DependenciesData
  milestones: MilestonesData
  adoption: AdoptionData
  sustainment: SustainmentData
  executive: ExecutiveData
  closeout: CloseoutData
}

/** The 13 stage ids, in flow order. */
export type StageId = keyof StageData

/* ---- Project ---- */

export interface Project {
  id: number
  name: string
  type: string
  description: string
  targetDate: string
  createdAt: string
  totalXp: number
  /** ids of stages marked complete. */
  completedStages: StageId[]
  /** furthest stage index unlocked (0-based). */
  currentStage: number
  stageData: StageData
}

/* ---- Top-level app/view state ---- */

export type AppView = 'dashboard' | 'workspace'
