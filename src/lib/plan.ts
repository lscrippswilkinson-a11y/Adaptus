/**
 * Plans and entitlements.
 *
 * Free gets the whole essential method — every essential stage, every coaching
 * prompt, the shared link, the PDF and the deck — on one project. What Premium
 * buys is (a) more than one project, (b) the reports being *yours* (your logo,
 * your colour, no Adaptus mark), (c) the deeper premium steps, and (d) the
 * portfolio view: the org heat map and the history/trend charts, both of which
 * only mean anything once you're running more than one change over time.
 *
 * The plan is a per-USER fact, not a per-project one, so it lives on
 * `profiles.plan` rather than in the project JSONB. That matters for the
 * shared-brief page too: an anonymous recipient has no session, so the brief's
 * branding is decided by the OWNER's plan, which the share RPC returns
 * alongside the project.
 *
 * NOTE: the paid tier is called "Premium" in every user-facing string, but the
 * value stored in `profiles.plan` is still `'pro'`. That's deliberate — the
 * rename was a copy change, and rewriting live rows to match a marketing word
 * would risk locking paying customers out of what they bought.
 */

export type Plan = 'free' | 'pro'

export const isPlan = (v: unknown): v is Plan => v === 'free' || v === 'pro'

/** How many projects of their own a free user may create. */
export const FREE_PROJECT_LIMIT = 1

/**
 * How many people a free user may bring onto a project, not counting
 * themselves. The second teammate is the bottleneck worth asking at.
 */
export const FREE_COLLABORATOR_LIMIT = 1

/**
 * Where the upgrade button sends people: a hosted payment link (Stripe, Gumroad,
 * Paddle, …) set at build time. Left empty the button still opens the modal and
 * explains what Premium is, but says checkout isn't open yet rather than
 * dead-ending on a broken link.
 */
export const UPGRADE_URL = (import.meta.env.VITE_UPGRADE_URL as string | undefined)?.trim() ?? ''

/**
 * Dev/local override. With no Supabase there's no account to attach a plan to,
 * so the app assumes `free` (the honest default, and the one that makes the
 * paywall visible while working on it). `VITE_PLAN=pro` unlocks it locally.
 */
export const PLAN_OVERRIDE: Plan | null = isPlan(import.meta.env.VITE_PLAN) ? import.meta.env.VITE_PLAN : null

/** What upgrading buys, in the order the modal lists it. Translated at render. */
export const PREMIUM_BENEFITS: { title: string; body: string }[] = [
  {
    title: 'Your logo on every report',
    body: 'The shared link, the PDF, the slides and the printed report all carry your logo instead of ours.',
  },
  {
    title: 'Your brand colour throughout',
    body: 'Set one hex code and every report is re-skinned in it, header to footer.',
  },
  {
    title: 'No Adaptus branding',
    body: 'Remove our mark and the “build your own” link, so what you hand to leadership looks entirely like your own work.',
  },
  {
    title: 'The premium steps',
    body: 'Six deeper steps for big or risky changes: key people, what could go wrong, pushback, testing, what you’re waiting on, and making it stick.',
  },
  {
    title: 'Your whole portfolio in one view',
    body: 'The organization heat map shows which teams have the most change landing on them across every project you run.',
  },
  {
    title: 'History and trends',
    body: 'A reading is kept each day, so you can show leadership that readiness is up and risk is down, not just where things stand today.',
  },
  {
    title: 'Unlimited projects',
    body: 'Run every change you’re leading side by side instead of one at a time.',
  },
  {
    title: 'Your whole team',
    body: 'Invite as many editors and viewers as the change needs, on every project.',
  },
]
