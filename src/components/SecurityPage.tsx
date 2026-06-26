import { ArrowLeft, Shield, Lock, KeyRound, Users, Server, EyeOff, Trash2 } from 'lucide-react'

/**
 * Public, no-login Security & Privacy page (/?page=security). Rendered ahead of the
 * auth gate so a cautious user can read how their data is handled BEFORE signing in.
 *
 * Every claim here must stay true to how the app actually works (Supabase auth,
 * row-level security, opt-in sharing). Do not add certifications/claims we can't back.
 */

const POINTS: { icon: typeof Shield; title: string; body: string }[] = [
  {
    icon: KeyRound,
    title: 'We never store passwords',
    body: 'You sign in with Google or a one-time link sent to your email. There is no password for us to lose.',
  },
  {
    icon: Lock,
    title: 'Your projects are private by default',
    body: 'Every project is locked to your account at the database level (row-level security). No one else can see it unless you explicitly share it.',
  },
  {
    icon: Users,
    title: 'Sharing is opt-in and revocable',
    body: 'You decide who gets access and at what level. Share links and collaborator invites are created by you, and you can revoke them at any time.',
  },
  {
    icon: Server,
    title: 'Encrypted in transit and at rest',
    body: 'Your data travels over HTTPS and is stored in an encrypted Postgres database (Supabase, on AWS infrastructure).',
  },
  {
    icon: EyeOff,
    title: "We don't sell your data",
    body: 'No ads, no data brokers. The information you enter is used to run Adaptus for you — nothing else.',
  },
  {
    icon: Trash2,
    title: 'You can delete your data anytime',
    body: 'Delete a project from your dashboard whenever you want, and it’s removed from your account. Want your whole account gone? Just ask.',
  },
]

export function SecurityPage() {
  const goBack = () => {
    window.history.replaceState({}, '', window.location.pathname)
    window.location.assign(window.location.pathname)
  }

  return (
    <div className="cq-root" style={{ minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <button
          type="button"
          onClick={goBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'none', border: 'none', color: 'rgba(var(--fg),0.6)', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0, marginBottom: '28px' }}
        >
          <ArrowLeft size={16} /> Back to Adaptus
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'linear-gradient(135deg,#5B86A3,#3E6580)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield size={24} color="#fff" />
          </div>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: 'rgba(var(--fg),0.92)' }}>How we protect your data</h1>
        </div>

        <p style={{ margin: '0 0 32px', fontSize: '15px', lineHeight: 1.65, color: 'rgba(var(--fg),0.62)' }}>
          Adaptus holds sensitive details about your organization — who’s involved, what’s
          changing, and where the resistance is. Here’s plainly how that information is kept safe.
        </p>

        <div style={{ display: 'grid', gap: '12px' }}>
          {POINTS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              style={{ display: 'flex', gap: '14px', background: 'var(--surface-1)', border: '1px solid var(--surface-1-border)', borderRadius: '12px', padding: '18px 20px' }}
            >
              <div style={{ flexShrink: 0, color: 'var(--accent-text)', marginTop: '2px' }}>
                <Icon size={20} />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'rgba(var(--fg),0.9)', marginBottom: '4px' }}>{title}</div>
                <div style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'rgba(var(--fg),0.6)' }}>{body}</div>
              </div>
            </div>
          ))}
        </div>

        <p style={{ margin: '30px 0 0', fontSize: '12.5px', lineHeight: 1.6, color: 'rgba(var(--fg),0.45)' }}>
          Questions about your data, or want your account deleted? Email{' '}
          <a href="mailto:l.scripps.wilkinson@gmail.com" style={{ color: 'var(--accent-text)' }}>l.scripps.wilkinson@gmail.com</a>.
        </p>
      </div>
    </div>
  )
}
