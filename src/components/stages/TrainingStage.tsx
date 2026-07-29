import { ChevronRight, Trash2 } from 'lucide-react'
import { useStageEditor } from '@/state/AppContext'
import type { TrainingItem } from '@/types'
import { asExample, InsightCallout, Label, TextInput } from '@/components/ui'
import { StageFlow, type WizardStep } from '@/components/StageFlow'
import { useWizardMode } from '@/state/WizardModeContext'
import { AddItemButton, GuidedLabel, RemoveItemButton, headline, whyStyle } from '@/components/guided'
import { coaching, type Insight } from '@/data/coaching'
import { getBusinessProfile } from '@/data/business'
import { uid } from '@/lib/id'
import { getLang, htmlLang, t, tp } from '@/i18n'

/** Screens per activity in the guided flow: title, audience, format, owner, date. */
const STEPS_PER_ITEM = 5

/** "12 Jun 2026" from an ISO yyyy-mm-dd, for reading back a chosen date. */
export const longDate = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString(htmlLang(getLang()), { month: 'short', day: 'numeric', year: 'numeric' })

/**
 * The "training summary" hub: the home base of the guided training flow. Lists
 * every activity added so far as a single card (tap to edit), offers "Add
 * another training activity", and, via the Workspace complete button below,
 * continues to the next stage. Editing or adding an activity walks its screens
 * and returns here when finished.
 */
