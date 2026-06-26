/**
 * Core domain types for Adaptus, derived from the original artifact's data
 * shapes (emptyProject + SEED). A user runs multiple change-management
 * Projects; each project walks the same 13 guided stages and accrues XP. The
 * user's global level is a function of XP summed across all projects.
 */

import type { LucideIcon } from 'lucide-react'

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

/** Essential steps form the core path; advanced steps are optional depth. */
export type StageTier = 'essential' | 'advanced'

export interface Stage {
  id: StageId
  label: string
  icon: LucideIcon
  tag: string
  xp: number
  phase: PhaseId
  tier: StageTier
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
  headcount: string
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

export interface EscalationRule {
  id: number
  issueType: string
  owner: string
  responseTime: string
}

/** One commitment in the sponsor's action plan; surfaces as a Launch dashboard checklist item. */
export interface SponsorAction {
  id: number
  text: string
  /** Completion is tracked on the Launch Preparation dashboard, not in the sponsor stage. */
  done: boolean
}
export interface SponsorData {
  name: string
  role: string
  sponsorActions: SponsorAction[]
  commitments: string
  escalationRules: EscalationRule[]
  /** User has explicitly declared there's no executive sponsor — flagged as a risk. */
  noSponsor: boolean
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
  /** The one-line core message / headline for this touchpoint. */
  message: string
  /** Why this, why now: background that makes the message land. */
  context?: string
  /** The single specific action this audience should take next. */
  cta?: string
  /** The assembled, editable communication ready to send/say. */
  draft?: string
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
  /** Which dashboard section it sits in (e.g. "Launch readiness"); defaults to "Your tasks". */
  group?: string
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
  /** Owner name per launch task, keyed by the task's stable key (see collectLaunchTasks). */
  taskOwners: Record<string, string>
  /** Due date (ISO yyyy-mm-dd) per launch task, keyed by the task's stable key. */
  taskDueDates: Record<string, string>
  /** Keys of auto-derived tasks the user removed from the dashboard view (planning data is untouched). */
  hiddenTasks: string[]
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
  /** The "what I need from you" ask shown on the shareable status brief. */
  ask: string
  /** White-label the shared brief: hide all "Adaptus" branding + the CTA. */
  hideBranding: boolean
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

/* ---- Collaboration ---- */

export type Role = 'owner' | 'editor' | 'viewer'

/** A person with access to a project (joined with their profile). */
export interface Member {
  userId: string
  email: string
  name: string
  avatarUrl: string
  role: Role
}

/** A pending email invite that hasn't been claimed yet. */
export interface Invite {
  id: string
  email: string
  role: Exclude<Role, 'owner'>
}

/** A shareable join link: anyone who opens it joins at the given role. */
export interface InviteLink {
  id: string
  token: string
  role: Exclude<Role, 'owner'>
}

/** A review comment left on one section (stage) of a project. */
export interface FeedbackItem {
  id: string
  stageId: StageId
  authorId: string
  authorName: string
  body: string
  resolved: boolean
  createdAt: string
}

export interface Project {
  id: string
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
  /** When set, the project's status brief is viewable (read-only) at /?share=<token>. */
  shareToken?: string | null
  /** The signed-in user's role on this project (client-only; not persisted). */
  role?: Role
}

/* ---- Top-level app/view state ---- */

export type AppView = 'dashboard' | 'workspace'
