import { useStageEditor } from '@/state/AppContext'
import type { RiskItem } from '@/types'
import { InsightCallout, Label, TextInput } from '@/components/ui'
import { StageFlow, type WizardStep } from '@/components/StageFlow'
import { useWizardMode } from '@/state/WizardModeContext'
import { AddAnotherButton, AddItemButton, ChipPicker, GuidedLabel, RemoveItemButton, headline, whyStyle } from '@/components/guided'
import { coaching } from '@/data/coaching'
import { RISK_CATS } from '@/data/constants'
import { avgRisk, riskColor, riskLabel } from '@/lib/format'
import { uid } from '@/lib/id'
import { t, tp } from '@/i18n'

const LIKELIHOOD = ['', 'Unlikely', 'Possible', 'Likely', 'Very Likely', 'Almost Certain']
const IMPACT = ['', 'Minimal', 'Minor', 'Moderate', 'Major', 'Severe']

function Slider({ label, value, labels, onChange }: { label: string; value: number; labels: string[]; onChange: (v: number) => void }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span className="cq-lbl">{label}</span>
        <span style={{ fontSize: '12px', color: 'var(--accent-text)', fontWeight: 600 }}>{t(labels[value])}</span>
      </div>
      <input type="range" min={1} max={5} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  )
}

/** The overall risk-score readout, shared by guided (last screen) and summary view. */
function ScoreCard({ avg, count }: { avg: number; count: number }) {
  return (
    <div className="cq-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div>
          <div style={{ fontSize: '34px', fontWeight: 800, color: riskColor(avg) }}>{avg}</div>
          <div style={{ fontSize: '11px', color: 'rgba(var(--fg),0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('Risk Score')}</div>
        </div>
        <div style={{ width: '1px', height: '44px', background: 'rgba(var(--fg),0.08)' }} />
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: riskColor(avg) }}>{tp('{level} Risk', { level: t(riskLabel(avg)) })}</div>
          <div style={{ fontSize: '12px', color: 'rgba(var(--fg),0.4)' }}>{tp(count === 1 ? '{count} item' : '{count} items', { count })}</div>
        </div>
        <div style={{ flex: 1, height: '8px', background: 'rgba(var(--fg),0.06)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(avg / 10) * 100}%`, background: riskColor(avg), borderRadius: '4px', transition: 'width 0.5s' }} />
        </div>
      </div>
    </div>
  )
}

export function RiskStage() {
  const { data, update } = useStageEditor('risk')
  const { mode } = useWizardMode()
  const w = coaching.risk.wizard
  const avg = avgRisk(data.items)
  const scoreInsight = coaching.risk.scoreInsight(avg)

  const setItem = (id: number, patch: Partial<RiskItem>) =>
    update({ items: data.items.map((r) => (r.id === id ? { ...r, ...patch } : r)) })
  const delItem = (id: number) => update({ items: data.items.filter((r) => r.id !== id) })
  const addItem = () => update({ items: [...data.items, { id: uid(), category: 'People / Culture', description: '', likelihood: 3, impact: 3, mitigation: '' }] })

  const steps: WizardStep[] = []

  if (data.items.length === 0) {
    steps.push({
      id: 'start',
      title: t('Add your first risk'),
      isFilled: false,
      node: (
        <div>
          <h2 style={headline}>{w.describe.label}</h2>
          <div style={whyStyle}>{w.describe.why}</div>
          <AddItemButton label={t('Add your first risk')} onClick={addItem} />
        </div>
      ),
    })
  }

  data.items.forEach((r, i) => {
    const what = r.description.trim() || tp('Risk {n}', { n: i + 1 })
    const isLast = i === data.items.length - 1

    // Screen 1: category + description
    steps.push({
      id: `${r.id}-describe`,
      title: tp('{item}: what', { item: what }),
      isFilled: !!r.description.trim(),
      summary: r.description ? `${t(r.category)}: ${r.description}` : undefined,
      node: (
        <div>
          <h2 style={headline}>{w.describe.label}</h2>
          <div style={whyStyle}>{w.describe.why}</div>
          <GuidedLabel>{t('What kind of risk is it?')}</GuidedLabel>
          <ChipPicker value={r.category} options={RISK_CATS} onChange={(v) => setItem(r.id, { category: v })} />
          <div style={{ marginTop: '18px' }}>
            <Label>{t('Describe the risk')}</Label>
            <TextInput value={r.description} onCommit={(v) => setItem(r.id, { description: v })} placeholder={t('Example: staff keep using the old system')} />
          </div>
          {data.items.length > 1 && <RemoveItemButton label={t('Remove this risk')} onClick={() => delItem(r.id)} />}
        </div>
      ),
    })

    // Screen 2: likelihood
    steps.push({
      id: `${r.id}-likelihood`,
      title: tp('{item}: likelihood', { item: what }),
      isFilled: !!r.description.trim(),
      summary: t(LIKELIHOOD[r.likelihood]),
      node: (
        <div>
          <h2 style={headline}>{t('How likely is it to happen?')}</h2>
          <div style={whyStyle}>{w.rate.why}</div>
          <Slider label={t('Likelihood')} value={r.likelihood} labels={LIKELIHOOD} onChange={(v) => setItem(r.id, { likelihood: v })} />
        </div>
      ),
    })

    // Screen 3: impact
    steps.push({
      id: `${r.id}-impact`,
      title: tp('{item}: impact', { item: what }),
      isFilled: !!r.description.trim(),
      summary: tp('{level} impact', { level: t(IMPACT[r.impact]) }),
      node: (
        <div>
          <h2 style={headline}>{t('How bad would it be if it did?')}</h2>
          <div style={whyStyle}>{w.rate.why}</div>
          <Slider label={t('Impact')} value={r.impact} labels={IMPACT} onChange={(v) => setItem(r.id, { impact: v })} />
        </div>
      ),
    })

    // Screen 3: mitigation (+ overall score + insight on the last)
    steps.push({
      id: `${r.id}-mitigation`,
      title: tp('{item}: mitigation', { item: what }),
      isFilled: !!r.mitigation.trim(),
      summary: r.mitigation || undefined,
      node: (
        <div>
          <h2 style={headline}>{t('What’s your plan if this happens?')}</h2>
          <div style={whyStyle}>{w.mitigation.why}</div>
          <Label>{t('Mitigation plan: your fix if this happens')}</Label>
          <TextInput value={r.mitigation} onCommit={(v) => setItem(r.id, { mitigation: v })} placeholder={t('Example: Run both systems in parallel for 2 weeks as a safety net')} />
          {mode === 'guided' && isLast && avg !== null && (
            <div style={{ marginTop: '18px' }}>
              <ScoreCard avg={avg} count={data.items.length} />
              {scoreInsight && <InsightCallout tone={scoreInsight.tone} style={{ marginTop: '12px' }}>{scoreInsight.text}</InsightCallout>}
            </div>
          )}
          {isLast && <AddAnotherButton label={t('Add another risk')} onAdd={addItem} />}
        </div>
      ),
    })
  })

  return (
    <StageFlow
      stageId="risk"
      icon={coaching.risk.icon}
      blurb={coaching.risk.intro}
      extra={
        avg !== null ? (
          <>
            <ScoreCard avg={avg} count={data.items.length} />
            {scoreInsight && <InsightCallout tone={scoreInsight.tone} style={{ margin: '14px 0' }}>{scoreInsight.text}</InsightCallout>}
          </>
        ) : undefined
      }
      steps={steps}
    />
  )
}
