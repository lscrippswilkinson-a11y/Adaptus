import {
  Target,
  Users,
  Award,
  Handshake,
  Zap,
  Shield,
  Megaphone,
  GraduationCap,
  FlaskConical,
  Link2,
  Rocket,
  TrendingUp,
  RefreshCw,
  BarChart3,
} from 'lucide-react'
import type { Phase, Stage } from '@/types'

export const PHASES: Phase[] = [
  { id: 'planning', label: 'Planning' },
  { id: 'launch', label: 'Launch Preparation' },
  { id: 'postlaunch', label: 'Post-Launch' },
]

export const STAGES: Stage[] = [
  // Phase 1 — Planning
  { id: 'define', label: 'Define the Change', icon: Target, tag: 'Foundation', xp: 100, phase: 'planning', tier: 'essential' },
  { id: 'groups', label: 'Identify Groups', icon: Users, tag: 'Scope', xp: 80, phase: 'planning', tier: 'essential' },
  { id: 'sponsor', label: 'Sponsor Action Plan', icon: Award, tag: 'Sponsorship', xp: 120, phase: 'planning', tier: 'essential' },
  { id: 'stakeholders', label: 'Build Your Coalition', icon: Handshake, tag: 'Stakeholders', xp: 120, phase: 'planning', tier: 'advanced' },
  { id: 'risk', label: 'Map the Resistance', icon: Zap, tag: 'Risk & Readiness', xp: 150, phase: 'planning', tier: 'advanced' },
  { id: 'resistance', label: 'Resistance Management', icon: Shield, tag: 'Resistance', xp: 130, phase: 'planning', tier: 'advanced' },
  { id: 'comms', label: 'Communication Plan', icon: Megaphone, tag: 'Messaging', xp: 120, phase: 'planning', tier: 'essential' },
  { id: 'training', label: 'Training Roadmap', icon: GraduationCap, tag: 'Enablement', xp: 100, phase: 'planning', tier: 'essential' },
  { id: 'testing', label: 'Testing & Validation', icon: FlaskConical, tag: 'Validation', xp: 110, phase: 'planning', tier: 'advanced' },
  { id: 'dependencies', label: 'Cross-functional Dependencies', icon: Link2, tag: 'Dependencies', xp: 110, phase: 'planning', tier: 'advanced' },

  // Phase 2 — Launch Preparation
  { id: 'milestones', label: 'Launch Preparation Dashboard', icon: Rocket, tag: 'Launch Readiness', xp: 150, phase: 'launch', tier: 'essential' },

  // Phase 3 — Post-Launch
  { id: 'adoption', label: 'Adoption Momentum', icon: TrendingUp, tag: 'Tracking', xp: 100, phase: 'postlaunch', tier: 'essential' },
  { id: 'sustainment', label: 'Sustainment Plan', icon: RefreshCw, tag: 'Sustainment', xp: 150, phase: 'postlaunch', tier: 'advanced' },
  { id: 'executive', label: 'Launch Success Report', icon: BarChart3, tag: 'Report', xp: 200, phase: 'postlaunch', tier: 'essential' },
]

/** Section ids that make up the core (essential) path. */
export const ESSENTIAL_IDS = new Set(STAGES.filter((s) => s.tier === 'essential').map((s) => s.id))
export const ESSENTIAL_COUNT = ESSENTIAL_IDS.size
