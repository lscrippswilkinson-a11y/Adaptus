import { Check, Lock, Sparkles, X } from 'lucide-react'
import { PREMIUM_BENEFITS, UPGRADE_URL } from '@/lib/plan'
import { t } from '@/i18n'

/**
 * The one place Premium is sold. Every lock in the app opens this: the branding
 * panel, the "remove Adaptus branding" toggle, the second project, the premium
 * steps and the portfolio view.
 *
 * `reason` is the line at the top — the sentence that names what the user was
 * just trying to do — because an upsell that answers the question the user
 * already had converts, and a generic pricing wall interrupts.
 */
export function UpgradeModal({ reason, onClose }: { reason?: string; onClose: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,20,0.85)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 300, overflowY: 'auto', padding: '40px 20px' }}
      // Stop here: this can open on top of the share modal, whose own backdrop
      // would otherwise close underneath it.
      onClick={(e) => {
        e.stopPropagation()
        onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('Upgrade to Adaptus Premium')}
        style={{ background: 'var(--surface-card)', border: '1px solid rgba(var(--fg),0.08)', borderRadius: '20px', width: '480px', maxWidth: '92vw', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: show them the thing they're buying, in the brand colour. */}
        <div style={{ position: 'relative', background: 'radial-gradient(420px 200px at 88% -30%, rgba(255,255,255,0.18), transparent 60%), linear-gradient(135deg,#3E6580 0%,#2C4A60 100%)', padding: '26px 30px 24px' }}>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('Close')}
            style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '8px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
          >
            <X size={15} />
          </button>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', marginBottom: '10px' }}>
            <Sparkles size={14} /> {t('Adaptus Premium')}
          </div>
          <h2 style={{ margin: 0, fontSize: '21px', fontWeight: 800, color: '#fff', lineHeight: 1.25, letterSpacing: '-0.3px' }}>
            {t('Everything Adaptus can do')}
          </h2>
          <p style={{ margin: '8px 0 0', fontSize: '13.5px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.55 }}>
            {reason ?? t('Your own branding on every report, the deeper premium steps, your whole portfolio in one view, and as many projects and teammates as the change needs.')}
          </p>
        </div>

        <div style={{ padding: '22px 30px 26px' }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '14px' }}>
            {PREMIUM_BENEFITS.map((b) => (
              <li key={b.title} style={{ display: 'flex', alignItems: 'flex-start', gap: '11px' }}>
                <span style={{ flexShrink: 0, width: '20px', height: '20px', marginTop: '1px', borderRadius: '6px', background: 'rgba(91,134,163,0.18)', border: '1px solid rgba(91,134,163,0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-text)' }}>
                  <Check size={12} strokeWidth={3} />
                </span>
                <span>
                  <span style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{t(b.title)}</span>
                  <span style={{ display: 'block', fontSize: '12.5px', color: 'rgba(var(--fg),0.58)', lineHeight: 1.5, marginTop: '2px' }}>{t(b.body)}</span>
                </span>
              </li>
            ))}
          </ul>

          {UPGRADE_URL ? (
            <a
              href={UPGRADE_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', marginTop: '24px', background: 'linear-gradient(135deg,#5B86A3,#3E6580)', borderRadius: '12px', padding: '14px 24px', color: 'var(--on-accent)', fontWeight: 800, fontSize: '15px', textDecoration: 'none' }}
            >
              <Sparkles size={17} /> {t('Upgrade to Premium')}
            </a>
          ) : (
            // No payment link configured yet: say so plainly rather than ship a
            // button that goes nowhere.
            <div style={{ marginTop: '24px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '14px 16px', fontSize: '13px', color: 'var(--text)', lineHeight: 1.6 }}>
              {t('Premium isn’t open for purchase just yet. Check back shortly.')}
            </div>
          )}

          <p style={{ margin: '14px 0 0', fontSize: '11.5px', color: 'rgba(var(--fg),0.45)', textAlign: 'center', lineHeight: 1.5 }}>
            {t('Your plan and everything you’ve already written stay exactly as they are.')}
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * The inline upsell that sits next to a report the user just generated: a card
 * showing the Adaptus mark they'd be removing, with the ask attached to it.
 * Render it only for free users — see `usePlan()`.
 */
export function UpgradePrompt({ title, body, cta, onUpgrade }: { title: string; body: string; cta?: string; onUpgrade: () => void }) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', background: 'linear-gradient(120deg, rgba(91,134,163,0.14), rgba(91,134,163,0.05))', border: '1px solid rgba(91,134,163,0.3)', borderRadius: '14px', padding: '16px 18px', marginBottom: '20px' }}
    >
      <div style={{ width: '38px', height: '38px', flexShrink: 0, borderRadius: '11px', background: 'rgba(91,134,163,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Lock size={18} color="var(--accent-text)" />
      </div>
      <div style={{ flex: '1 1 220px', minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{title}</div>
        <div style={{ fontSize: '12.5px', color: 'rgba(var(--fg),0.6)', lineHeight: 1.5, marginTop: '2px' }}>{body}</div>
      </div>
      <button
        type="button"
        onClick={onUpgrade}
        style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'linear-gradient(135deg,#5B86A3,#3E6580)', border: 'none', borderRadius: '10px', padding: '11px 18px', color: 'var(--on-accent)', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer', fontFamily: 'inherit' }}
      >
        <Sparkles size={15} /> {cta ?? t('Upgrade to Premium')}
      </button>
    </div>
  )
}

/**
 * A locked feature shown rather than hidden: the real thing renders underneath,
 * blurred and inert, with the ask sitting on top of it. Used for the portfolio
 * view and the premium steps, where what's behind the lock is a *picture* — a
 * user who can see their own teams going amber understands the offer in a way
 * no bullet list achieves.
 *
 * The preview is `aria-hidden` and `inert`, so a screen reader and the tab order
 * both get the ask and never the decorative content behind it.
 */
export function PremiumTeaser({ title, body, cta, onUpgrade, children }: { title: string; body: string; cta?: string; onUpgrade: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
      <div
        aria-hidden
        // `inert` keeps the blurred preview out of the tab order. React 18 does
        // not know the attribute, hence the string cast.
        {...({ inert: '' } as Record<string, string>)}
        style={{ filter: 'blur(5px) saturate(0.75)', opacity: 0.5, pointerEvents: 'none', userSelect: 'none' }}
      >
        {children}
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          background: 'radial-gradient(closest-side, rgba(var(--bg-rgb),0.55), rgba(var(--bg-rgb),0.82))',
        }}
      >
        <div style={{ maxWidth: '420px', textAlign: 'center', background: 'var(--surface-card)', border: '1px solid rgba(91,134,163,0.35)', borderRadius: '16px', padding: '22px 26px', boxShadow: '0 14px 40px rgba(0,0,0,0.35)' }}>
          <div style={{ width: '40px', height: '40px', margin: '0 auto 12px', borderRadius: '12px', background: 'rgba(91,134,163,0.18)', border: '1px solid rgba(91,134,163,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={19} color="var(--accent-text)" />
          </div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.2px' }}>{title}</div>
          <div style={{ fontSize: '13px', color: 'rgba(var(--fg),0.62)', lineHeight: 1.55, margin: '6px 0 16px' }}>{body}</div>
          <button
            type="button"
            onClick={onUpgrade}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg,#5B86A3,#3E6580)', border: 'none', borderRadius: '11px', padding: '12px 22px', color: 'var(--on-accent)', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <Sparkles size={16} /> {cta ?? t('See what Premium adds')}
          </button>
        </div>
      </div>
    </div>
  )
}
