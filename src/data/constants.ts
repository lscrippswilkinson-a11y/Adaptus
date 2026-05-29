export const CHANGE_TYPES = [
  'Software / Technology Rollout',
  'Process Redesign',
  'Org Restructure',
  'Policy / Compliance',
  'Culture Shift',
  'Merger / Integration',
  'Other',
]

export const CHANNELS = [
  'All-Hands Meeting',
  'Email Blast',
  'Slack / Teams Channel',
  'Manager Cascade',
  'Town Hall',
  'Intranet Post',
  '1:1 Check-ins',
  'Video Update',
  'FAQ Document',
]

export const RISK_CATS = [
  'Technical',
  'People / Culture',
  'Process',
  'Timeline',
  'Resources',
  'Leadership',
  'Communication',
]

export const LAUNCH_ITEMS = [
  'Executive sponsor briefed',
  'IT/systems ready',
  'Training complete',
  'Comms sent',
  'Help desk briefed',
  'Rollback plan documented',
  'Success metrics defined',
  'Go/no-go decision made',
]

export const SPONSOR_ACTIONS = [
  "Communicate the 'why' to their direct reports",
  'Attend and speak at all-hands launch event',
  'Brief peer leaders and build coalition',
  'Remove identified blockers',
  'Respond to escalated resistance',
  "Conduct visible 'walk the floor' check-ins",
  'Recognize and reward early adopters',
  'Review adoption metrics monthly',
  'Send post-launch reinforcement message',
]

export const RESISTANCE_TYPES = [
  'Fear of job loss',
  'Extra workload',
  'Loss of status or expertise',
  'Distrust of leadership',
  'Lack of involvement in decisions',
  'Unclear benefit for the individual',
  'Past change failures',
  'Technical skills gap',
  'Cultural/values mismatch',
]

export const TRAINING_FORMATS = [
  'Workshop',
  'eLearning',
  'Video',
  'Job Aid',
  'Coaching',
  'Webinar',
  'Self-Study',
]

export const METRIC_UNITS = ['%', 'count', 'score', '$', 'days', 'hrs']

export const TEST_TYPES = [
  'User acceptance (UAT)',
  'Functional',
  'Integration',
  'Data migration',
  'Performance / load',
  'Security',
  'Pilot / dry run',
]

export const TEST_STATUSES = ['Not started', 'In progress', 'Passed', 'Failed'] as const

export const DEPENDENCY_TYPES = ['Team', 'System', 'Vendor', 'Other'] as const

export const DEPENDENCY_STATUSES = ['Not started', 'In progress', 'Ready', 'At risk'] as const

export const LAUNCH_EXPLAINERS: Record<string, string> = {
  'Executive sponsor briefed':
    'Your sponsor needs to know what\'s launching, what their visible role is on day one, and how to answer questions from their peers. An uninformed sponsor undermines credibility immediately.',
  'IT/systems ready':
    'All infrastructure — software, integrations, user accounts, permissions — tested in production. User provisioning complete, help desk routing confirmed, legacy cutover plan locked.',
  'Training complete':
    'All impacted users have had access to the training they need. For high-risk groups, confirm completion before go-live, not after.',
  'Comms sent':
    'All pre-launch communications delivered: manager briefings, all-staff announcements, FAQ distributed. People should know what\'s changing, when, what to do, and where to get help.',
  'Help desk briefed':
    'Support staff briefed on what\'s changing, common questions, and correct answers. An uninformed help desk amplifies anxiety instead of resolving it.',
  'Rollback plan documented':
    'Defines exactly what happens if go-live fails: which systems revert, who makes the call, what users are told, and how long you\'ll tolerate issues before reverting.',
  'Success metrics defined':
    'Pre-defined metrics, data sources, targets, and timeline for assessment. Without them, you can\'t claim success or diagnose failure after go-live.',
  'Go/no-go decision made':
    'A formal checkpoint — 24–48 hours before launch — where stakeholders review readiness criteria and make an explicit decision to proceed, delay, or cancel.',
}
