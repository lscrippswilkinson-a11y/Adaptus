export const CHANGE_TYPES = [
  'Software / Technology Rollout',
  'Process Redesign',
  'Org Restructure',
  'Policy / Compliance',
  'Culture Shift',
  'Merger / Integration',
  'Other',
]

export const ESCALATION_ISSUE_TYPES = [
  'Technical blocker',
  'People resistance',
  'Budget decision',
  'Timeline risk',
  'Other',
]

export const ESCALATION_RESPONSE_TIMES = ['Same day', '24 hours', '48 hours', '1 week']

/** A communication channel plus a one-line strength and a one-line limitation. */
export interface ChannelInfo {
  name: string
  best: string
  limit: string
}

export const CHANNELS: ChannelInfo[] = [
  { name: 'All-Hands Meeting', best: 'Great for launching and creating shared momentum.', limit: 'Too broad for nuanced questions.' },
  { name: 'Email Blast', best: 'Creates a paper trail and reaches everyone at once.', limit: 'Low retention; people skim or miss it.' },
  { name: 'Slack / Teams Channel', best: 'Best for quick updates and in-the-moment questions.', limit: 'Easily buried as the feed scrolls past.' },
  { name: 'Manager Cascade', best: 'Best for behavioral change; people trust their direct manager most.', limit: "Less effective if managers aren't briefed properly." },
  { name: 'Town Hall', best: 'Good for casting the big-picture vision and taking questions openly.', limit: 'Can feel one-directional without real Q&A.' },
  { name: 'Intranet Post', best: 'A durable reference people can return to anytime.', limit: 'Passive; few go looking unless pointed there.' },
  { name: '1:1 Check-ins', best: 'Best for surfacing individual concerns and quiet resistance.', limit: 'Time-intensive and hard to scale.' },
  { name: 'Video Update', best: "Adds a personal, human tone text can't carry.", limit: 'High effort to produce and you can’t skim it.' },
  { name: 'Newsletter', best: 'Good for steady, ongoing reinforcement to a wide audience over time.', limit: 'Easy to tune out as routine; not for urgent or one-off news.' },
  { name: 'Demo', best: 'Best for showing the new tool or process in action so people believe it actually works.', limit: 'Needs a working build and prep; time-bound, so pair it with a recording.' },
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
    'All infrastructure, software, integrations, user accounts, permissions, tested in production. User provisioning complete, help desk routing confirmed, legacy cutover plan locked.',
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
    'A formal checkpoint, 24–48 hours before launch, where stakeholders review readiness criteria and make an explicit decision to proceed, delay, or cancel.',
}
