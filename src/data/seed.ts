import type { Project } from '@/types'
import { newProjectId } from '@/lib/id'

/** A fresh, empty project with every stage initialised to its default shape. */
export function emptyProject(): Project {
  return {
    id: newProjectId(),
    name: '',
    type: '',
    description: '',
    targetDate: '',
    createdAt: new Date().toISOString(),
    totalXp: 0,
    completedStages: [],
    currentStage: 0,
    stageData: {
      define: { statement: '', scope: '', successLooks: '', whyNow: '' },
      groups: { groups: [] },
      sponsor: { name: '', role: '', sponsorActions: [], commitments: '', escalationRules: [] },
      stakeholders: { rows: [] },
      risk: { items: [] },
      comms: { channels: [], keyMessages: '', schedule: [] },
      training: { items: [] },
      testing: { items: [] },
      dependencies: { items: [] },
      milestones: { owners: [], goLiveDate: '', launchChecklist: [], customTasks: [], checkoff: {} },
      adoption: { metrics: [], notes: '' },
      resistance: { items: [], generalPlan: '' },
      executive: { generated: false, ask: '' },
      sustainment: { reinforcementOwner: '', checkpointDates: '', metrics: '', risks: '', recognitionPlan: '' },
      closeout: { wins: '', lessons: '', shoutouts: '' },
    },
  }
}

/** Name of the auto-seeded demo project — also how we recognize it later. */
export const SAMPLE_NAME = 'Salesforce CRM Rollout'

/** True for the auto-seeded demo project (matched by name; renaming adopts it). */
export function isSampleProject(p: Project): boolean {
  return p.name === SAMPLE_NAME
}

