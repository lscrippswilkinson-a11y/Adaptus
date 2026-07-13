import type { CommsTouchpoint } from '@/types'
import { CHANNELS, SPONSOR_ACTIONS, TRAINING_FORMATS, type ChannelInfo } from '@/data/constants'

/**
 * A business-type profile chosen once at project creation. It tailors the five
 * core planning steps (Define, Identify Groups, Sponsor, Communication,
 * Training) to how that kind of organization actually works: its channels,
 * the groups it's made of, what a senior backer commits to, the training
 * formats that fit, and a coherent worked example for each stage.
 *
 * Large Corporation is the default and reuses the general option lists from
 * constants.ts; the others swap in their own vocabulary and examples. Each
 * profile's examples tell one consistent story so the guidance reads coherently
 * end to end.
 */
export interface BusinessProfile {
  id: string
  name: string
  /** One line describing the org, shown under the choice at project creation. */
  blurb: string
  /** Communication channels offered in the Comms stage. */
  channels: ChannelInfo[]
  /** Quick-add suggestions for the impacted-groups stage. */
  suggestedGroups: string[]
  /** Quick-add suggestions for what the senior backer will do. */
  sponsorActions: string[]
  /** Training-format chips offered in the Training stage. */
  trainingFormats: string[]
  /** Worked examples, one coherent scenario per business type. */
  examples: {
    define: { statement: string; scope: string; headcount: string; successLooks: string; whyNow: string }
    sponsor: { name: string; role: string; commitments: string }
    comms: { keyMessages: string; schedule: Omit<CommsTouchpoint, 'id'>[] }
  }
}

/** Channel sets for the non-corporate profiles (corporate reuses CHANNELS). */
const LAW_FIRM_CHANNELS: ChannelInfo[] = [
  { name: 'Partner-Level Meeting', best: 'Win the decision-makers first; nothing moves without partner buy-in.', limit: 'Hard to schedule; partners guard their billable time.' },
  { name: 'Associate-Level Meeting', best: 'Reach the people doing the day-to-day work who feel the change most.', limit: 'Associates may hold back candid questions in a group.' },
  { name: 'Staff-Level Meeting', best: 'Brief the paralegals, secretaries, and admin who keep the firm running.', limit: 'Easy to skip, yet often the most affected by process change.' },
  { name: 'Practice Group Meeting', best: 'Tailor the message to how each practice area actually works.', limit: 'Keeps groups siloed; the firm-wide picture can get lost.' },
  { name: 'Firm-Wide Email / Memo', best: 'A formal record every attorney and staffer receives at once.', limit: 'Skimmed between matters; low retention on its own.' },
  { name: 'Managing Partner Announcement', best: 'Carries the most weight; signals this is a firm priority, not optional.', limit: 'Feels top-down if it is the only touch.' },
  { name: '1:1 Check-in', best: 'Surfaces quiet concerns from senior partners or key rainmakers.', limit: 'Time-intensive and hard to scale across the firm.' },
  { name: 'Firm Intranet / Portal Post', best: 'A durable reference filed where staff already look for policies.', limit: 'Passive; few go looking unless pointed there.' },
]

const SMB_CHANNELS: ChannelInfo[] = [
  { name: 'Team Huddle', best: 'Everyone fits in one room; the fastest way to get the whole team aligned.', limit: 'Interrupts the day; tricky if people work different shifts.' },
  { name: 'All-Hands Meeting', best: 'Launch the change and take questions with the whole company at once.', limit: 'Infrequent, so it cannot carry the day-to-day detail.' },
  { name: 'Group Chat (Slack / Teams / WhatsApp)', best: 'Quick, informal updates the whole team already checks.', limit: 'Easily buried; important notes scroll away.' },
  { name: 'Owner / Founder Message', best: 'A direct word from the top lands hard in a small company.', limit: 'Can feel personal or pressured if it is the only channel.' },
  { name: 'Email', best: 'Reaches everyone at once and leaves a record.', limit: 'Low retention; people skim or miss it.' },
  { name: '1:1 Conversation', best: 'Personal and direct, and easy to do when the team is small.', limit: 'Time-intensive; the message can drift between chats.' },
  { name: 'Notice Board / Break Room', best: 'Catches frontline and non-desk staff who miss email and chat.', limit: 'Passive and easy to walk past.' },
  { name: 'Quick Video / Loom', best: 'A warm, personal update people can watch on their own time.', limit: 'Takes effort to record; not for urgent back-and-forth.' },
]

