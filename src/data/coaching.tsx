import type { ReactNode } from 'react'
import type { AdoptionMetric, CommsTouchpoint, ImpactedGroup, StakeholderRow } from '@/types'
import { getLang, t, tp } from '@/i18n'
import { renderRich, tr } from '@/i18n/rich'

/**
 * Single source of truth for ALL in-app guidance copy: stage intros, per-field
 * coaching ("why" + worked example), and the text of the live insight
 * callouts. Edit wording here; components only reference these keys.
 *
 * Worked examples all use one coherent story: a ~50-person law firm replacing
 * its desktop billing software with "Clio" (cloud, browser-based, timekeepers
 * enter their own time).
 *
 * Every literal below is an i18n source string. Prose passed through `tr()`
 * supports `**bold**` / `*emphasis*` inline, so a translated sentence keeps its
 * emphasis without being chopped into fragments.
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

/**
 * The opening line of a step's intro, rendered as a subtitle on its own line
 * above the paragraph rather than as a bold run inside it. Sized in `em` so it
 * scales with whatever it sits in: the big guided intro screen and the smaller
 * summary-view banner both get the right proportions from one definition.
 */
const lede = (children: ReactNode) => (
  <span
    style={{
      display: 'block',
      fontSize: '1.2em',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '-0.01em',
      color: 'var(--text)',
      marginBottom: '10px',
    }}
  >
    {children}
  </span>
)

