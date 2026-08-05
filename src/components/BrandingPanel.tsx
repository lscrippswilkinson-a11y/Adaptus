import { useRef, useState } from 'react'
import { ImageUp, Lock, Sparkles, Trash2 } from 'lucide-react'
import type { Project } from '@/types'
import { DEFAULT_BRAND, brandOf, downscaleLogo, normalizeHex } from '@/lib/brand'
import { usePlan } from '@/state/PlanContext'
import { t, tp } from '@/i18n'

/** What the file picker will take. PNG matters: a logo often needs transparency. */
const ACCEPT = 'image/jpeg,image/png'
const MAX_UPLOAD_MB = 8

/**
 * Put the user's own logo and colour on every report they hand out. Both are
 * stored on the project (`stageData.executive`), so the shared brief, the PDF,
 * the deck and the printed report all pick them up.
 *
 * This is the Premium feature. Free users see the panel — showing what they'd get
 * beats hiding it — but every control is inert and the whole thing is one big
 * upgrade button.
 */
export function BrandingPanel({ project, onUpdate, onUpgrade }: { project: Project; onUpdate: (p: Project) => void; onUpgrade: () => void }) {
  const { isPremium, loading } = usePlan()
  // Locked until the plan is known, so a slow read can never flash the controls
  // open to a free user.
  const locked = !isPremium || loading
  const brand = brandOf(project, isPremium)
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  // What's in the hex box while typing: it's only committed once it parses, so
  // half-typed input ("#B2") doesn't repaint the report mid-keystroke.
  const [hex, setHex] = useState(project.stageData.executive.brandColor || '')

  const patch = (fields: Partial<Project['stageData']['executive']>) =>
    onUpdate({ ...project, stageData: { ...project.stageData, executive: { ...project.stageData.executive, ...fields } } })

  const pickLogo = async (file: File | undefined) => {
    if (!file) return
    setError('')
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setError(tp('That image is over {limit}MB. Try a smaller one.', { limit: MAX_UPLOAD_MB }))
      return
    }
    try {
      const { dataUrl, ratio } = await downscaleLogo(file)
      patch({ brandLogo: dataUrl, brandLogoRatio: ratio })
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Could not read that image.'))
    }
  }

  const commitHex = () => {
    const raw = hex.trim()
    if (!raw) {
      patch({ brandColor: '' })
      setError('')
      return
    }
    const parsed = normalizeHex(raw)
    if (!parsed) {
      setError(t('That isn’t a hex colour. Try something like #B23A48.'))
      return
    }
    setError('')
    setHex(parsed)
    patch({ brandColor: parsed })
  }

  return (
    <div style={{ position: 'relative', background: 'rgba(var(--fg),0.03)', border: `1px solid ${locked ? 'rgba(91,134,163,0.3)' : 'rgba(var(--fg),0.1)'}`, borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{t('Your branding')}</span>
        {locked && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--accent-text)', background: 'rgba(91,134,163,0.15)', border: '1px solid rgba(91,134,163,0.35)', borderRadius: '999px', padding: '2px 8px' }}>
            <Lock size={10} /> {t('Premium')}
          </span>
        )}
      </div>
      <div style={{ fontSize: '12px', color: 'rgba(var(--fg),0.55)', lineHeight: 1.5, margin: '3px 0 14px' }}>
        {t('Add your logo and colour and every report carries them: the shared link, the PDF, the slides, and the printed report.')}
      </div>

      {/* Locked: the controls below stay on screen (so the value is visible) but
          are inert, and the whole panel becomes one upgrade button. */}
      <div
        style={{ display: 'flex', alignItems: 'flex-start', gap: '18px', flexWrap: 'wrap', opacity: locked ? 0.45 : 1, pointerEvents: locked ? 'none' : 'auto', filter: locked ? 'grayscale(0.5)' : 'none' }}
        aria-hidden={locked}
      >
        {/* Logo */}
        <div style={{ flex: '1 1 200px', minWidth: 0 }}>
          <div className="cq-lbl">{t('Logo')}</div>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            style={{ display: 'none' }}
            onChange={(e) => {
              void pickLogo(e.target.files?.[0])
              // Clear it so re-picking the same file still fires a change event.
              e.target.value = ''
            }}
          />
          {brand.logo ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: '#11141f', border: '1px solid rgba(var(--fg),0.1)', borderRadius: '8px', padding: '8px 10px', display: 'flex', alignItems: 'center' }}>
                <img src={brand.logo} alt={t('Your logo')} style={{ maxHeight: '34px', maxWidth: '120px', display: 'block' }} />
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600, color: 'var(--accent-text)' }}
              >
                {t('Replace')}
              </button>
              <button
                type="button"
                onClick={() => patch({ brandLogo: '', brandLogoRatio: 1 })}
                aria-label={t('Remove logo')}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'rgba(var(--fg),0.4)', display: 'inline-flex' }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(var(--fg),0.04)', border: '1px dashed rgba(var(--fg),0.2)', borderRadius: '10px', padding: '11px 16px', color: 'var(--text)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <ImageUp size={16} /> {t('Upload a logo')}
            </button>
          )}
          <div style={{ fontSize: '11px', color: 'rgba(var(--fg),0.4)', marginTop: '6px' }}>{t('JPEG or PNG. PNG keeps a transparent background.')}</div>
        </div>

        {/* Colour */}
        <div style={{ flex: '0 1 190px', minWidth: 0 }}>
          <div className="cq-lbl">{t('Brand colour')}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label
              style={{ width: '38px', height: '38px', flexShrink: 0, borderRadius: '9px', border: '1px solid rgba(var(--fg),0.15)', background: brand.color, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
              title={t('Pick a colour')}
            >
              <input
                type="color"
                value={brand.color}
                onChange={(e) => {
                  setHex(e.target.value.toUpperCase())
                  patch({ brandColor: e.target.value.toUpperCase() })
                }}
                style={{ opacity: 0, width: '100%', height: '100%', cursor: 'pointer', border: 'none', padding: 0 }}
              />
            </label>
            <input
              type="text"
              className="cq-input"
              value={hex}
              placeholder={DEFAULT_BRAND}
              spellCheck={false}
              onChange={(e) => setHex(e.target.value)}
              onBlur={commitHex}
              onKeyDown={(e) => e.key === 'Enter' && commitHex()}
              style={{ minWidth: 0 }}
              aria-label={t('Brand colour hex code')}
            />
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(var(--fg),0.4)', marginTop: '6px' }}>
            {brand.custom ? t('Used across your reports.') : t('Leave blank for the default.')}
          </div>
        </div>
      </div>

      {locked && (
        <button
          type="button"
          onClick={onUpgrade}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '14px', background: 'linear-gradient(135deg,#5B86A3,#3E6580)', border: 'none', borderRadius: '10px', padding: '11px 18px', color: 'var(--on-accent)', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <Sparkles size={15} /> {t('Unlock your branding with Premium')}
        </button>
      )}

      {!locked && error && (
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#fca5a5' }}>{error}</div>
      )}
    </div>
  )
}