const MEDIUM_CORP_CHANNELS: ChannelInfo[] = [
  { name: 'All-Hands Meeting', best: 'Great for launching and creating shared momentum across the company.', limit: 'Too broad for nuanced, team-specific questions.' },
  { name: 'Manager Cascade', best: 'Best for behavioral change; people trust their direct manager most.', limit: "Less effective if managers aren't briefed properly." },
  { name: 'Email Update', best: 'Reaches everyone at once and leaves a clear record.', limit: 'Low retention; people skim or miss it.' },
  { name: 'Slack / Teams Channel', best: 'Best for quick updates and in-the-moment questions.', limit: 'Easily buried as the feed scrolls past.' },
  { name: 'Team Meeting', best: 'Tailors the message to how each team actually works.', limit: 'Message can drift if each lead frames it differently.' },
  { name: '1:1 Check-ins', best: 'Best for surfacing individual concerns and quiet resistance.', limit: 'Time-intensive and hard to scale.' },
  { name: 'Demo', best: 'Best for showing the new tool or process in action so people believe it works.', limit: 'Needs a working build and prep; pair it with a recording.' },
  { name: 'Video Update', best: "Adds a personal, human tone text can't carry.", limit: 'High effort to produce and you can’t skim it.' },
]

const MEDICAL_CHANNELS: ChannelInfo[] = [
  { name: 'All-Staff Huddle', best: 'Launch the change and align the whole practice quickly.', limit: 'Hard to gather everyone across shifts and sites.' },
  { name: 'Provider Meeting', best: 'Win over physicians and providers, whose buy-in sets the tone.', limit: 'Providers are time-pressed; keep it tight and clinical.' },
  { name: 'Nursing / Clinical Staff Meeting', best: 'Reach the nurses and clinical staff who live in the system all day.', limit: 'Shift patterns make full attendance tough.' },
  { name: 'Department Email', best: 'A formal record every clinician and staffer receives.', limit: 'Skimmed between patients; low retention on its own.' },
  { name: 'Shift Huddle', best: 'Quick, at-the-start-of-shift briefings that reach frontline staff.', limit: 'Brief by nature; not for detail or Q&A.' },
  { name: 'Intranet / Portal Post', best: 'A durable reference filed where staff already look for policies.', limit: 'Passive; few go looking unless pointed there.' },
  { name: '1:1 Check-in', best: 'Surfaces quiet concerns from key providers or leads.', limit: 'Time-intensive and hard to scale.' },
  { name: 'Super-User Floor Support', best: 'At-the-elbow help during go-live; the biggest driver of adoption.', limit: 'Needs trained super-users freed from their normal duties.' },
]

