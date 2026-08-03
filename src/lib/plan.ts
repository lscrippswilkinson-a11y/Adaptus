/**
 * Plans and entitlements.
 *
 * Free gets the whole method: every stage, every coaching prompt, the shared
 * link, the PDF and the deck. What Pro buys is (a) more than one project and
 * (b) the reports being *yours* — your logo, your colour, and no Adaptus mark
 * on the thing you hand to your leadership.
 *
 * The plan is a per-USER fact, not a per-project one, so it lives on
 * `profiles.plan` rather than in the project JSONB. That matters for the
 * shared-brief page too: an anonymous recipient has no session, so the brief's
 * branding is decided by the OWNER's plan, which the share RPC returns
 * alongside the project.
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
 * explains what Pro is, but says checkout isn't open yet rather than dead-ending
 * on a broken link.
 */
export const UPGRADE_URL = (import.meta.env.VITE_UPGRADE_URL as string | undefined)?.trim() ?? ''

/**
 * Dev/local override. With no Supabase there's no account to attach a plan to,
 * so the app assumes `free` (the honest default, and the one that makes the
 * paywall visible while working on it). `VITE_PLAN=pro` unlocks it locally.
 */
export const PLAN_OVERRIDE: Plan | null = isPlan(import.meta.env.VITE_PLAN) ? import.meta.env.VITE_PLAN : null

/** What upgrading buys, in the order the modal lists it. Translated at render. */
export const PRO_BENEFITS: { title: string; body: string }[] = [
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
    title: 'Unlimited projects',
    body: 'Run every change you’re leading side by side instead of one at a time.',
  },
  {
    title: 'Your whole team',
    body: 'Invite as many editors and viewers as the change needs, on every project.',
  },
]
