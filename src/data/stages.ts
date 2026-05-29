import type { Stage } from '@/types'

export const STAGES: Stage[] = [
  { id: 'define', label: 'Define the Change', icon: '🎯', tag: 'Foundation', xp: 100 },
  { id: 'groups', label: 'Identify Groups', icon: '👥', tag: 'Scope', xp: 80 },
  { id: 'sponsor', label: 'Sponsor Action Plan', icon: '🏅', tag: 'Sponsorship', xp: 120 },
  { id: 'stakeholders', label: 'Build Your Coalition', icon: '🤝', tag: 'Stakeholders', xp: 120 },
  { id: 'risk', label: 'Map the Resistance', icon: '⚡', tag: 'Risk & Readiness', xp: 150 },
  { id: 'comms', label: 'Communication Plan', icon: '📣', tag: 'Messaging', xp: 120 },
  { id: 'training', label: 'Training Roadmap', icon: '🎓', tag: 'Enablement', xp: 100 },
  { id: 'milestones', label: 'Assign & Launch', icon: '🚀', tag: 'Launch Readiness', xp: 120 },
  { id: 'adoption', label: 'Adoption Momentum', icon: '📈', tag: 'Tracking', xp: 100 },
  { id: 'resistance', label: 'Resistance Management', icon: '🛡️', tag: 'Resistance', xp: 130 },
  { id: 'executive', label: 'Executive Brief', icon: '📊', tag: 'Leadership', xp: 80 },
  { id: 'sustainment', label: 'Sustainment Plan', icon: '🔄', tag: 'Sustainment', xp: 150 },
  { id: 'closeout', label: 'Victory Lap', icon: '🏆', tag: 'Closeout', xp: 200 },
]