// Generic first, as the safe pick for anyone whose organization isn't one of the
// tailored templates, then the templates ordered smallest to largest and the
// specialist types last. Deliberately not led by Large Corporation: most people
// planning a rollout here aren't in one, and leading with it sets the wrong
// expectation of who this is for.
export const BUSINESS_TYPES: BusinessProfile[] = [
  {
    id: 'generic',
    name: 'Generic',
    blurb: 'Not sure, or none of the below? A plan that works for any organization.',
    channels: CHANNELS,
    suggestedGroups: ['Frontline staff', 'Team leads', 'Managers', 'Admin / back office', 'Finance', 'IT'],
    sponsorActions: SPONSOR_ACTIONS,
    trainingFormats: TRAINING_FORMATS,
    examples: {
      define: {
        statement:
          'We’re replacing the spreadsheets we track our work in with a single online tool. Everyone will enter their own updates in one place instead of emailing files back and forth.',
        scope: 'Every team that touches the process: the people doing the work day-to-day, their team leads, and the admin staff who chase the numbers.',
        headcount: 'About 120 people',
        successLooks: 'Within 60 days, 90% of the team update the new tool every week and the old spreadsheets are switched off.',
        whyNow: 'The spreadsheets break constantly and nobody trusts the numbers in them. Fixing it now, before our next busy stretch, saves everyone hours of rework.',
      },
      sponsor: {
        name: 'Alex Morgan',
        role: 'Head of Operations',
        commitments:
          'Open the launch meeting with why we’re making the change, use the new tool for their own weekly update from day one, and check in with team leads through the first two weeks to clear blockers.',
      },
      comms: {
        keyMessages:
          'The old spreadsheets are going away, so from [date] everyone puts their updates straight into the new tool. It takes a few minutes a week, it means the numbers are finally worth trusting, and there’s help on hand the whole way.',
        schedule: [
          { phase: 'before', when: '4 weeks out', audience: 'All staff', channel: 'All-Hands Meeting', message: 'Why we’re making the change, and roughly when' },
          { phase: 'before', when: '1 week out', audience: 'Team leads', channel: 'Manager Cascade', message: 'What changes for your team + when they’ll be trained' },
          { phase: 'launch', when: 'Go-live day', audience: 'All staff', channel: 'Email Update', message: 'The new tool is live: how to log in and add your first update' },
          { phase: 'launch', when: 'Launch week', audience: 'Team leads', channel: '1:1 Check-ins', message: 'Check your team has logged in; surface any blockers' },
          { phase: 'after', when: 'Week 2', audience: 'All staff', channel: 'Slack / Teams Channel', message: 'Answers to the most common questions so far' },
          { phase: 'after', when: 'Month 1', audience: 'All staff', channel: 'All-Hands Meeting', message: 'Early wins, and a reminder the spreadsheets are going away' },
        ],
      },
    },
  },
  {
    id: 'small-business',
    name: 'Small Business',
    blurb: 'A lean team where most people know each other and there are few layers to cross.',
    channels: SMB_CHANNELS,
    suggestedGroups: ['Floor / counter staff', 'Shift supervisors', 'Back-of-house', 'Bookkeeper', 'Owner / manager'],
    sponsorActions: [
      'Explain the why in person at a team huddle',
      'Be first to use the new system on the floor',
      'Work a shift alongside the team during week one',
      'Sort out problems on the spot',
      'Thank and recognize early adopters',
      'Check in with each person that first week',
    ],
    trainingFormats: ['Hands-on shift', 'Quick walkthrough', 'Cheat sheet', 'Short video', 'Buddy / shadowing', 'Huddle demo'],
    examples: {
      define: {
        statement:
          'We’re replacing our old register with a new POS and scheduling app. Staff will ring up sales, clock in, and pick up shifts in one system instead of the old till and the paper rota.',
        scope: 'All floor and counter staff, our two shift supervisors, and whoever covers the books.',
        headcount: 'About 35 people',
        successLooks: 'Within 30 days, every sale and shift runs through the new system, and we’ve stopped using the old register and paper schedule completely.',
        whyNow: 'The old till keeps jamming at the worst times and the paper rota causes no-shows. Switching now, before the holiday rush, means fewer headaches when we’re busiest.',
      },
      sponsor: {
        name: 'Sam Rivera',
        role: 'Owner / Manager',
        commitments:
          'Walk the team through why we’re switching at a huddle, be the first to ring up sales on the new POS, and work the floor with everyone during the first week so no one’s left stuck.',
      },
      comms: {
        keyMessages:
          'Our old register and paper schedule are going away, so from [date] we ring up sales and pick up shifts in the new app. It’s simple once you’ve done it a couple times, it means fewer jams and clearer schedules, and someone’s always around to help.',
        schedule: [
          { phase: 'before', when: '2 weeks out', audience: 'All staff', channel: 'Team Huddle', message: 'Why we’re switching, and roughly when' },
          { phase: 'before', when: '1 week out', audience: 'Shift supervisors', channel: '1:1 Conversation', message: 'What changes for your shift + when you’ll get shown the ropes' },
          { phase: 'launch', when: 'Go-live day', audience: 'All staff', channel: 'Group Chat (Slack / Teams / WhatsApp)', message: 'The new system is live: how to log in and ring your first sale' },
          { phase: 'launch', when: 'Launch week', audience: 'All staff', channel: 'Notice Board / Break Room', message: 'Quick cheat sheet pinned up where everyone can see it' },
          { phase: 'after', when: 'Week 2', audience: 'All staff', channel: 'Team Huddle', message: 'How it’s going, and answers to the common questions' },
          { phase: 'after', when: 'Month 1', audience: 'All staff', channel: 'Owner / Founder Message', message: 'A thank-you, early wins, and the old till is switched off' },
        ],
      },
    },
  },
  {
    id: 'medium-corp',
    name: 'Medium Corporation',
    blurb: 'A mid-sized company with a few teams and managers, but less formal machinery.',
    channels: MEDIUM_CORP_CHANNELS,
    suggestedGroups: ['Operations', 'Sales', 'Customer service', 'Finance / accounting', 'Team leads', 'IT'],
    sponsorActions: SPONSOR_ACTIONS,
    trainingFormats: TRAINING_FORMATS,
    examples: {
      define: {
        statement:
          'We’re moving from our old order and inventory spreadsheets to NetSuite. Operations, sales, and finance will all work from one live system instead of re-keying orders between tools.',
        scope: 'Our warehouse and operations crew, the sales desk, customer service, and the finance team, across our two sites.',
        headcount: 'About 600 people',
        successLooks: 'Within 60 days, every order flows through NetSuite with under 2% needing manual correction, and the old spreadsheets are switched off.',
        whyNow: 'We’ve outgrown the spreadsheets; double entry is causing shipping errors and late invoices. Fixing it now, before our busy season, protects both margin and customer trust.',
      },
      sponsor: {
        name: 'Marcus Bell',
        role: 'Chief Operating Officer',
        commitments:
          'Kick off the all-hands explaining why we’re moving to NetSuite, join the first week’s floor walk-throughs, and run the weekly ops numbers straight from NetSuite so the team sees leadership using it too.',
      },
      comms: {
        keyMessages:
          'Our order and inventory spreadsheets are going away, so from [date] every order goes through NetSuite. It’s quick once you know the steps, it means fewer shipping mix-ups and faster invoicing, and support is right there while you learn.',
        schedule: [
          { phase: 'before', when: '4 weeks out', audience: 'All staff', channel: 'All-Hands Meeting', message: 'Why we’re moving to NetSuite, and roughly when' },
          { phase: 'before', when: '1 week out', audience: 'Operations', channel: 'Team Meeting', message: 'What changes for your day-to-day + your training date' },
          { phase: 'launch', when: 'Go-live day', audience: 'All staff', channel: 'Email Update', message: 'NetSuite is live: how to log in and enter your first order' },
          { phase: 'launch', when: 'Launch week', audience: 'Team leads', channel: '1:1 Check-ins', message: 'Check your team is logging orders; surface any blockers' },
          { phase: 'after', when: 'Week 2', audience: 'All staff', channel: 'Slack / Teams Channel', message: 'Answers to the most common questions so far' },
          { phase: 'after', when: 'Month 1', audience: 'All staff', channel: 'All-Hands Meeting', message: 'Early wins, and a reminder the spreadsheets are going away' },
        ],
      },
    },
  },
  {
    id: 'large-corp',
    name: 'Large Corporation',
    blurb: 'A large company with departments, layers of managers, and formal channels.',
    channels: CHANNELS,
    suggestedGroups: ['Sales team', 'Customer Success', 'Marketing', 'Finance', 'IT', 'Regional managers', 'Frontline staff'],
    sponsorActions: SPONSOR_ACTIONS,
    trainingFormats: TRAINING_FORMATS,
    examples: {
      define: {
        statement:
          'We’re replacing our legacy CRM with Salesforce. Sales, customer success, and marketing will manage every account, deal, and case in one shared system instead of the old tool and a patchwork of spreadsheets.',
        scope: 'Our ~600 sales and customer-success reps across four regions, plus the marketing and operations teams who rely on the data.',
        headcount: 'About 4,000 people company-wide, with ~600 in the system daily',
        successLooks: 'Within 90 days of launch, 85% of reps log every new deal in Salesforce each week and we’ve retired the legacy CRM completely.',
        whyNow: 'The legacy CRM is out of support next year and its bad data is costing us deals. Standardizing now, before the new fiscal year, gives us one clean pipeline leadership can actually trust.',
      },
      sponsor: {
        name: 'Elena Torres',
        role: 'SVP of Sales',
        commitments:
          'Open the launch all-hands with why we’re moving to Salesforce, review pipeline in Salesforce (not the old exports) in every regional review, and require her own directs to run their forecasts from it from day one.',
      },
      comms: {
        keyMessages:
          'Our legacy CRM is being retired, so from [date] every deal, account, and case lives in Salesforce. It’s a few minutes to log as you go, it means cleaner pipeline and fewer status meetings, and there’s help on hand the whole way.',
        schedule: [
          { phase: 'before', when: '6 weeks out', audience: 'All staff', channel: 'All-Hands Meeting', message: 'Why we’re moving to Salesforce, and roughly when' },
          { phase: 'before', when: '2 weeks out', audience: 'Sales team', channel: 'Manager Cascade', message: 'What changes for your day-to-day + your training date' },
          { phase: 'launch', when: 'Go-live day', audience: 'All staff', channel: 'Email Blast', message: 'Salesforce is live: how to log in and enter your first deal' },
          { phase: 'launch', when: 'Launch week', audience: 'Managers', channel: '1:1 Check-ins', message: 'Check your team has logged in; surface any blockers' },
          { phase: 'after', when: 'Week 2', audience: 'All staff', channel: 'Intranet Post', message: 'Answers to the most common questions so far' },
          { phase: 'after', when: 'Month 1', audience: 'All staff', channel: 'All-Hands Meeting', message: 'Early wins, and a reminder the old CRM is going away' },
        ],
      },
    },
  },
  {
    id: 'law-firm',
    name: 'Law Firm',
    blurb: 'A partnership: partners, associates, and support staff, with buy-in that flows top-down.',
    channels: LAW_FIRM_CHANNELS,
    suggestedGroups: ['Partners', 'Associates', 'Paralegals', 'Legal secretaries / admin', 'Billing team', 'IT / practice support'],
    sponsorActions: [
      'Explain the why to the whole firm',
      'Speak at the firm-wide launch meeting',
      'Win over the other partners',
      'Clear roadblocks with the practice groups',
      'Step in on partner-level pushback',
      'Enter their own time in the new system from day one',
      'Recognize early adopters',
      'Review adoption at the monthly partner meeting',
    ],
    trainingFormats: ['Hands-on workshop', 'Lunch-and-learn', 'Job aid', '1:1 coaching', 'Short video', 'Self-paced module'],
    examples: {
      define: {
        statement:
          'We’re replacing our old desktop billing software with Clio, a cloud system everyone logs into through a web browser. Timekeepers will enter their own time directly instead of emailing it to the billing team.',
        scope: 'All 38 attorneys and paralegals, plus our 4-person billing team across two offices.',
        headcount: 'About 50 people',
        successLooks: 'Within 60 days of launch, 90% of timekeepers enter their own time in Clio every week and we’ve switched the old system off completely.',
        whyNow: 'Our current software is being shut down by the vendor next year, and chasing time-entry by email costs us roughly $40k a year in lost billable hours. Doing this now avoids a painful scramble later.',
      },
      sponsor: {
        name: 'Elena Torres',
        role: 'Managing Partner',
        commitments:
          'Record a 2-minute video for all staff explaining why we’re moving to Clio, co-present at the launch all-hands, and personally enter her own time in Clio from day one so everyone sees she’s doing it too.',
      },
      comms: {
        keyMessages:
          'Our old billing software is going away, so from [date] everyone enters their own time directly in Clio through the browser; no more emailing your hours to billing. It takes a few minutes a day, it means you get paid faster and chase fewer corrections, and there’s help on hand the whole way.',
        schedule: [
          { phase: 'before', when: '6 weeks out', audience: 'All staff', channel: 'Firm-Wide Email / Memo', message: 'Why we’re moving to Clio, and roughly when' },
          { phase: 'before', when: '2 weeks out', audience: 'Associates', channel: 'Associate-Level Meeting', message: 'What changes for your day-to-day + your training date' },
          { phase: 'launch', when: 'Go-live day', audience: 'All staff', channel: 'Firm-Wide Email / Memo', message: 'Clio is live: how to log in and enter your first time' },
          { phase: 'launch', when: 'Launch week', audience: 'Partners', channel: '1:1 Check-in', message: 'Check your group is logging time; surface any blockers' },
          { phase: 'after', when: 'Week 2', audience: 'All staff', channel: 'Firm Intranet / Portal Post', message: 'Answers to the most common questions so far' },
          { phase: 'after', when: 'Month 1', audience: 'All staff', channel: 'Managing Partner Announcement', message: 'Early wins, and a reminder the old system is going away' },
        ],
      },
    },
  },
  {
    id: 'medical-group',
    name: 'Medical Group',
    blurb: 'A clinic or practice: providers, nurses, and front-desk staff across care sites.',
    channels: MEDICAL_CHANNELS,
    suggestedGroups: ['Physicians / providers', 'Nurses / clinical staff', 'Medical assistants', 'Front desk / registration', 'Billing / coding', 'Practice managers', 'IT / informatics'],
    sponsorActions: [
      'Explain the why to providers and staff',
      'Speak at the launch huddle',
      'Bring the other physicians on board',
      'Clear roadblocks with department leads',
      'Step in on provider pushback',
      'Use the new system in their own clinic from go-live',
      'Recognize early adopters',
      'Review adoption at the monthly practice meeting',
    ],
    trainingFormats: ['Hands-on lab', 'At-the-elbow support', 'Super-user session', 'Job aid', 'eLearning module', 'Short video', 'Shift huddle demo'],
    examples: {
      define: {
        statement:
          'We’re moving from our old EHR to Epic. Providers, nurses, and front-desk staff will chart, order, and schedule in one system instead of the old EHR and the workarounds built around it.',
        scope: 'All providers, nursing and clinical staff, medical assistants, front-desk, and the billing team across our four clinic sites.',
        headcount: 'About 200 staff',
        successLooks: 'Within 90 days of go-live, providers close 90% of their notes the same day in Epic and we’ve fully retired the old EHR.',
        whyNow: 'The current EHR is being sunset by the vendor and its gaps are slowing care and billing. Moving now, before flu season, avoids a scramble when patient volumes peak.',
      },
      sponsor: {
        name: 'Dr. Elena Torres',
        role: 'Chief Medical Officer',
        commitments:
          'Open the launch huddle with why we’re moving to Epic, round with providers during go-live week, and chart in Epic in her own clinic from day one so the team sees leadership using it too.',
      },
      comms: {
        keyMessages:
          'Our old EHR is being retired, so from [date] we chart, order, and schedule in Epic. It takes some getting used to, but it means safer care and cleaner billing, and super-users will be on the floor to help the whole way.',
        schedule: [
          { phase: 'before', when: '6 weeks out', audience: 'All staff', channel: 'All-Staff Huddle', message: 'Why we’re moving to Epic, and roughly when' },
          { phase: 'before', when: '2 weeks out', audience: 'Nurses / clinical staff', channel: 'Nursing / Clinical Staff Meeting', message: 'What changes for your day-to-day + your training date' },
          { phase: 'launch', when: 'Go-live day', audience: 'All staff', channel: 'Shift Huddle', message: 'Epic is live: how to log in, and where your super-user is' },
          { phase: 'launch', when: 'Launch week', audience: 'Physicians / providers', channel: 'Super-User Floor Support', message: 'At-the-elbow help closing notes; surface any blockers' },
          { phase: 'after', when: 'Week 2', audience: 'All staff', channel: 'Intranet / Portal Post', message: 'Answers to the most common questions so far' },
          { phase: 'after', when: 'Month 1', audience: 'All staff', channel: 'Provider Meeting', message: 'Early wins, and a reminder the old EHR is going away' },
        ],
      },
    },
  },
]

/**
 * The default profile used for new projects and any project with no type set:
 * the org-neutral one, so nobody gets another kind of organization's vocabulary
 * by accident just because they didn't pick.
 */
export const DEFAULT_BUSINESS_TYPE = BUSINESS_TYPES.find((b) => b.id === 'generic') ?? BUSINESS_TYPES[0]

/** The tailored templates, i.e. everything the picker offers below Generic. */
export const TAILORED_BUSINESS_TYPES = BUSINESS_TYPES.filter((b) => b.id !== DEFAULT_BUSINESS_TYPE.id)

/** Resolve a project's business-type id to its profile, defaulting to Generic. */
export function getBusinessProfile(id?: string): BusinessProfile {
  return BUSINESS_TYPES.find((b) => b.id === id) ?? DEFAULT_BUSINESS_TYPE
}
