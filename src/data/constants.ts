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

/**
 * An organization profile picked at the start of the Communications stage. It
 * tailors the rest of the stage, most importantly the channel options, to how
 * that kind of organization actually communicates. "Corporate" reuses the
 * general CHANNELS set; the others swap in their own vocabulary.
 */
export interface OrgProfile {
  id: string
  name: string
  blurb: string
  channels: ChannelInfo[]
}

export const ORG_PROFILES: OrgProfile[] = [
  {
    id: 'corporate',
    name: 'Corporate / Enterprise',
    blurb: 'A larger company with departments, layers of managers, and formal channels.',
    channels: CHANNELS,
  },
  {
    id: 'law-firm',
    name: 'Law Firm',
    blurb: 'A partnership: partners, associates, and support staff, with buy-in that flows top-down.',
    channels: [
      { name: 'Partner-Level Meeting', best: 'Win the decision-makers first; nothing moves without partner buy-in.', limit: 'Hard to schedule; partners guard their billable time.' },
      { name: 'Associate-Level Meeting', best: 'Reach the people doing the day-to-day work who feel the change most.', limit: 'Associates may hold back candid questions in a group.' },
      { name: 'Staff-Level Meeting', best: 'Brief the paralegals, secretaries, and admin who keep the firm running.', limit: 'Easy to skip, yet often the most affected by process change.' },
      { name: 'Practice Group Meeting', best: 'Tailor the message to how each practice area actually works.', limit: 'Keeps groups siloed; the firm-wide picture can get lost.' },
      { name: 'Firm-Wide Email / Memo', best: 'A formal record every attorney and staffer receives at once.', limit: 'Skimmed between matters; low retention on its own.' },
      { name: 'Managing Partner Announcement', best: 'Carries the most weight; signals this is a firm priority, not optional.', limit: 'Feels top-down if it is the only touch.' },
      { name: '1:1 Check-in', best: 'Surfaces quiet concerns from senior partners or key rainmakers.', limit: 'Time-intensive and hard to scale across the firm.' },
      { name: 'Firm Intranet / Portal Post', best: 'A durable reference filed where staff already look for policies.', limit: 'Passive; few go looking unless pointed there.' },
    ],
  },
  {
    id: 'smb',
    name: 'Small to Medium Business',
    blurb: 'A lean team where most people know each other and there are few layers to cross.',
    channels: [
      { name: 'Team Huddle', best: 'Everyone fits in one room; the fastest way to get the whole team aligned.', limit: 'Interrupts the day; tricky if people work different shifts.' },
      { name: 'All-Hands Meeting', best: 'Launch the change and take questions with the whole company at once.', limit: 'Infrequent, so it cannot carry the day-to-day detail.' },
      { name: 'Group Chat (Slack / Teams / WhatsApp)', best: 'Quick, informal updates the whole team already checks.', limit: 'Easily buried; important notes scroll away.' },
      { name: 'Owner / Founder Message', best: 'A direct word from the top lands hard in a small company.', limit: 'Can feel personal or pressured if it is the only channel.' },
      { name: 'Email', best: 'Reaches everyone at once and leaves a record.', limit: 'Low retention; people skim or miss it.' },
      { name: '1:1 Conversation', best: 'Personal and direct, and easy to do when the team is small.', limit: 'Time-intensive; the message can drift between chats.' },
      { name: 'Notice Board / Break Room', best: 'Catches frontline and non-desk staff who miss email and chat.', limit: 'Passive and easy to walk past.' },
      { name: 'Quick Video / Loom', best: 'A warm, personal update people can watch on their own time.', limit: 'Takes effort to record; not for urgent back-and-forth.' },
    ],
  },
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
  "Explain the 'why' to their team",
  'Attend and speak at the launch meeting',
  'Brief other leaders and win them over',
  'Remove roadblocks',
  'Step in on serious pushback',
  "Conduct visible 'walk the floor' check-ins",
  'Recognize and reward early users',
  'Review usage numbers monthly',
  'Send a follow-up message after launch',
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
    'All infrastructure, software, integrations, user accounts, permissions, tested in production. Everyone’s logins set up, help desk routing confirmed, and a plan locked for switching off the old system.',
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
    'A formal checkpoint, 24–48 hours before launch, where the team reviews what’s ready and makes an explicit decision to proceed, delay, or cancel.',
}