function build() {
  return {
    /* -------------------------------------------------------------- DEFINE */
    define: {
      icon: '🧭',
      intro: (
        <>
          {lede(t('Start by naming the change.'))}{' '}
          {tr('To get your project started, we first need to identify what is changing, and who is affected, as simply as possible.')}
        </>
      ),
      fields: {
        statement: {
          label: t('What is changing?'),
          why: t('In one or two plain sentences, say what’s being replaced and what people will actually do differently day-to-day. If you can’t say it simply, your team won’t understand it either, and confusion is where change efforts quietly die.'),
          example: t('We’re replacing our old desktop billing software with Clio, a cloud system everyone logs into through a web browser. Timekeepers will enter their own time directly instead of emailing it to the billing team.'),
        } satisfies FieldCopy,
        scope: {
          label: t('Who does this change affect?'),
          why: t('List every team, role, or location the change touches. Name concrete groups, “Billing team,” “Field technicians,” rather than “everyone,” so you can plan for each one’s real needs later.'),
          example: t('All 38 attorneys and paralegals, plus our 4-person billing team across two offices.'),
        } satisfies FieldCopy,
        headcount: {
          label: t('About how many people in total?'),
          why: t('A rough headcount is enough. The number and spread of people is what determines how much communicating and training you’ll really need down the line, so even a ballpark helps you size the effort.'),
          example: t('About 50 people'),
        } satisfies FieldCopy,
        successLooks: {
          label: t('How will you know it worked?'),
          why: t('Pick something you can actually measure, with a number and a date. “People like it” can’t be measured; “90% logging their own time within 60 days” can. This becomes the finish line you’re steering everyone toward.'),
          example: t('Within 60 days of launch, 90% of timekeepers enter their own time in Clio every week and we’ve switched the old system off completely.'),
        } satisfies FieldCopy,
        whyNow: {
          label: t('Why does this matter, and why now?'),
          why: t('People will ask “why are we doing this?”, especially when it’s inconvenient. A clear, honest reason is what gets them to give the change a real chance, it’s the very first thing anyone needs before they’ll get on board.'),
          example: t('Our current software is being shut down by the vendor next year, and chasing time-entry by email costs us roughly $40k a year in lost billable hours. Doing this now avoids a painful scramble later.'),
        } satisfies FieldCopy,
      },
    },

    /* -------------------------------------------------------------- GROUPS */
    groups: {
      icon: '👥',
      intro: (
        <>
          {lede(t('Not everyone feels a change the same way.'))}{' '}
          {tr('List the groups this touches and rate two things for each: how much their work *changes* (Impact) and how *ready* they are (Readiness). You’ll see exactly where to spend your time.')}
        </>
      ),
      /** Point-of-entry copy for the guided, one-question-per-group flow. */
      wizard: {
        name: {
          label: t('Who is one group this change affects?'),
          why: t('Name a specific group of people, a team, role, or department, rather than “everyone.” Concrete groups like “Billing team” or “Field technicians” let you plan for each one’s real needs. You’ll be able to add more groups after this one.'),
        },
        impact: {
          label: t('How much does this change their day-to-day work?'),
          why: t('Impact means how much this group’s actual work changes: new tools, new steps, or a changed role. The groups whose jobs change the most are where a rollout most often stalls, so this tells you where to spend your energy.'),
        },
        readiness: {
          label: t('How ready is this group for the change?'),
          why: t('Readiness is how prepared this group is to take the change on: their awareness of it, their willingness, and their capacity. A group that’s heavily affected but not ready is your biggest risk; one that’s affected and ready can become your champions.'),
        },
      },
      /** Live coaching for a group from its impact + readiness combination. */
      insight(g: ImpactedGroup): Insight | null {
        if (!g.name.trim()) return null
        if (g.impact === 'High' && g.readiness === 'Low')
          return { tone: 'warn', text: tp('{group} is your #1 priority, heavily affected but not ready. They’ll need the most communication, training, and hands-on support, and they’re where a rollout most often stalls.', { group: g.name }) }
        if (g.impact === 'High' && g.readiness === 'High')
          return { tone: 'success', text: tp('{group} is in a great spot, big change, but they’re ready. Keep them informed and they’ll likely become your champions.', { group: g.name }) }
        if (g.impact === 'High' && g.readiness === 'Medium')
          return { tone: 'priority', text: tp('{group} is heavily affected and only partly ready. Invest early in the “why” and good training so they don’t slip toward resistance.', { group: g.name }) }
        if (g.impact === 'Low')
          return { tone: 'info', text: tp('{group} is only lightly affected, keep them in the loop, but spend your energy on the higher-impact groups.', { group: g.name }) }
        return { tone: 'info', text: tp('{group}: a moderate change. Steady communication and basic training should be enough.', { group: g.name }) }
      },
    },

    /* ------------------------------------------------------------- SPONSOR */
    sponsor: {
      icon: '🏅',
      intro: (
        <>
          {lede(t('Who’s the senior person visibly backing this?'))}{' '}
          {tr('A senior backer’s active, visible support is the single biggest predictor of whether a change sticks, more than budget or the tools you pick, because people watch what leaders *do*. In this step, we’ll identify that person and what they’ll commit to.')}
        </>
      ),
      /** Shown when the user declares there's no sponsor. */
      noSponsorRisk: t('Having no senior backer is the #1 reason changes fail — without a senior owner, decisions stall, funding dries up, and people quietly opt out. We’ve flagged this as a top risk on your status brief. Your most important next move is to find and recruit one: identify the leader who most feels the pain this change solves, and ask them to back it.'),
      fields: {
        name: {
          label: t('Who’s your senior backer?'),
          why: (
            <>
              <p style={{ margin: '0 0 10px' }}>{t('We recommend you identify the person backing this at this point and work through the next steps together.')}</p>
              <p style={{ margin: '0 0 10px' }}>{t('Name one specific senior person who will publicly own this change. Not a committee, one human everyone recognizes. If you can’t name them, that’s the first problem to solve, because a change with no visible owner drifts.')}</p>
              <p style={{ margin: 0 }}>{t('If you’re the senior person backing this, you can name yourself here.')}</p>
            </>
          ),
          example: t('Elena Torres'),
        } satisfies FieldCopy,
        role: {
          label: t('What’s their title and role?'),
          why: t('Their seniority is the point: it’s the authority and trust that makes people take the change seriously. A partner or managing director carries weight a project coordinator simply can’t.'),
          example: t('Managing Partner'),
        } satisfies FieldCopy,
        commitments: {
          label: t('What has your backer committed to do?'),
          why: t('Turn the boxes above into concrete promises: what, and when. The most powerful thing a backer can do is model the new behavior themselves, so people see “even the boss is doing this.” Write down what they’ve actually agreed to, so you can hold them to it.'),
          example: t('Record a 2-minute video for all staff explaining why we’re moving to Clio, co-present at the launch all-hands, and personally enter her own time in Clio from day one so everyone sees she’s doing it too.'),
        } satisfies FieldCopy,
        escalation: {
          label: t('When something gets stuck, who fixes it, and how fast?'),
          why: t('Changes hit blockers: a system isn’t ready, or someone flatly refuses to come along. Decide in advance who owns each kind of issue and how quickly they’ll act. A clear path means problems get unstuck in days, not quietly fester for weeks.'),
        },
      },
      /** Reacts to how many sponsor actions are committed. */
      actionsInsight(count: number): Insight | null {
        if (count === 0)
          return { tone: 'priority', text: t('Pick at least a few. A backer who does nothing visible is just a name on a slide; pick the actions yours will genuinely commit to and show up for.') }
        if (count >= 3)
          return { tone: 'success', text: t('That’s the right idea, these visible, repeated actions are exactly what move people off the fence. A backer who shows up beats one who just signs off.') }
        return null
      },
    },

    /* -------------------------------------------------------- STAKEHOLDERS */
    stakeholders: {
      icon: '🤝',
      intro: (
        <>
          {lede(t('Change spreads through people, not memos.'))}{' '}
          {tr('A few influential voices saying “this is good” beat any announcement you send. Map the people who matter by how much *sway* they have (Influence) and where they stand today (Support), so you know who to win over first.')}
        </>
      ),
      /** Live coaching for one stakeholder from influence + current stance. */
      rowInsight(r: StakeholderRow): Insight | null {
        if (!r.name.trim()) return null
        if (r.influence === 'High' && r.support === 'Resistant')
          return { tone: 'warn', text: tp('This is exactly where to spend your time, powerful and pushing back. Win {name} over in a 1:1 before they sway others; don’t let it play out in public.', { name: r.name }) }
        if (r.influence === 'High' && r.support === 'Advocate')
          return { tone: 'success', text: tp('{name} is your strongest asset. Ask them to champion the change visibly, a respected voice saying “yes” moves more people than you can.', { name: r.name }) }
        if (r.influence === 'High' && (r.support === 'Neutral' || r.support === 'Unknown'))
          return { tone: 'priority', text: tp('{name} is influential but on the fence. A personal conversation now, before launch, is often what tips someone from neutral to advocate.', { name: r.name }) }
        if (r.influence === 'Low')
          return { tone: 'info', text: tp('Lower priority for now, keep {name} informed, but focus your energy on the high-influence people first.', { name: r.name }) }
        return { tone: 'info', text: tp('{name} has some sway with peers. Worth a check-in so their take on the change stays positive.', { name: r.name }) }
      },
      /** Point-of-entry copy for the guided, one-stakeholder-at-a-time flow. */
      wizard: {
        name: {
          label: t('Who is one person who matters to this change?'),
          why: t('Name a specific individual, a leader, a respected peer, someone whose opinion others follow. Mapping people one at a time is how you spot exactly who to win over first. You can add more after this one.'),
        },
        influence: {
          label: t('How much sway does this person have?'),
          why: t('Influence is how far their opinion travels: can they approve, block, or change how others feel? The high-influence people are where your time pays off most, whichever way they’re currently leaning.'),
        },
        support: {
          label: t('Where do they stand on the change today?'),
          why: t('Be honest about their current stance: championing it, waiting to see, or pushing back. Knowing where someone starts tells you how far you need to move them, and how hard.'),
        },
        action: {
          label: t('What will you do to move them toward Advocate?'),
          why: t('For the people who matter, vague intentions don’t cut it; name the specific thing you’ll do: a 1:1 before the all-hands, an early demo, a role in the rollout. The goal is always to nudge them one step toward Advocate.'),
        },
      },
      /** Coalition-level summary across everyone mapped so far. */
      summary(rows: StakeholderRow[]): Insight | null {
        const named = rows.filter((r) => r.name.trim())
        if (named.length === 0) return null
        const adv = named.filter((r) => r.support === 'Advocate').length
        const res = named.filter((r) => r.support === 'Resistant').length
        if (res > adv)
          return { tone: 'warn', text: tp('You’ve got more people pushing back ({resistant}) than championing ({advocates}). That’s a signal to slow down and win key people over individually before going wider; don’t out-run your support.', { resistant: res, advocates: adv }) }
        if (adv > 0)
          return { tone: 'success', text: tp('Your supporters are lining up ({advocates} on board). Keep championing them publicly; momentum builds when people see respected colleagues backing it.', { advocates: adv }) }
        return null
      },
    },

    /* ---------------------------------------------------------------- RISK */
    risk: {
      icon: '⚡',
      intro: (
        <>
          {lede(t('“What could go wrong?”, answered on purpose, not in a crisis.'))}{' '}
          {tr('List what could trip up your rollout, then rate each one’s *likelihood* and *impact* to get a score that tells you what to worry about first. Write the fix *now*, while it’s cheap.')}
        </>
      ),
      /** Interprets the overall risk score for a non-expert. */
      scoreInsight(avg: number | null): Insight | null {
        if (avg === null) return null
        if (avg > 6)
          return { tone: 'warn', text: t('That’s a high overall risk score. Don’t set a go-live date until you have a real plan for your biggest risks below; high-risk changes that launch “and hope” are the ones that fail.') }
        if (avg > 3)
          return { tone: 'priority', text: t('Moderate risk, manageable, but stay on top of it. Focus first on anything you marked “Very Likely” or “Almost Certain,” since those are most likely to actually bite.') }
        return { tone: 'success', text: t('Low overall risk, a good sign. Still glance over the list now and then, because risks can creep up as the rollout gets closer.') }
      },
      /** Point-of-entry copy for the guided, one-risk-at-a-time flow. */
      wizard: {
        describe: {
          label: t('What’s one thing that could go wrong?'),
          why: t('Name a specific risk in plain terms: “people keep using the old system,” “data doesn’t transfer cleanly,” “launch clashes with year-end.” Naming it now, while it’s cheap to plan for, is how you stop it derailing you later.'),
        },
        rate: {
          label: t('How likely is it, and how bad would it be?'),
          why: t('Rate the chance it actually happens and the damage if it does. Multiplying the two gives a score, so the risks worth losing sleep over rise to the top and the unlikely-and-minor ones don’t eat your attention.'),
        },
        mitigation: {
          label: t('What’s your plan if this happens?'),
          why: t('Write the fix now, not in the heat of the moment: what you’ll do to prevent it, or to recover if it lands. A risk with a plan beside it is a risk you’ve largely defused.'),
        },
      },
    },

    /* --------------------------------------------------------------- COMMS */
    comms: {
      icon: '📣',
      intro: (
        <>
          {lede(t('Keep your teams and their leaders talking.'))}{' '}
          {tr('Clear, steady communication between each group and the leaders guiding them is what keeps everyone aligned through a change.')}
        </>
      ),
      fields: {
        keyMessages: {
          label: t('What’s the core message people need to walk away with?'),
          why: t('Boil it down to plain language: what’s changing, when, why it’s worth it for them, and where to get help. If you can’t fit it on a sticky note, it’s too complicated to repeat, and a message that isn’t repeatable won’t spread.'),
          example: t('Our old billing software is going away, so from June 1 everyone enters their own time directly in Clio through the browser; no more emailing your hours to billing. It takes a few minutes a day, it means you get paid faster and chase fewer corrections, and there’s help on hand the whole way.'),
        } satisfies FieldCopy,
      },
      /** The structured communication-schedule planner. */
      schedule: {
        label: t('Map out your communication schedule'),
        phases: {
          before: { label: t('Before launch'), hint: t('Build awareness and answer “why”, well before anything actually changes.') },
          launch: { label: t('Launch week'), hint: t('Make it real: what to do on day one, and exactly where to get help.') },
          after: { label: t('After launch'), hint: t('Reinforce and listen: catch problems early and celebrate the first wins.') },
        },
        /**
         * A model schedule users can load (law-firm Clio scenario).
         *
         * `when` stays canonical English on purpose: CommsStage parses it
         * ("6 weeks out" → -42 days) to date each touchpoint from go-live, and
         * then overwrites it with that ISO date, so the phrase is never shown.
         * `channel` is a stored value matched against the channel list, so it
         * stays English too. `audience` and `message` land in the user's own
         * plan and arrive translated.
         */
        example: [
          { phase: 'before', when: '6 weeks out', audience: t('All staff'), channel: 'All-Hands Meeting', message: t('Why we’re moving to Clio, and roughly when') },
          { phase: 'before', when: '2 weeks out', audience: t('Timekeepers'), channel: 'Manager Cascade', message: t('What changes for your day-to-day + your training date') },
          { phase: 'launch', when: 'Go-live day', audience: t('All staff'), channel: 'Email Blast', message: t('Clio is live: how to log in and enter your first time') },
          { phase: 'launch', when: 'Launch week', audience: t('Managers'), channel: '1:1 Check-ins', message: t('Check your team has logged in; surface any blockers') },
          { phase: 'after', when: 'Week 2', audience: t('All staff'), channel: 'Intranet Post', message: t('Answers to the most common questions so far') },
          { phase: 'after', when: 'Month 1', audience: t('All staff'), channel: 'All-Hands Meeting', message: t('Early wins, and a reminder the old system is going away') },
        ] as Omit<CommsTouchpoint, 'id'>[],
      },
      /** The per-touchpoint communication drafter: style guidance + prompts. */
      draft: {
        label: t('Help me draft this communication'),
        why: t('Planning the touchpoint is half the job; the other half is the actual words. Work through the prompts below and the program will assemble a draft you can fine-tune and copy out.'),
        greetingLabel: t('Greeting and appreciation'),
        greetingHint: t('People are more receptive to a warm email that opens with thanks for their time and their part in the change.'),
        greetingPlaceholder: t('e.g., Hi team, thank you for the care you’ve put into billing this year, it really doesn’t go unnoticed.'),
        contextLabel: t('Relevant context: why this, why now'),
        contextPlaceholder: t('e.g., Our old billing system is being retired at the end of May, so we’re all moving to Clio.'),
        messageLabel: t('Core message: the one thing they must take away'),
        messagePlaceholder: t('e.g., From June 1 you enter your own time directly in Clio.'),
        ctaLabel: t('Call to action: the one thing to do next, with a deadline'),
        ctaPlaceholder: t('e.g., Complete the 20-minute Clio training before May 30, book your slot via the link.'),
        closerLabel: t('Closer: a small thank-you and a look ahead'),
        closerHint: t('End with a lighter show of appreciation and a positive statement about where this takes you.'),
        closerPlaceholder: t('e.g., Thanks again for rolling with this, it’s going to make month-end far smoother for all of us.'),
        build: t('Build a draft from these →'),
        rebuild: t('Rebuild draft from prompts'),
        draftLabel: t('Your draft, edit freely, then copy'),
        copy: t('Copy'),
        copied: t('Copied ✓'),
        /** Assembles the structured prompts into an editable starting draft. */
        assemble(parts: { audience?: string; greeting?: string; context?: string; message?: string; cta?: string; closer?: string }): string {
          const lines: string[] = []
          if (parts.greeting?.trim()) lines.push(parts.greeting.trim(), '')
          else if (parts.audience?.trim()) lines.push(tp('Hi {audience},', { audience: parts.audience.trim() }), '')
          if (parts.context?.trim()) lines.push(parts.context.trim(), '')
          if (parts.message?.trim()) lines.push(parts.message.trim(), '')
          if (parts.cta?.trim()) lines.push(`👉 ${parts.cta.trim()}`, '')
          if (parts.closer?.trim()) lines.push(parts.closer.trim(), '')
          lines.push(t('Questions? [where to get help].'))
          return lines.join('\n')
        },
      },
      /** Shown when the user hasn't picked the manager-cascade channel. */
      managerCascade: {
        tone: 'info',
        text: t('People trust their own manager more than any company-wide announcement. Consider adding Manager Cascade so the message arrives from the person they actually listen to.'),
      } satisfies Insight,
      /** Shown when email is the only channel chosen. */
      emailOnly: {
        tone: 'warn',
        text: t('Email alone is easy to skim and forget; retention is low. Pair it with at least one other channel so the message gets repeated and actually sticks.'),
      } satisfies Insight,
    },

    /* ------------------------------------------------------------ TRAINING */
    training: {
      icon: '🎓',
      intro: (
        <>
          {lede(t('Telling people isn’t the same as teaching them.'))}{' '}
          {tr('Match the training to the need: a short video is fine for “here’s what’s coming,” but learning a brand-new tool takes hands-on practice. List each activity below.')}
        </>
      ),
      /** Point-of-entry copy for the guided, one-activity-at-a-time flow. */
      wizard: {
        title: {
          label: t('What’s one piece of training people will need?'),
          why: t('Telling people about a change isn’t the same as teaching them to do it. Name one activity, a hands-on workshop, a short video, a quick job aid, that builds the skill or confidence a group actually needs.'),
        },
        audience: {
          label: t('Who is it for?'),
          why: t('Name the audience this activity is for: different groups need different depth. A brand-new hire and a 10-year veteran don’t need the same session.'),
        },
        format: {
          label: t('In what format?'),
          why: t('Match the format to the need: a short video is fine for “here’s what’s coming,” but learning a brand-new tool takes hands-on practice.'),
        },
        owner: {
          label: t('Who runs it?'),
          why: t('Give it an owner. A training with no one accountable for delivering it tends not to happen; naming the owner is what turns a good intention into a session that’s actually booked.'),
        },
        date: {
          label: t('When does it run?'),
          why: t('Put it in the calendar. Training that stays “sometime before launch” gets squeezed out by the week it’s meant to happen in, and people arrive at go-live never having touched the thing. A date also lands this on your launch timeline, so you can see whether it leaves people enough room to practise before the change hits.'),
        },
      },
      managersFirst: {
        tone: 'info',
        text: t('Train your managers first, before their teams. A manager who’s unsure of the new way will quietly undermine it, often without meaning to, when their people come asking questions. Get them confident, and they’ll carry the rest.'),
      } satisfies Insight,
    },

    /* ------------------------------------------------------------- TESTING */
    testing: {
      icon: '🧪',
      intro: (
        <>
          {lede(t('Don’t take it on faith that it works, check.'))}{' '}
          {tr('Before you ask everyone to switch, prove the new way holds up: real people doing real tasks, your data carried over, the connections to other systems working. A passed test now beats a nasty surprise on launch day.')}
        </>
      ),
      /** Point-of-entry copy for the guided, one-test-at-a-time flow. */
      wizard: {
        name: {
          label: t('What’s one thing you’ll test before go-live?'),
          why: t('Don’t take it on faith that the new way works; name something concrete to prove out: real users doing real tasks, your data carried over, a connection to another system. A check now beats a surprise on launch day.'),
        },
        owner: {
          label: t('Who runs it, and where does it stand?'),
          why: t('Give each test an owner so it actually gets done, and track its status honestly. A test still sitting at “Not started” a week before launch is a warning worth seeing early.'),
        },
        notes: {
          label: t('What did you find?'),
          why: t('Jot down what happened: what passed, what broke, who signed off. These notes are your evidence that you’re ready, and your paper trail if something still needs fixing.'),
        },
      },
      /** Shown when any test is marked Failed. */
      failed: {
        tone: 'warn',
        text: t('You’ve got a failed test. Don’t schedule go-live around it; fix the cause and re-test until it passes, or you’ll be launching a known problem.'),
      } satisfies Insight,
    },

    /* -------------------------------------------------------- DEPENDENCIES */
    dependencies: {
      icon: '🔗',
      intro: (
        <>
          {lede(t('What does your launch quietly rely on?'))}{' '}
          {tr('Most rollouts depend on other people delivering first: IT provisioning accounts, a vendor flipping a switch, finance exporting data. Naming each one, with an owner and a date, turns invisible risks into things you can actually chase.')}
        </>
      ),
      /** Point-of-entry copy for the guided, one-dependency-at-a-time flow. */
      wizard: {
        name: {
          label: t('What does your launch rely on someone else delivering?'),
          why: t('Name one thing outside your direct control that has to be in place: accounts provisioned, a vendor switch flipped, data exported. Naming it turns an invisible risk into something you can actually chase.'),
        },
        detail: {
          label: t('Who owns it, and when do you need it?'),
          why: t('A dependency with no owner and no date is one that quietly slips. Pin down the specific person responsible and the date you need it by, so you can follow up before it’s late, not after.'),
        },
        status: {
          label: t('Where does it stand right now?'),
          why: t('Be honest about where each one is. Anything “At risk” is a classic launch-staller; flagging it now means you can chase it down while there’s still time to recover.'),
        },
      },
      /** Shown when any dependency is flagged At risk. */
      atRisk: {
        tone: 'warn',
        text: t('A dependency is flagged “At risk.” These are the classic launch-stallers; chase the owner now and agree a date, before it quietly slips and takes your go-live with it.'),
      } satisfies Insight,
    },

    /* ----------------------------------------------------------- DASHBOARD */
    dashboard: {
      icon: '🚀',
      intro: (
        <>
          {lede(t('This is your mission control for go-live.'))}{' '}
          {tr('It pulls together everything you planned and turns it into one checklist. Your **Launch Preparedness** score is simply the share of these tasks that are done; tick things off (here, or back in their own sections) and watch it climb. Don’t set a firm launch date until it’s comfortably high.', { color: 'var(--accent-text)' })}
        </>
      ),
    },

    /* -------------------------------------------------------------- REPORT */
    report: {
      icon: '📊',
      intro: (
        <>
          {lede(t('Tell the story of how the launch went.'))}{' '}
          {tr('This pulls your plan and real adoption numbers into a one-page summary you can save as a PDF for leadership. Fill in the wins, lessons, and shoutouts below.')}
        </>
      ),
    },

    /* ---------------------------------------------------------- MILESTONES */
    milestones: {
      icon: '🚀',
      intro: (
        <>
          {lede(t('Going live is a decision, not a date on the calendar.'))}{' '}
          {tr('It’s tempting to pick a launch day and work backwards to it, but you only flip the switch when you’re genuinely ready. Use the checklist below to be honest with yourself about what’s actually done. Rushing a launch before the pieces are in place is one of the most common ways a change quietly falls apart.')}
        </>
      ),
      /** Reacts to how many launch-readiness items are checked. */
      readinessInsight(readyCount: number, total: number): Insight {
        const remaining = total - readyCount
        if (readyCount < 6)
          return {
            tone: readyCount < 4 ? 'warn' : 'priority',
            text: renderRich(
              tp('Experienced change teams don’t go live until roughly 6 of 8 items are genuinely ready. You’ve got **{ready} of {total}** checked; that’s {remaining} still to go before you should set a firm date. It’s much cheaper to wait a week than to launch into chaos and lose people’s trust.', { ready: readyCount, total, remaining }),
            ),
          }
        return {
          tone: 'success',
          text: renderRich(
            tp('You’re in good shape, **{ready} of {total}** items ready. That’s the kind of readiness experienced teams look for before committing to a date. Lock in your go-live with confidence.', { ready: readyCount, total }),
          ),
        }
      },
    },

    /* ------------------------------------------------------------ ADOPTION */
    adoption: {
      icon: '📈',
      intro: (
        <>
          {lede(t('Adoption means people actually using the change in their daily work, not just showing up to training.'))}{' '}
          {tr('So measure the real thing: logins, the share of people doing it the new way, how often the old system still gets touched. That’s how you know it’s landing.')}
        </>
      ),
      /** Point-of-entry copy for the guided, one-metric-at-a-time flow. */
      wizard: {
        name: {
          label: t('What’s one sign that people are really using the change?'),
          why: t('Pick something that shows real use, not just attendance: logins, the share of people doing it the new way, how often the old way still gets touched. Name the metric and the unit you’ll measure it in.'),
        },
        targets: {
          label: t('What’s the target, and where are you now?'),
          why: t('Set the number that means “this is working,” and record where you stand today. The gap between the two is your adoption story; watching it close (or not) tells you whether the change is actually landing.'),
        },
        checkBy: {
          label: t('When will you next measure it?'),
          why: t('A number you only look at when someone asks isn’t really being tracked. Pick the date you’ll go and check it, and it lands on your timeline after go-live, so the plan keeps going once the change has shipped.'),
        },
      },
      fields: {
        notes: {
          label: t('What are you hearing from the field?'),
          why: t('Numbers tell you what’s happening; the field tells you why. Jot down what people are actually saying and doing: who’s sailing through, who’s quietly working around the new system, what keeps tripping them up. These notes are often where you spot a problem before it shows up in the metrics.'),
          example: t('Most timekeepers are entering their own time, but a few partners are still emailing hours to billing during busy weeks. Two people asked for a quick refresher on entering time on their phone, worth a short job aid.'),
        } satisfies FieldCopy,
      },
      /** Reacts to how the metrics are tracking against their targets. */
      insight(metrics: AdoptionMetric[]): Insight | null {
        const scored = metrics
          .map((m) => {
            const cur = parseFloat(m.current)
            const tgt = parseFloat(m.target)
            if (!isFinite(cur) || !isFinite(tgt) || tgt === 0) return null
            return { name: m.name.trim() || t('A metric'), ratio: cur / tgt }
          })
          .filter((x): x is { name: string; ratio: number } => x !== null)
        if (scored.length === 0) return null
        const behind = scored.find((s) => s.ratio < 0.5)
        if (behind)
          return { tone: 'priority', text: tp('{metric} is well behind target. Before you add more metrics, dig into WHY: is it a training gap, an old-way workaround, or just early days? Fixing the real cause beats tracking more numbers.', { metric: behind.name }) }
        if (scored.every((s) => s.ratio >= 0.8))
          return { tone: 'success', text: t('Your metrics are at or near their targets; that’s real adoption, not just attendance. Keep watching for slippage and start planning how you’ll sustain it.') }
        return null
      },
    },

    /* ---------------------------------------------------------- RESISTANCE */
    resistance: {
      icon: '🛡️',
      intro: (
        <>
          {lede(t('Pushback is normal, and it’s almost never about people being difficult.'))}{' '}
          {tr('It’s usually fear, extra work landing on their plate, a sense they’re losing status, or simply not feeling heard. Name the real reason and you can fix the cause instead of fighting the symptoms.')}
        </>
      ),
      /** Point-of-entry copy for the guided, one-source-at-a-time flow. */
      wizard: {
        source: {
          label: t('Where do you expect pushback to come from?'),
          why: t('Pick the most likely reason, and who it’s coming from. Pushback is rarely people being difficult; it’s usually fear, extra work, lost status, or not feeling heard. Naming the real cause lets you fix that, instead of fighting the symptoms.'),
        },
        severity: {
          label: t('How serious is this resistance?'),
          why: t('Judge how much this could slow or stall the rollout. High-severity pushback from a heavily affected group is the kind that quietly sinks a change if you don’t plan a real response for it.'),
        },
        intervention: {
          label: t('How will you address it?'),
          why: t('Be specific: who does what, by when? “Communicate more” isn’t a plan. A named action, a town hall, a coaching sprint, a one-on-one with the right person, is what actually moves someone off the back foot.'),
        },
      },
      fields: {
        generalPlan: {
          label: t('Your ongoing plan for pushback'),
          why: t('The items above are the pushback you can already see. This is your radar for the pushback you can’t: how will you keep listening once things go live, so a quiet grumble doesn’t turn into a full stall? Quick check-in surveys, manager check-ins, and an easy feedback channel all work; the key is deciding in advance what you’ll do when a warning sign shows up.'),
          example: t('We’ll run a short weekly pulse check (one or two questions) for the first eight weeks after launch. Any team that scores below 3 out of 5 gets a follow-up from their own manager within 48 hours, and we’ll keep an open feedback channel so people can flag problems without going through three layers of approval.'),
        } satisfies FieldCopy,
      },
      /** Shown when any resistance item is marked High severity. */
      highSeverity: {
        tone: 'priority',
        text: tr('You’ve flagged a **High-severity** item; that’s the kind that can stall the whole rollout if it’s ignored. A High item needs a **specific intervention**, not a vague promise to “communicate more.” Name who does what, and by when, so it actually happens.'),
      } satisfies Insight,
    },

    /* ----------------------------------------------------------- EXECUTIVE */
    executive: {
      icon: '📊',
      intro: (
        <>
          {lede(t('A status brief is a one-page update for a busy leader.'))}{' '}
          {tr('Picture a partner who has ninety seconds between meetings. A good brief answers their four questions before they ask: *Are we on track? What could go wrong? Who’s on board? And what do you need from me?* You don’t write it from scratch; the button below pulls together everything you’ve already entered in the earlier stages into a clean summary.')}
        </>
      ),
      richerNote: {
        tone: 'info',
        text: t('The more of the earlier stages you’ve filled in, your groups, backer, risks, key people, and launch checklist, the richer and more convincing this brief will be. If it looks thin, that’s usually a sign to go back and flesh out a stage or two first.'),
      } satisfies Insight,
    },

    /* --------------------------------------------------------- SUSTAINMENT */
    sustainment: {
      icon: '🔄',
      intro: (
        <>
          {lede(t('This is the plan that makes the change actually stick.'))}{' '}
          {tr('Most changes don’t fail at launch; they fail quietly months later, when people drift back to the old way under pressure. Someone has to keep the new way alive until it’s just “how we do things.”')}
        </>
      ),
      topNote: {
        tone: 'info',
        text: t('The single most powerful thing here is managers reinforcing the change with their own teams. A plan nobody owns is a plan that fades, so be specific about who keeps watch, and when.'),
      } satisfies Insight,
      fields: {
        reinforcementOwner: {
          label: t('Who is accountable for keeping this change alive?'),
          why: t('Name a real person, not a committee. Once the launch buzz fades, someone needs to keep an eye on whether people are sticking with the new way, and gently nudge things back on track when they slip. With no clear owner, that just quietly stops happening.'),
          example: t('Our Operations Manager owns sustaining Clio adoption for the first 6 months, with each office’s managing partner backing them up by checking their own team’s time-entry weekly.'),
        } satisfies FieldCopy,
        checkpointDates: {
          label: t('When will you formally check that it’s sticking?'),
          why: t('Put real dates in the calendar now: 30, 60, and 90 days after go-live is a good rhythm. If you wait until you ‘notice a problem,’ you’ll usually notice too late. Scheduled check-ins force you to look while there’s still time to fix things. Each date you set lands on your launch timeline, after go-live, so the plan doesn’t just stop the day it ships.'),
          example: '',
        } satisfies FieldCopy,
        metrics: {
          label: t('How will you know the change is actually sticking?'),
          why: t('Pick a couple of signs you can check at a glance, ideally the same finish-line numbers you set back at the start. The goal is to catch backsliding early, like usage quietly dropping or the old way creeping back in.'),
          example: t('At least 90% of timekeepers enter their own time in Clio every week, the old desktop software stays switched off, and the billing team gets zero time-entry emails.'),
        } satisfies FieldCopy,
        risks: {
          label: t('What could pull people back to the old way?'),
          why: t('Think about the moments when the new habit is most likely to break: a crazy-busy week, a new hire who missed training, or one influential person who never really got on board. Naming these now lets you head them off instead of being surprised by them.'),
          example: t('A busy trial month tempts people to fall back on emailing their hours to billing. A new attorney joins and never gets trained. A partner quietly keeps using their own spreadsheet.'),
        } satisfies FieldCopy,
        recognitionPlan: {
          label: t('How will you recognize and reinforce the new way?'),
          why: t('People keep doing what gets noticed. A little visible appreciation, and building the new behavior into normal check-ins, tells everyone the change is here to stay and worth the effort. It’s cheap, and it’s one of the strongest things you can do to make a change last.'),
          example: t('Call out the teams hitting 100% self-entry at the monthly all-hands, and add a simple “time entered on time in Clio” line to each manager’s monthly check-in so it stays on their radar.'),
        } satisfies FieldCopy,
      },
    },

    /* ------------------------------------------------------------ CLOSEOUT */
    closeout: {
      icon: '🏆',
      intro: (
        <>
          {lede(t('The change is live, now bank what you learned.'))}{' '}
          {tr('This is the step almost everyone skips, and it’s exactly how a company gets *better* at change over time. Spend ten honest minutes writing down what worked, what you’d do differently, and who carried it. The next change you run will be far easier because of these notes.')}
        </>
      ),
      banner: {
        title: t('Victory Lap'),
        body: t('Capture what you learned. This becomes your organization’s institutional memory.'),
      },
      fields: {
        wins: {
          label: t('What went well?'),
          why: t('Write down the things that worked so well you’d do them again, and be specific enough that someone running the next change could copy your playbook. ‘Good communication’ doesn’t help future-you; ‘we briefed managers a week early’ does.'),
          example: t('Briefing managers a week before their teams was the biggest win; people came to training already knowing the “why.” Doing one office first as a pilot let us fix the trickiest setup before the wider rollout. Repeat both next time.'),
        } satisfies FieldCopy,
        lessons: {
          label: t('What would you do differently?'),
          why: t('This is about the next change, not pointing fingers. Frame everything forward, ‘next time we’d…’, so it reads as a smarter plan, not a blame list. That keeps people honest and willing to share what really happened.'),
          example: t('We’d schedule the rollout away from a heavy trial month next time, and give brand-new hires a short Clio walkthrough on day one so nobody slips through untrained.'),
        } satisfies FieldCopy,
        shoutouts: {
          label: t('Who went above and beyond?'),
          why: t('Name the people who really carried this: the ones who answered the endless questions or led by example. People remember whether their effort was noticed, and recognizing them now makes them far more willing to help with the next big change.'),
          example: t('Maria in billing answered dozens of questions in the first two weeks and built the quick-reference card everyone now uses. The Westside managing partner entered her own time from day one and set the tone for her team.'),
        } satisfies FieldCopy,
      },
    },
  }
}

type Coaching = ReturnType<typeof build>

let cache: Coaching | null = null
let cacheLang: string | null = null

function data(): Coaching {
  if (!cache || cacheLang !== getLang()) {
    cache = build()
    cacheLang = getLang()
  }
  return cache
}

/**
 * The guidance copy, in the active language.
 *
 * This has to be lazy: the copy is built from `t()` calls, and this module is
 * imported long before a dictionary has loaded, so a plain object would freeze
 * whatever language happened to be live at import time. The proxy defers the
 * build to first property access and rebuilds it whenever the language changes,
 * which keeps every call site reading as the plain `coaching.groups.wizard` it
 * always was.
 */
export const coaching: Coaching = new Proxy({} as Coaching, {
  get: (_target, prop) => data()[prop as keyof Coaching],
})