/** Demo project shown on first run (ported from the artifact's SEED). */
export function createSeed(): Project {
  const p = emptyProject()
  p.name = SAMPLE_NAME
  p.type = 'Software / Technology Rollout'
  p.stageData.define = {
    statement: 'Replacing legacy CRM with Salesforce to unify pipeline visibility across Sales and CS.',
    scope: 'Sales (42), CS (18), RevOps (6) — 66 people',
    successLooks: '90% of reps logging in Salesforce by end of Q3.',
    whyNow: 'Board requested unified CRM data for fundraising metrics.',
  }
  p.stageData.groups = {
    groups: [
      { id: 1, name: 'Sales Team', size: '42', impact: 'High', readiness: 'Medium' },
      { id: 2, name: 'Customer Success', size: '18', impact: 'High', readiness: 'Low' },
      { id: 3, name: 'RevOps', size: '6', impact: 'Medium', readiness: 'High' },
    ],
  }
  p.stageData.sponsor = {
    name: 'Elena Torres',
    role: 'Chief Revenue Officer',
    sponsorActions: [
      "Communicate the 'why' to their direct reports",
      'Attend and speak at all-hands launch event',
      'Remove identified blockers',
    ],
    commitments: 'Personal video to all staff, co-present at all-hands, monthly check-in with project lead.',
    escalationRules: [
      { id: 1, issueType: 'Technical blocker', owner: 'Elena Torres', responseTime: 'Same day' },
      { id: 2, issueType: 'Budget decision', owner: 'Elena + CFO', responseTime: '48 hours' },
      { id: 3, issueType: 'People resistance', owner: 'Practice-group lead → Elena', responseTime: '1 week' },
    ],
  }
  p.stageData.stakeholders = {
    rows: [
      { id: 1, name: 'Priya Sharma', role: 'VP Sales', influence: 'High', support: 'Advocate', action: 'Co-present at all-hands' },
      { id: 2, name: 'Marcus Webb', role: 'Head of CS', influence: 'High', support: 'Neutral', action: '1:1 demo before all-hands' },
      { id: 3, name: 'Dan Frisco', role: 'Sr. AE', influence: 'Medium', support: 'Resistant', action: 'Include in pilot group' },
    ],
  }
  p.stageData.risk = {
    items: [
      { id: 1, category: 'People / Culture', description: 'Sales resistant to logging calls', likelihood: 4, impact: 4, mitigation: 'Position as time-saver, show AI-assisted logging' },
      { id: 2, category: 'Technical', description: 'Data migration may be incomplete', likelihood: 3, impact: 5, mitigation: 'Run parallel systems for 2 weeks' },
    ],
  }
  p.stageData.comms = {
    channels: ['All-Hands Meeting', 'Manager Cascade', 'Email Blast'],
    keyMessages: 'Moving to Salesforce to give everyone better visibility and cut manual reporting.',
    schedule: [
      { id: 9101, phase: 'before', when: '4 weeks out', audience: 'All Sales + CS', channel: 'All-Hands Meeting', message: 'Why we’re moving to Salesforce and what’s changing' },
      { id: 9102, phase: 'launch', when: 'Go-live day', audience: 'All staff', channel: 'Manager Cascade', message: 'It’s live — how to log in and log your first deal' },
      { id: 9103, phase: 'after', when: 'Week 2', audience: 'Sales managers', channel: '1:1 Check-ins', message: 'How’s it going? Surface blockers early' },
    ],
  }
  p.stageData.training = {
    items: [
      { id: 1, title: 'Salesforce basics workshop', audience: 'All Sales + CS', format: 'Workshop', duration: '90 min', owner: 'Priya Sharma', done: true },
      { id: 2, title: 'Manager briefing', audience: 'People managers', format: 'Webinar', duration: '45 min', owner: 'Elena Torres', done: false },
    ],
  }
  p.stageData.testing = {
    items: [
      { id: 1, name: 'UAT with 5 pilot reps', type: 'User acceptance (UAT)', owner: 'RevOps', status: 'Passed', notes: 'Pilot group signed off' },
      { id: 2, name: 'Legacy data migration check', type: 'Data migration', owner: 'IT', status: 'In progress', notes: '' },
      { id: 3, name: 'Email→Salesforce integration', type: 'Integration', owner: 'IT', status: 'Not started', notes: '' },
    ],
  }
  p.stageData.dependencies = {
    items: [
      { id: 1, name: 'Salesforce vendor provisioning', type: 'Vendor', owner: 'Elena Torres', neededBy: '2025-09-01', status: 'Ready' },
      { id: 2, name: 'IT account provisioning', type: 'System', owner: 'IT', neededBy: '2025-09-10', status: 'In progress' },
      { id: 3, name: 'Finance data export sign-off', type: 'Team', owner: 'Finance', neededBy: '2025-09-05', status: 'At risk' },
    ],
  }
  p.stageData.milestones = {
    owners: [{ id: 1, name: 'Priya Sharma', workstream: 'Sales Readiness', email: 'priya@co.com' }],
    goLiveDate: new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10),
    launchChecklist: ['Executive sponsor briefed', 'IT/systems ready', 'Comms sent', 'Success metrics defined'],
    customTasks: [
      { id: 1, label: 'Book launch-day comms slot', done: true },
      { id: 2, label: 'Prepare go-live FAQ doc', done: false },
    ],
    checkoff: {
      "sp:Communicate the 'why' to their direct reports": true,
      'sp:Attend and speak at all-hands launch event': true,
      'sh:1': true,
      'cm:9101': true,
    },
  }
  p.stageData.adoption = {
    metrics: [
      { id: 1, name: 'Active Salesforce users', target: '60', current: '38', unit: '%' },
      { id: 2, name: 'Training completion', target: '100', current: '72', unit: '%' },
    ],
    notes: 'Sales ops strong. CS lagging — dedicated coaching added weeks 3-4.',
  }
  p.stageData.resistance = {
    items: [
      { id: 1, type: 'Fear of job loss', group: 'Sales Team', severity: 'Medium', intervention: 'Town hall with Elena + demo of AI-assisted logging to show time savings' },
      { id: 2, type: 'Extra workload', group: 'Customer Success', severity: 'High', intervention: 'Dedicated CS onboarding sprint with hands-on support for 2 weeks post-launch' },
    ],
    generalPlan: 'Weekly pulse survey for 8 weeks. Any score below 3/5 triggers manager check-in within 48 hours.',
  }
  p.stageData.executive = {
    generated: false,
    ask: 'Email all staff before go-live reinforcing the “why,” and join the launch all-hands. We also need CS coaching capacity confirmed for weeks 3–4.',
  }
  p.completedStages = ['define', 'groups', 'sponsor', 'stakeholders', 'risk', 'resistance', 'comms', 'training', 'testing', 'dependencies']
  p.currentStage = 10 // Launch Preparation Dashboard
  p.totalXp = 1140
  return p
}
