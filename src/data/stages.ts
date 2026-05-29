import type { Phase, Stage } from '@/types'

export const PHASES: Phase[] = [
  { id: 'planning', label: 'Planning' },
  { id: 'launch', label: 'Launch Preparation' },
  { id: 'postlaunch', label: 'Post-Launch' },
]

export const STAGES: Stage[] = [
  // Phase 1 — Planning
  { id: 'define', label: 'Define the Change', icon: '🎯', tag: 'Foundation', xp: 100, phase: 'planning', tier: 'essential' },
  { id: 'groups', label: 'Identify Groups', icon: '👥', tag: 'Scope', xp: 80, phase: 'planning', tier: 'essential' },
  { id: 'sponsor', label: 'Sponsor Action Plan', icon: '🏅', tag: 'Sponsorship', xp: 120, phase: 'planning', tier: 'essential' },
  { id: 'stakeholders', label: 'Build Your Coalition', icon: '🤝', tag: 'Stakeholders', xp: 120, phase: 'planning', tier: 'advanced' },
  { id: 'risk', label: 'Map the Resistance', icon: '⚡', tag: 'Risk & Readiness', xp: 150, phase: 'planning', tier: 'advanced' },
  { id: 'resistance', label: 'Resistance Management', icon: '🛡️', tag: 'Resistance', xp: 130, phase: 'planning', tier: 'advanced' },
  { id: 'comms', label: 'Communication Plan', icon: '📣', tag: 'Messaging', xp: 120, phase: 'planning', tier: 'essential' },
  { id: 'training', label: 'Training Roadmap', icon: '🎓', tag: 'Enablement', xp: 100, phase: 'planning', tier: 'essential' },
  { id: 'testing', label: 'Testing & Validation', icon: '🧪', tag: 'Validation', xp: 110, phase: 'planning', tier: 'advanced' },
  { id: 'dependencies', label: 'Cross-functional Dependencies', icon: '🔗', tag: 'Dependencies', xp: 110, phase: 'planning', tier: 'advanced' },

  // Phase 2 — Launch Preparation
  { id: 'milestones', label: 'Launch Preparation Dashboard', icon: '🚀', tag: 'Launch Readiness', xp: 150, phase: 'launch', tier: 'essential' },

  // Phase 3 — Post-Launch
  { id: 'adoption', label: 'Adoption Momentum', icon: '📈', tag: 'Tracking', xp: 100, phase: 'postlaunch', tier: 'essential' },
  { id: 'sustainment', label: 'Sustainment Plan', icon: '🔄', tag: 'Sustainment', xp: 150, phase: 'postlaunch', tier: 'advanced' },
  { id: 'executive', label: 'Launch Success Report', icon: '📊', tag: 'Report', xp: 200, phase: 'postlaunch', tier: 'essential' },
]

/** Section ids that make up the core (essential) path. */
export const ESSENTIAL_IDS = new Set(STAGES.filter((s) => s.tier === 'essential').map((s) => s.id))
export const ESSENTIAL_COUNT = ESSENTIAL_IDS.size
