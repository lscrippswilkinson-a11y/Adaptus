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
  // Phase 1: Planning
  { id: 'define', label: 'Define the Change', icon: Target, tag: 'Foundation', xp: 100, phase: 'planning', tier: 'essential' },
  { id: 'groups', label: 'Identify Groups', icon: Users, tag: 'Scope', xp: 80, phase: 'planning', tier: 'essential' },
  { id: 'sponsor', label: 'Get your leader behind it', icon: Award, tag: 'Your backer', xp: 120, phase: 'planning', tier: 'essential' },
  { id: 'stakeholders', label: 'Get key people on side', icon: Handshake, tag: 'Key people', xp: 120, phase: 'planning', tier: 'advanced' },
  { id: 'risk', label: 'What could go wrong', icon: Zap, tag: 'Risks', xp: 150, phase: 'planning', tier: 'advanced' },
  { id: 'resistance', label: 'Handling pushback', icon: Shield, tag: 'Pushback', xp: 130, phase: 'planning', tier: 'advanced' },
  { id: 'comms', label: 'Communication Plan', icon: Megaphone, tag: 'Messaging', xp: 120, phase: 'planning', tier: 'essential' },
  { id: 'training', label: 'Plan the training', icon: GraduationCap, tag: 'Training', xp: 100, phase: 'planning', tier: 'essential' },
  { id: 'testing', label: 'Test Before Launch', icon: FlaskConical, tag: 'Testing', xp: 110, phase: 'planning', tier: 'advanced' },
  { id: 'dependencies', label: 'What you’re waiting on', icon: Link2, tag: 'Waiting on', xp: 110, phase: 'planning', tier: 'advanced' },

  // Phase 2: Launch Preparation
  { id: 'milestones', label: 'Getting ready to launch', icon: Rocket, tag: 'Launch prep', xp: 150, phase: 'launch', tier: 'essential' },

  // Phase 3: Post-Launch
  { id: 'adoption', label: 'Are people using it?', icon: TrendingUp, tag: 'Real use', xp: 100, phase: 'postlaunch', tier: 'essential' },
  { id: 'sustainment', label: 'Make it stick', icon: RefreshCw, tag: 'Keep it going', xp: 150, phase: 'postlaunch', tier: 'advanced' },
  { id: 'executive', label: 'How the launch went', icon: BarChart3, tag: 'Report', xp: 200, phase: 'postlaunch', tier: 'essential' },
]

/** Section ids that make up the core (essential) path. */
export const ESSENTIAL_IDS = new Set(STAGES.filter((s) => s.tier === 'essential').map((s) => s.id))
export const ESSENTIAL_COUNT = ESSENTIAL_IDS.size