function TrainingHub({
  items,
  editItem,
  onAdd,
  onRemove,
  note,
  showNote,
}: {
  items: TrainingItem[]
  editItem: (stepIndex: number) => void
  onAdd: () => void
  onRemove: (id: number) => void
  note: Insight
  showNote: boolean
}) {
  return (
    <div>
      <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 800, color: 'var(--text)' }}>
        {items.length ? t('Your training activities') : t('Add your first activity')}
      </h2>
      <p style={{ margin: '0 0 18px', fontSize: '14px', color: 'rgba(var(--fg),0.6)', lineHeight: 1.6 }}>
        {items.length
          ? t('These are the training activities for this change. Tap one to edit it, add another below, or mark this step complete to continue.')
          : coaching.training.wizard.title.why}
      </p>

      {showNote && <InsightCallout tone={note.tone} style={{ marginBottom: '18px' }}>{note.text}</InsightCallout>}

      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.map((row, i) => {
            // One line summarising the whole activity: audience, format, owner, date.
            const detail = [
              row.audience.trim() && tp('For {audience}', { audience: row.audience.trim() }),
              row.format && t(row.format),
              row.owner.trim() && tp('led by {owner}', { owner: row.owner.trim() }),
              row.date && longDate(row.date),
            ]
              .filter(Boolean)
              .join('  ·  ')
            return (
              <div key={row.id} style={{ border: '1px solid rgba(var(--fg),0.1)', borderRadius: '14px', padding: '14px 16px', background: 'rgba(var(--fg),0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => editItem(i * STEPS_PER_ITEM)}
                    style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
                  >
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                        {row.title.trim() || tp('Activity {n}', { n: i + 1 })}
                      </span>
                      {detail && (
                        <span style={{ display: 'block', fontSize: '13px', color: 'rgba(var(--fg),0.6)', marginTop: '3px' }}>{detail}</span>
                      )}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', flexShrink: 0, fontSize: '12px', fontWeight: 600, color: 'var(--accent-text)' }}>
                      {t('Edit')} <ChevronRight size={14} />
                    </span>
                  </button>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemove(row.id)}
                      aria-label={t('Remove training activity')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(var(--fg),0.35)', padding: '2px', flexShrink: 0, display: 'inline-flex' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop: items.length ? '16px' : 0 }}>
        <AddItemButton label={items.length ? t('Add another training activity') : t('Add your first training activity')} onClick={onAdd} />
      </div>
    </div>
  )
}

export function TrainingStage() {
  const { project, data, update } = useStageEditor('training')
  const { mode } = useWizardMode()
  const w = coaching.training.wizard
  const note = coaching.training.managersFirst
  // Format options and worked examples are tailored to the project's business type.
  const profile = getBusinessProfile(project?.businessType)
  const formats = profile.trainingFormats
  const ex = profile.examples.training

  // The dropdown's options: the template's formats alphabetised, plus whatever
  // this activity is currently set to, so a hand-typed format doesn't vanish
  // from the list (which would leave the select showing nothing).
  const formatOptions = (current: string) => {
    const sorted = [...formats].sort((a, b) => a.localeCompare(b))
    return current && !sorted.includes(current) ? [...sorted, current] : sorted
  }

  const setItem = (id: number, patch: Partial<TrainingItem>) =>
    update({ items: data.items.map((row) => (row.id === id ? { ...row, ...patch } : row)) })
  const delItem = (id: number) => update({ items: data.items.filter((row) => row.id !== id) })
  const addItem = () => update({ items: [...data.items, { id: uid(), title: '', audience: '', format: formats[0], owner: '', date: '', done: false }] })

  const steps: WizardStep[] = []

  data.items.forEach((row, i) => {
    const what = row.title.trim() || tp('Activity {n}', { n: i + 1 })

    // Screen 1: title. First screen of the item → Back returns to the hub.
    steps.push({
      id: `${row.id}-title`,
      title: tp('{activity}: what', { activity: what }),
      isFilled: !!row.title.trim(),
      summary: row.title || undefined,
      itemFirst: true,
      node: (
        <div>
          <h2 style={headline}>{w.title.label}</h2>
          <div style={whyStyle}>{w.title.why}</div>
          <Label>{t('Training title')}</Label>
          <TextInput value={row.title} onCommit={(v) => setItem(row.id, { title: v })} placeholder={asExample(t(ex.title))} />
          {data.items.length > 1 && <RemoveItemButton label={t('Remove this activity')} onClick={() => delItem(row.id)} />}
        </div>
      ),
    })

    // Screen 2: audience
    steps.push({
      id: `${row.id}-audience`,
      title: tp('{activity}: audience', { activity: what }),
      isFilled: !!row.title.trim(),
      summary: row.audience || undefined,
      node: (
        <div>
          <h2 style={headline}>{w.audience.label}</h2>
          <div style={whyStyle}>{w.audience.why}</div>
          <Label>{t('Audience')}</Label>
          <TextInput value={row.audience} onCommit={(v) => setItem(row.id, { audience: v })} placeholder={asExample(t(ex.audience))} />
        </div>
      ),
    })

    // Screen 3: format
    steps.push({
      id: `${row.id}-format`,
      title: tp('{activity}: format', { activity: what }),
      isFilled: !!row.title.trim(),
      summary: row.format ? t(row.format) : undefined,
      node: (
        <div>
          <h2 style={headline}>{w.format.label}</h2>
          <div style={whyStyle}>{w.format.why}</div>
          <GuidedLabel>{t('Format')}</GuidedLabel>
          {/* The template's formats, alphabetised. A format typed by hand stays
              in the list (formatOptions folds it in), so the dropdown always
              shows what's actually set. */}
          <select
            className="cq-select"
            value={row.format}
            onChange={(e) => setItem(row.id, { format: e.target.value })}
          >
            <option value="">{t('Choose a format…')}</option>
            {formatOptions(row.format).map((f) => (
              <option key={f} value={f}>{t(f)}</option>
            ))}
          </select>

          {/* None of the presets fit every organisation, so let people name their own. */}
          <div style={{ marginTop: '16px' }}>
            <Label>{t('Or enter your own')}</Label>
            <TextInput
              value={row.format}
              onCommit={(v) => setItem(row.id, { format: v })}
              placeholder={t('Example: Lunch-and-learn, buddy shadowing')}
            />
          </div>
        </div>
      ),
    })

    // Screen 4: owner
    steps.push({
      id: `${row.id}-owner`,
      title: tp('{activity}: owner', { activity: what }),
      isFilled: !!row.title.trim(),
      summary: row.owner ? tp('led by {owner}', { owner: row.owner }) : undefined,
      node: (
        <div>
          <h2 style={headline}>{w.owner.label}</h2>
          <div style={whyStyle}>{w.owner.why}</div>
          <Label>{t('Owner')}</Label>
          <TextInput value={row.owner} onCommit={(v) => setItem(row.id, { owner: v })} placeholder={asExample(t(ex.owner))} />
        </div>
      ),
    })

    // Screen 5: when it runs. Last screen of the item → "Done" returns to the hub.
    steps.push({
      id: `${row.id}-date`,
      title: tp('{activity}: when', { activity: what }),
      isFilled: !!row.title.trim(),
      summary: row.date ? longDate(row.date) : undefined,
      emptyLabel: t('No date set'),
      itemLast: true,
      node: (
        <div>
          <h2 style={headline}>{w.date.label}</h2>
          <div style={whyStyle}>{w.date.why}</div>
          <Label>{t('Date')}</Label>
          <input
            type="date"
            className="cq-input"
            value={row.date ?? ''}
            onChange={(e) => setItem(row.id, { date: e.target.value })}
            style={{ maxWidth: '220px' }}
          />
        </div>
      ),
    })
  })

  return (
    <StageFlow
      stageId="training"
      icon={coaching.training.icon}
      blurb={coaching.training.intro}
      extra={<InsightCallout tone={note.tone} style={{ marginBottom: '14px' }}>{note.text}</InsightCallout>}
      steps={steps}
      hub={({ editItem }) => (
        <TrainingHub items={data.items} editItem={editItem} onAdd={addItem} onRemove={delItem} note={note} showNote={mode === 'guided'} />
      )}
    />
  )
}
