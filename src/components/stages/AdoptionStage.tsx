import { useStageEditor } from '@/state/AppContext'
import type { AdoptionMetric } from '@/types'
import { asExample, FieldCoach, InsightCallout, Label, TextArea, TextInput } from '@/components/ui'
import { StageFlow, type WizardStep } from '@/components/StageFlow'
import { useWizardMode } from '@/state/WizardModeContext'
import { AddAnotherButton, AddItemButton, ChipPicker, GuidedLabel, RemoveItemButton, headline, whyStyle } from '@/components/guided'
import { METRIC_UNITS } from '@/data/constants'
import { coaching } from '@/data/coaching'
import { longDate } from '@/components/stages/TrainingStage'
import { uid } from '@/lib/id'
import { t, tp } from '@/i18n'

export function AdoptionStage() {
  const { data, update } = useStageEditor('adoption')
  const { mode } = useWizardMode()
  const w = coaching.adoption.wizard

  const setMetric = (id: number, patch: Partial<AdoptionMetric>) =>
    update({ metrics: data.metrics.map((m) => (m.id === id ? { ...m, ...patch } : m)) })
  const delMetric = (id: number) => update({ metrics: data.metrics.filter((m) => m.id !== id) })
  const addMetric = () => update({ metrics: [...data.metrics, { id: uid(), name: '', target: '', current: '', unit: '%', checkBy: '' }] })

  const insight = coaching.adoption.insight(data.metrics)

  const steps: WizardStep[] = []

  if (data.metrics.length === 0) {
    steps.push({
      id: 'start',
      title: t('Add your first metric'),
      isFilled: false,
      node: (
        <div>
          <h2 style={headline}>{w.name.label}</h2>
          <div style={whyStyle}>{w.name.why}</div>
          <AddItemButton label={t('Add your first adoption metric')} onClick={addMetric} />
        </div>
      ),
    })
  }

  data.metrics.forEach((m, i) => {
    const what = m.name.trim() || tp('Metric {n}', { n: i + 1 })
    const isLast = i === data.metrics.length - 1
    const hasProgress = m.current && m.target
    const p2 = hasProgress ? Math.min(100, Math.round((parseFloat(m.current) / parseFloat(m.target)) * 100)) : 0

    // Screen 1: name + unit
    steps.push({
      id: `${m.id}-name`,
      title: tp('{metric}: metric & unit', { metric: what }),
      isFilled: !!m.name.trim(),
      summary: m.name ? `${m.name} (${m.unit})` : undefined,
      node: (
        <div>
          <h2 style={headline}>{w.name.label}</h2>
          <div style={whyStyle}>{w.name.why}</div>
          <Label>{t('Metric name')}</Label>
          <TextInput value={m.name} onCommit={(v) => setMetric(m.id, { name: v })} placeholder={t('Example: Timekeepers entering their own time')} />
          <div style={{ marginTop: '18px' }}>
            <GuidedLabel>{t('How is it measured?')}</GuidedLabel>
            <ChipPicker value={m.unit} options={METRIC_UNITS} onChange={(v) => setMetric(m.id, { unit: v })} />
          </div>
          {data.metrics.length > 1 && <RemoveItemButton label={t('Remove this metric')} onClick={() => delMetric(m.id)} />}
        </div>
      ),
    })

    // Screen 2: target
    steps.push({
      id: `${m.id}-target`,
      title: tp('{metric}: target', { metric: what }),
      isFilled: !!m.name.trim(),
      summary: m.target ? tp('Target {value}{unit}', { value: m.target, unit: t(m.unit) }) : undefined,
      node: (
        <div>
          <h2 style={headline}>{t('What’s the target?')}</h2>
          <div style={whyStyle}>{w.targets.why}</div>
          <Label>{tp('Target ({unit})', { unit: t(m.unit) })}</Label>
          <TextInput value={m.target} onCommit={(v) => setMetric(m.id, { target: v })} placeholder={t('Example: 90')} />
        </div>
      ),
    })

    // Screen 3: current (+ progress, insight on the last)
    steps.push({
      id: `${m.id}-current`,
      title: tp('{metric}: current', { metric: what }),
      isFilled: !!m.name.trim(),
      summary: m.target ? `${m.current || '-'} / ${m.target}${t(m.unit)}` : undefined,
      node: (
        <div>
          <h2 style={headline}>{t('Where are you now?')}</h2>
          <div style={whyStyle}>{w.targets.why}</div>
          <Label>{tp('Current ({unit})', { unit: t(m.unit) })}</Label>
          <TextInput value={m.current} onCommit={(v) => setMetric(m.id, { current: v })} placeholder={t('Example: 55')} />
          {hasProgress && (
            <div style={{ marginTop: '14px' }}>
              <div style={{ height: '6px', background: 'rgba(var(--fg),0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${p2}%`, background: 'linear-gradient(90deg,#5B86A3,#8FB3C7)', borderRadius: '3px', transition: 'width 0.4s' }} />
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(var(--fg),0.35)', marginTop: '3px' }}>{tp('{pct}% of target', { pct: p2 })}</div>
            </div>
          )}
        </div>
      ),
    })

    // Screen 4: when it gets measured again. Carries the stage insight and the
    // "add another" affordance, so they sit at the end of the metric, not mid-way.
    steps.push({
      id: `${m.id}-checkBy`,
      title: tp('{metric}: next check', { metric: what }),
      isFilled: !!m.name.trim(),
      summary: m.checkBy ? tp('Next check {date}', { date: longDate(m.checkBy) }) : undefined,
      emptyLabel: t('No check-in date set'),
      node: (
        <div>
          <h2 style={headline}>{w.checkBy.label}</h2>
          <div style={whyStyle}>{w.checkBy.why}</div>
          <Label>{t('Next check')}</Label>
          <input
            type="date"
            className="cq-input"
            value={m.checkBy ?? ''}
            onChange={(e) => setMetric(m.id, { checkBy: e.target.value })}
            style={{ maxWidth: '220px' }}
          />
          {mode === 'guided' && isLast && insight && (
            <InsightCallout tone={insight.tone} style={{ marginTop: '16px' }}>{insight.text}</InsightCallout>
          )}
          {isLast && <AddAnotherButton label={t('Add another metric')} onAdd={addMetric} />}
        </div>
      ),
    })
  })

  // Final step: the qualitative "what are you hearing" notes, independent of metrics.
  steps.push({
    id: 'notes',
    title: t('From the field'),
    isFilled: !!data.notes.trim(),
    summary: data.notes || undefined,
    node: (
      <FieldCoach label={coaching.adoption.fields.notes.label} why={coaching.adoption.fields.notes.why}>
        <TextArea value={data.notes} onCommit={(v) => update({ notes: v })} placeholder={asExample(coaching.adoption.fields.notes.example)} rows={4} />
      </FieldCoach>
    ),
  })

  return (
    <StageFlow
      stageId="adoption"
      icon={coaching.adoption.icon}
      blurb={coaching.adoption.intro}
      extra={insight ? <InsightCallout tone={insight.tone} style={{ marginBottom: '12px' }}>{insight.text}</InsightCallout> : undefined}
      steps={steps}
    />
  )
}
