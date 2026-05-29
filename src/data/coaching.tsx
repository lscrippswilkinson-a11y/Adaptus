import type { ReactNode } from 'react'
import type { AdoptionMetric, CommsTouchpoint, ImpactedGroup, StakeholderRow } from '@/types'

/**
 * Single source of truth for ALL in-app guidance copy: stage intros, per-field
 * coaching ("why" + worked example), and the text of the live insight
 * callouts. Edit wording here — components only reference these keys.
 *
 * Worked examples all use one coherent story: a ~50-person law firm replacing
 * its desktop billing software with "Clio" (cloud, browser-based, timekeepers
 * enter their own time).
 */

export type Tone = 'info' | 'priority' | 'warn' | 'success'
export interface Insight {
  tone: Tone
  text: ReactNode
}
export interface FieldCopy {
  label: string
  why: ReactNode
  example: string
}

const strong = (children: ReactNode) => <strong style={{ color: '#fff' }}>{children}</strong>

export const coaching = {
  /* ---------------------------------------------------------------- DEFINE */
  define: {
    icon: '🧭',
    intro: (
      <>
        {strong('First, get crystal clear on what’s changing.')} Before you can get anyone on board, you need to be able
        to explain the change in plain English — what’s different, who it touches, and why it’s worth the disruption.
        Don’t overthink it: answer the four questions below the way you’d explain it to a new hire over coffee.
        (Everything else you build later leans on these answers.)
      </>
    ),
    fields: {
      statement: {
        label: 'What is changing?',
        why: 'In one or two plain sentences, say what’s being replaced and what people will actually do differently day-to-day. If you can’t say it simply, your team won’t understand it either — and confusion is where change efforts quietly die.',
        example:
          'We’re replacing our old desktop billing software with Clio, a cloud system everyone logs into through a web browser. Timekeepers will enter their own time directly instead of emailing it to the billing team.',
      } satisfies FieldCopy,
      scope: {
        label: 'Who does this affect — and how many people?',
        why: 'List every team, role, or location the change touches, plus a rough headcount. This isn’t busywork: the number and spread of people is what determines how much communicating and training you’ll really need down the line.',
        example: 'All 38 attorneys and paralegals, plus our 4-person billing team — about 50 people across two offices.',
      } satisfies FieldCopy,
      successLooks: {
        label: 'How will you know it worked?',
        why: 'Pick something you can actually measure, with a number and a date. “People like it” can’t be measured; “90% logging their own time within 60 days” can. This becomes the finish line you’re steering everyone toward.',
        example:
          'Within 60 days of launch, 90% of timekeepers enter their own time in Clio every week and we’ve switched the old system off completely.',
      } satisfies FieldCopy,
      whyNow: {
        label: 'Why does this matter — and why now?',
        why: (
          <>
            People will ask “why are we doing this?” — especially when it’s inconvenient. A clear, honest reason is what
            gets them to give the change a real chance. (This is the very first thing the ADKAR model says every person
            needs: <strong style={{ color: '#B8D0DE' }}>Awareness</strong> of why the change is happening.)
          </>
        ),
        example:
          'Our current software is being shut down by the vendor next year, and chasing time-entry by email costs us roughly $40k a year in lost billable hours. Doing this now avoids a painful scramble later.',
      } satisfies FieldCopy,
    },
  },

  /* ---------------------------------------------------------------- GROUPS */
  groups: {
    icon: '👥',
    intro: (
      <>
        {strong('Not everyone feels a change the same way.')} The billing team that lives in the system all day is
        affected very differently from a partner who checks it once a week. List the groups of people this touches, then
        rate two things for each: how much their work <em>changes</em> (Impact) and how <em>ready</em> they are for it.
        That tells you exactly where to spend your time.
      </>
    ),
    /** Live coaching for a group from its impact + readiness combination. */
    insight(g: ImpactedGroup): Insight | null {
      if (!g.name.trim()) return null
      if (g.impact === 'High' && g.readiness === 'Low')
        return { tone: 'warn', text: `${g.name} is your #1 priority — heavily affected but not ready. They’ll need the most communication, training, and hands-on support, and they’re where a rollout most often stalls.` }
      if (g.impact === 'High' && g.readiness === 'High')
        return { tone: 'success', text: `${g.name} is in a great spot — big change, but they’re ready. Keep them informed and they’ll likely become your champions.` }
      if (g.impact === 'High' && g.readiness === 'Medium')
        return { tone: 'priority', text: `${g.name} is heavily affected and only partly ready. Invest early in the “why” and good training so they don’t slip toward resistance.` }
      if (g.impact === 'Low')
        return { tone: 'info', text: `${g.name} is only lightly affected — keep them in the loop, but spend your energy on the higher-impact groups.` }
      return { tone: 'info', text: `${g.name}: a moderate change. Steady communication and basic training should be enough.` }
    },
  },

  /* --------------------------------------------------------------- SPONSOR */
  sponsor: {
    icon: '🏅',
    intro: (
      <>
        {strong('Who’s the senior person visibly backing this?')} Your “sponsor” is the owner, partner, or department
        head everyone looks to — the person whose word carries weight. Their active, visible support is the single
        biggest predictor of whether a change actually sticks, more than budget or the tools you pick. People watch what
        leaders <em>do</em>, not what they announce. Name yours below, and pin down what they’ll actually do.
      </>
    ),
    fields: {
      name: {
        label: 'Who is your executive sponsor?',
        why: 'Name one specific senior person who will publicly own this change. Not a committee — one human everyone recognizes. If you can’t name them, that’s the first problem to solve, because a change with no visible owner drifts.',
        example: 'Elena Torres',
      } satisfies FieldCopy,
      role: {
        label: 'What’s their title and role?',
        why: 'Their seniority is the point — it’s the authority and trust that makes people take the change seriously. A partner or managing director carries weight a project coordinator simply can’t.',
        example: 'Managing Partner',
      } satisfies FieldCopy,
      commitments: {
        label: 'What has your sponsor committed to do?',
        why: 'Turn the boxes above into concrete promises — what, and when. The most powerful thing a sponsor can do is model the new behavior themselves, so people see “even the boss is doing this.” Write down what they’ve actually agreed to, so you can hold them to it.',
        example:
          'Record a 2-minute video for all staff explaining why we’re moving to Clio, co-present at the launch all-hands, and personally enter her own time in Clio from day one so everyone sees she’s doing it too.',
      } satisfies FieldCopy,
      escalationPath: {
        label: 'When something gets stuck, who fixes it — and how fast?',
        why: 'Changes hit blockers: a system isn’t ready, or someone flatly refuses to come along. Decide in advance how those reach your sponsor and how quickly they’ll act. A clear path means problems get unstuck in days, not quietly fester for weeks.',
        example:
          'Anything that blocks go-live gets raised to Elena the same day. If a timekeeper digs in and refuses to use Clio, their practice-group lead flags it to Elena, who has a direct conversation rather than letting it slide.',
      } satisfies FieldCopy,
    },
    /** Reacts to how many sponsor actions are committed. */
    actionsInsight(count: number): Insight | null {
      if (count === 0)
        return { tone: 'priority', text: 'Pick at least a few. A sponsor who does nothing visible is just a name on a slide — pick the actions yours will genuinely commit to and show up for.' }
      if (count >= 3)
        return { tone: 'success', text: 'That’s the right idea — these visible, repeated actions are exactly what move people off the fence. A sponsor who shows up beats one who just signs off.' }
      return null
    },
  },

  /* ---------------------------------------------------------- STAKEHOLDERS */
  stakeholders: {
    icon: '🤝',
    intro: (
      <>
        {strong('Change spreads through people, not memos.')} A few influential people saying “this is good” will do
        more than any announcement you send. Map the people who matter — how much <em>sway</em> they have (Influence)
        and where they stand today (Support) — so you know who to win over first. The goal is to move people toward{' '}
        <strong style={{ color: '#86efac' }}>Advocate</strong>.
      </>
    ),
    /** Live coaching for one stakeholder from influence + current stance. */
    rowInsight(r: StakeholderRow): Insight | null {
      if (!r.name.trim()) return null
      if (r.influence === 'High' && r.support === 'Resistant')
        return { tone: 'warn', text: `This is exactly where to spend your time — powerful and pushing back. Win ${r.name} over in a 1:1 before they sway others; don’t let it play out in public.` }
      if (r.influence === 'High' && r.support === 'Advocate')
        return { tone: 'success', text: `${r.name} is your strongest asset. Ask them to champion the change visibly — a respected voice saying “yes” moves more people than you can.` }
      if (r.influence === 'High' && (r.support === 'Neutral' || r.support === 'Unknown'))
        return { tone: 'priority', text: `${r.name} is influential but on the fence. A personal conversation now — before launch — is often what tips someone from neutral to advocate.` }
      if (r.influence === 'Low')
        return { tone: 'info', text: `Lower priority for now — keep ${r.name} informed, but focus your energy on the high-influence people first.` }
      return { tone: 'info', text: `${r.name} has some sway with peers. Worth a check-in so their take on the change stays positive.` }
    },
    /** Coalition-level summary across everyone mapped so far. */
    summary(rows: StakeholderRow[]): Insight | null {
      const named = rows.filter((r) => r.name.trim())
      if (named.length === 0) return null
      const adv = named.filter((r) => r.support === 'Advocate').length
      const res = named.filter((r) => r.support === 'Resistant').length
      if (res > adv)
        return { tone: 'warn', text: `You’ve got more people pushing back (${res}) than championing (${adv}). That’s a signal to slow down and win key people over individually before going wider — don’t out-run your support.` }
      if (adv > 0)
        return { tone: 'success', text: `Your coalition is forming (${adv} advocate${adv > 1 ? 's' : ''}). Keep leaning on them publicly — momentum builds when people see respected colleagues on board.` }
      return null
    },
  },

  /* ------------------------------------------------------------------ RISK */
  risk: {
    icon: '⚡',
    intro: (
      <>
        {strong('“What could go wrong?” — answered on purpose, not in a crisis.')} List the things that could trip up
        your rollout (people won’t use it, data doesn’t transfer, timing clashes with your busy season…). For each,
        you’ll rate how <em>likely</em> it is and how <em>bad</em> it’d be. Multiply the two and you get a risk score, so
        you know what to worry about first — and you write the fix <em>now</em>, while it’s cheap.
      </>
    ),
    /** Interprets the overall risk score for a non-expert. */
    scoreInsight(avg: number | null): Insight | null {
      if (avg === null) return null
      if (avg > 6)
        return { tone: 'warn', text: 'That’s a high overall risk score. Don’t set a go-live date until you have a real plan for your biggest risks below — high-risk changes that launch “and hope” are the ones that fail.' }
      if (avg > 3)
        return { tone: 'priority', text: 'Moderate risk — manageable, but stay on top of it. Focus first on anything you marked “Very Likely” or “Almost Certain,” since those are most likely to actually bite.' }
      return { tone: 'success', text: 'Low overall risk — a good sign. Still glance over the list now and then, because risks can creep up as the rollout gets closer.' }
    },
  },

  /* ----------------------------------------------------------------- COMMS */
  comms: {
    icon: '📣',
    intro: (
      <>
        {strong('Say it more often than feels necessary.')} People need to hear about a change five to seven times, in
        different ways, before it really sinks in — what feels repetitive to you is the first time it lands for many of
        them. And get ahead of the rumor mill: when leaders stay quiet, people fill the silence with worry. Decide what
        you’re saying, where, and how often.
      </>
    ),
    fields: {
      keyMessages: {
        label: 'What’s the core message people need to walk away with?',
        why: 'Boil it down to plain language: what’s changing, when, why it’s worth it for them, and where to get help. If you can’t fit it on a sticky note, it’s too complicated to repeat — and a message that isn’t repeatable won’t spread.',
        example:
          'Our old billing software is going away, so from June 1 everyone enters their own time directly in Clio through the browser — no more emailing your hours to billing. It takes a few minutes a day, it means you get paid faster and chase fewer corrections, and there’s help on hand the whole way.',
      } satisfies FieldCopy,
    },
    /** The structured communication-schedule planner. */
    schedule: {
      label: 'Map out your communication schedule',
      why: (
        <>
          A schedule isn’t “send some updates” — it’s a planned sequence of touchpoints. Lay out <em>who</em> hears{' '}
          <em>what</em>, through <em>which channel</em>, and <em>when</em>, across the three phases below. Front-load it:
          people need to hear a change several times before it sticks, so plan plenty of contact early and ease off as
          confidence grows. A blank phase is a gap where the rumor mill takes over.
        </>
      ),
      phases: {
        before: { label: 'Before launch', hint: 'Build awareness and answer “why” — well before anything actually changes.' },
        launch: { label: 'Launch week', hint: 'Make it real: what to do on day one, and exactly where to get help.' },
        after: { label: 'After launch', hint: 'Reinforce and listen — catch problems early and celebrate the first wins.' },
      },
      /** A model schedule users can load (law-firm Clio scenario). */
      example: [
        { phase: 'before', when: '6 weeks out', audience: 'All staff', channel: 'All-Hands Meeting', message: 'Why we’re moving to Clio, and roughly when' },
        { phase: 'before', when: '2 weeks out', audience: 'Timekeepers', channel: 'Manager Cascade', message: 'What changes for your day-to-day + your training date' },
        { phase: 'launch', when: 'Go-live day', audience: 'All staff', channel: 'Email Blast', message: 'Clio is live — how to log in and enter your first time' },
        { phase: 'launch', when: 'Launch week', audience: 'Managers', channel: '1:1 Check-ins', message: 'Check your team has logged in; surface any blockers' },
        { phase: 'after', when: 'Week 2', audience: 'All staff', channel: 'FAQ Document', message: 'Answers to the most common questions so far' },
        { phase: 'after', when: 'Month 1', audience: 'All staff', channel: 'All-Hands Meeting', message: 'Early wins, and a reminder the old system is going away' },
      ] as Omit<CommsTouchpoint, 'id'>[],
    },
    /** Shown when the user hasn't picked the manager-cascade channel. */
    managerCascade: {
      tone: 'info',
      text: 'People trust their own manager more than any company-wide announcement. Consider adding Manager Cascade so the message arrives from the person they actually listen to.',
    } satisfies Insight,
    /** Shown when email is the only channel chosen. */
    emailOnly: {
      tone: 'warn',
      text: 'Email alone is easy to skim and forget — retention is low. Pair it with at least one other channel so the message gets repeated and actually sticks.',
    } satisfies Insight,
  },

  /* -------------------------------------------------------------- TRAINING */
  training: {
    icon: '🎓',
    intro: (
      <>
        {strong('Telling people isn’t the same as teaching them.')} It’s not enough to say the billing system is
        changing — your timekeepers need to know <em>how</em> to enter their own time in Clio, and feel confident doing
        it without panicking. Match the training to the need: a short video is fine for “here’s what’s coming,” but
        learning a brand-new tool takes hands-on practice. List each activity below.
      </>
    ),
    managersFirst: {
      tone: 'info',
      text: 'Train your managers first, before their teams. A manager who’s unsure of the new way will quietly undermine it — often without meaning to — when their people come asking questions. Get them confident, and they’ll carry the rest.',
    } satisfies Insight,
  },

  /* ------------------------------------------------------------ MILESTONES */
  milestones: {
    icon: '🚀',
    intro: (
      <>
        {strong('Going live is a decision, not a date on the calendar.')} It’s tempting to pick a launch day and work
        backwards to it — but you only flip the switch when you’re genuinely ready. Use the checklist below to be honest
        with yourself about what’s actually done. Rushing a launch before the pieces are in place is one of the most
        common ways a change quietly falls apart.
      </>
    ),
    /** Reacts to how many launch-readiness items are checked. */
    readinessInsight(readyCount: number, total: number): Insight {
      const remaining = total - readyCount
      if (readyCount < 6)
        return {
          tone: readyCount < 4 ? 'warn' : 'priority',
          text: (
            <>
              Experienced change teams don’t go live until roughly 6 of 8 items are genuinely ready. You’ve got{' '}
              <strong>{readyCount} of {total}</strong> checked — that’s {remaining} still to go before you should set a
              firm date. It’s much cheaper to wait a week than to launch into chaos and lose people’s trust.
            </>
          ),
        }
      return {
        tone: 'success',
        text: (
          <>
            You’re in good shape — <strong>{readyCount} of {total}</strong> items ready. That’s the kind of readiness
            experienced teams look for before committing to a date. Lock in your go-live with confidence.
          </>
        ),
      }
    },
  },

  /* -------------------------------------------------------------- ADOPTION */
  adoption: {
    icon: '📈',
    intro: (
      <>
        {strong('Adoption means people actually using the change in their daily work')} — not just showing up to
        training. Someone can sit through every session and still go right back to the old way. So measure the real
        thing: logins, the share of timekeepers entering their own time, how often the old system gets touched. That’s
        how you know it’s landing.
      </>
    ),
    fields: {
      notes: {
        label: 'What are you hearing from the field?',
        why: 'Numbers tell you what’s happening; the field tells you why. Jot down what people are actually saying and doing — who’s sailing through, who’s quietly working around the new system, what keeps tripping them up. These notes are often where you spot a problem before it shows up in the metrics.',
        example:
          'Most timekeepers are entering their own time, but a few partners are still emailing hours to billing during busy weeks. Two people asked for a quick refresher on entering time on their phone — worth a short job aid.',
      } satisfies FieldCopy,
    },
    /** Reacts to how the metrics are tracking against their targets. */
    insight(metrics: AdoptionMetric[]): Insight | null {
      const scored = metrics
        .map((m) => {
          const cur = parseFloat(m.current)
          const tgt = parseFloat(m.target)
          if (!isFinite(cur) || !isFinite(tgt) || tgt === 0) return null
          return { name: m.name.trim() || 'A metric', ratio: cur / tgt }
        })
        .filter((x): x is { name: string; ratio: number } => x !== null)
      if (scored.length === 0) return null
      const behind = scored.find((s) => s.ratio < 0.5)
      if (behind)
        return { tone: 'priority', text: `${behind.name} is well behind target. Before you add more metrics, dig into WHY — is it a training gap, an old-way workaround, or just early days? Fixing the real cause beats tracking more numbers.` }
      if (scored.every((s) => s.ratio >= 0.8))
        return { tone: 'success', text: 'Your metrics are at or near their targets — that’s real adoption, not just attendance. Keep watching for slippage and start planning how you’ll sustain it.' }
      return null
    },
  },

  /* ------------------------------------------------------------ RESISTANCE */
  resistance: {
    icon: '🛡️',
    intro: (
      <>
        {strong('Resistance is normal — and it’s almost never about people being difficult.')} When someone pushes back,
        it’s usually fear, extra work landing on their plate, a sense they’re losing status, or simply not feeling heard.
        Naming the real reason here lets you fix the actual cause instead of fighting the symptoms. Listing it isn’t
        pessimism — it’s the surest way to keep your rollout on the rails.
      </>
    ),
    fields: {
      generalPlan: {
        label: 'General Resistance Management Plan',
        why: 'The items above are the resistance you can already see. This is your radar for the resistance you can’t — how will you keep listening once things go live, so a quiet grumble doesn’t turn into a full stall? Pulse surveys, manager check-ins, and an easy feedback channel all work; the key is deciding in advance what you’ll do when a warning sign shows up.',
        example:
          'We’ll run a short weekly pulse check (one or two questions) for the first eight weeks after launch. Any team that scores below 3 out of 5 gets a follow-up from their own manager within 48 hours, and we’ll keep an open feedback channel so people can flag problems without going through three layers of approval.',
      } satisfies FieldCopy,
    },
    /** Shown when any resistance item is marked High severity. */
    highSeverity: {
      tone: 'priority',
      text: (
        <>
          You’ve flagged a <strong>High-severity</strong> item — that’s the kind that can stall the whole rollout if
          it’s ignored. A High item needs a <strong>specific intervention</strong>, not a vague promise to “communicate
          more.” Name who does what, and by when, so it actually happens.
        </>
      ),
    } satisfies Insight,
  },

  /* ------------------------------------------------------------- EXECUTIVE */
  executive: {
    icon: '📊',
    intro: (
      <>
        {strong('An executive brief is a one-page update for a busy leader.')} Picture a partner who has ninety seconds
        between meetings. A good brief answers their four questions before they ask: <em>Are we on track? What could go
        wrong? Who’s on board? And what do you need from me?</em> You don’t write it from scratch — the button below
        pulls together everything you’ve already entered in the earlier stages into a clean summary.
      </>
    ),
    richerNote: {
      tone: 'info',
      text: 'The more of the earlier stages you’ve filled in — your groups, sponsor, risks, stakeholders, and launch checklist — the richer and more convincing this brief will be. If it looks thin, that’s usually a sign to go back and flesh out a stage or two first.',
    } satisfies Insight,
  },

  /* ----------------------------------------------------------- SUSTAINMENT */
  sustainment: {
    icon: '🔄',
    intro: (
      <>
        {strong('This is the plan that makes the change actually stick.')} Most changes don’t fail at launch — they fail
        quietly a few months later, when people drift back to the old way under pressure. Someone has to keep the new
        way alive until it’s just “how we do things.” (This is the part the ADKAR model calls{' '}
        <strong style={{ color: '#B8D0DE' }}>Reinforcement</strong> — simply, keeping it going so it lasts.)
      </>
    ),
    topNote: {
      tone: 'info',
      text: 'The single most powerful thing here is managers reinforcing the change with their own teams. A plan nobody owns is a plan that fades — so be specific about who keeps watch, and when.',
    } satisfies Insight,
    fields: {
      reinforcementOwner: {
        label: 'Who is accountable for keeping this change alive?',
        why: 'Name a real person, not a committee. Once the launch buzz fades, someone needs to keep an eye on whether people are sticking with the new way — and gently nudge things back on track when they slip. With no clear owner, that just quietly stops happening.',
        example:
          'Our Operations Manager owns sustaining Clio adoption for the first 6 months, with each office’s managing partner backing them up by checking their own team’s time-entry weekly.',
      } satisfies FieldCopy,
      checkpointDates: {
        label: 'When will you formally check that it’s sticking?',
        why: 'Put real dates in the calendar now — 30, 60, and 90 days after go-live is a good rhythm. If you wait until you ‘notice a problem,’ you’ll usually notice too late. Scheduled check-ins force you to look while there’s still time to fix things.',
        example:
          '30-day review: June 15 · 60-day: July 15 · 90-day: Aug 15. At each one we look at who’s entering their own time and what’s still tripping people up.',
      } satisfies FieldCopy,
      metrics: {
        label: 'How will you know the change is actually sticking?',
        why: 'Pick a couple of signs you can check at a glance — ideally the same finish-line numbers you set back at the start. The goal is to catch backsliding early, like usage quietly dropping or the old way creeping back in.',
        example:
          'At least 90% of timekeepers enter their own time in Clio every week, the old desktop software stays switched off, and the billing team gets zero time-entry emails.',
      } satisfies FieldCopy,
      risks: {
        label: 'What could pull people back to the old way?',
        why: 'Think about the moments when the new habit is most likely to break — a crazy-busy week, a new hire who missed training, or one influential person who never really got on board. Naming these now lets you head them off instead of being surprised by them.',
        example:
          'A busy trial month tempts people to fall back on emailing their hours to billing. A new attorney joins and never gets trained. A partner quietly keeps using their own spreadsheet.',
      } satisfies FieldCopy,
      recognitionPlan: {
        label: 'How will you recognize and reinforce the new way?',
        why: 'People keep doing what gets noticed. A little visible appreciation — and building the new behavior into normal check-ins — tells everyone the change is here to stay and worth the effort. It’s cheap, and it’s one of the strongest things you can do to make a change last.',
        example:
          'Call out the teams hitting 100% self-entry at the monthly all-hands, and add a simple “time entered on time in Clio” line to each manager’s monthly check-in so it stays on their radar.',
      } satisfies FieldCopy,
    },
  },

  /* -------------------------------------------------------------- CLOSEOUT */
  closeout: {
    icon: '🏆',
    intro: (
      <>
        {strong('The change is live — now bank what you learned.')} This is the step almost everyone skips, and it’s
        exactly how a company gets <em>better</em> at change over time. Spend ten honest minutes writing down what
        worked, what you’d do differently, and who carried it. The next change you run will be far easier because of
        these notes.
      </>
    ),
    banner: {
      title: 'Victory Lap',
      body: 'Capture what you learned. This becomes your organization’s institutional memory.',
    },
    fields: {
      wins: {
        label: 'What went well?',
        why: 'Write down the things that worked so well you’d do them again — and be specific enough that someone running the next change could copy your playbook. ‘Good communication’ doesn’t help future-you; ‘we briefed managers a week early’ does.',
        example:
          'Briefing managers a week before their teams was the biggest win — people came to training already knowing the “why.” Doing one office first as a pilot let us fix the trickiest setup before the wider rollout. Repeat both next time.',
      } satisfies FieldCopy,
      lessons: {
        label: 'What would you do differently?',
        why: 'This is about the next change, not pointing fingers. Frame everything forward — ‘next time we’d…’ — so it reads as a smarter plan, not a blame list. That keeps people honest and willing to share what really happened.',
        example:
          'We’d schedule the rollout away from a heavy trial month next time, and give brand-new hires a short Clio walkthrough on day one so nobody slips through untrained.',
      } satisfies FieldCopy,
      shoutouts: {
        label: 'Who went above and beyond?',
        why: 'Name the people who really carried this — the ones who answered the endless questions or led by example. People remember whether their effort was noticed, and recognizing them now makes them far more willing to help with the next big change.',
        example:
          'Maria in billing answered dozens of questions in the first two weeks and built the quick-reference card everyone now uses. The Westside managing partner entered her own time from day one and set the tone for her team.',
      } satisfies FieldCopy,
    },
  },
}
