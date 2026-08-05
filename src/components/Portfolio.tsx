import { useEffect, useMemo, useState } from 'react'
import { Layers } from 'lucide-react'
import type { Project } from '@/types'
import { usePlan } from '@/state/PlanContext'
import { hasSupabase } from '@/lib/supabase'
import { fetchSnapshots } from '@/lib/projectsRepo'
import { buildHeatMap } from '@/lib/heatmap'
import type { Snapshot } from '@/lib/snapshots'
import { OrgHeatMap } from '@/components/OrgHeatMap'
import { TrendPanel } from '@/components/TrendPanel'
import { PremiumTeaser, UpgradeModal } from '@/components/UpgradeModal'
import { useLanguage } from '@/i18n/LanguageContext'

/**
 * The Premium portfolio view: the organization heat map and the history/trend
 * charts, the two things that only mean anything once you're running more than
 * one change, over time.
 *
 * Free users see it rather than never learning it exists — the real thing
 * renders blurred behind the ask, because their OWN teams going amber is an
 * argument no feature list makes. Nothing fake is ever drawn: if there's
 * genuinely nothing to plot, the whole section is absent for everyone.
 */
export function Portfolio({ projects }: { projects: Project[] }) {
  const { t } = useLanguage()
  const { isPremium, loading: planLoading } = usePlan()
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [upsell, setUpsell] = useState<string | null>(null)

  useEffect(() => {
    if (!hasSupabase) return
    let cancelled = false
    fetchSnapshots()
      .then((rows) => {
        if (!cancelled) setSnapshots(rows)
      })
      // History is a nice-to-have on this page; a failed read must not take the
      // dashboard down with it.
      .catch((err) => console.error('[adaptus] failed to load history (continuing)', err))
    return () => {
      cancelled = true
    }
  }, [projects.length])

  // Is there anything real to draw? The heat map needs at least one impacted
  // group; the trends need at least one reading. Aliases are the user's own
  // name-merging and only ever combine teams, so {} is a safe emptiness test.
  const hasTeams = useMemo(() => buildHeatMap(projects, {}).teams.length > 0, [projects])
  if (!hasTeams && snapshots.length === 0) return null

  const locked = !isPremium && !planLoading

  const content = (
    <>
      <OrgHeatMap projects={projects} />
      {hasSupabase && <TrendPanel snapshots={snapshots} projects={projects} />}
    </>
  )

  return (
    <div style={{ marginTop: '26px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '2px' }}>
        <Layers size={16} color="rgba(var(--fg),0.5)" />
        <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>{t('Your portfolio')}</span>
      </div>
      <div style={{ fontSize: '12.5px', color: 'rgba(var(--fg),0.55)', marginBottom: '2px' }}>
        {t('Everything you’re running, seen together and over time.')}
      </div>

      {locked ? (
        <PremiumTeaser
          title={t('See the whole picture')}
          body={t('Which teams have the most change landing on them, and whether readiness is climbing or risk is creeping up. Part of Adaptus Premium.')}
          onUpgrade={() => setUpsell(t('The portfolio view puts every change you’re running side by side, and keeps a reading each day so you can show leadership the direction of travel.'))}
        >
          {content}
        </PremiumTeaser>
      ) : (
        content
      )}

      {upsell && <UpgradeModal reason={upsell} onClose={() => setUpsell(null)} />}
    </div>
  )
}
