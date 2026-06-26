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
      define: { statement: '', scope: '', headcount: '', successLooks: '', whyNow: '' },
      groups: { groups: [] },
      sponsor: { name: '', role: '', sponsorActions: [], commitments: '', escalationRules: [], noSponsor: false },
      stakeholders: { rows: [] },
      risk: { items: [] },
      comms: { channels: [], keyMessages: '', schedule: [] },
      training: { items: [] },
      testing: { items: [] },
      dependencies: { items: [] },
      milestones: { owners: [], goLiveDate: '', launchChecklist: [], customTasks: [], checkoff: {}, taskOwners: {}, hiddenTasks: [] },
      adoption: { metrics: [], notes: '' },
      resistance: { items: [], generalPlan: '' },
      executive: { generated: false, ask: '', hideBranding: false },
      sustainment: { reinforcementOwner: '', checkpointDates: '', metrics: '', risks: '', recognitionPlan: '' },
      closeout: { wins: '', lessons: '', shoutouts: '' },
    },
  }
}
