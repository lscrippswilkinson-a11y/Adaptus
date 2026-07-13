import { ChevronRight, Trash2 } from 'lucide-react'
import { useStageEditor } from '@/state/AppContext'
import type { TrainingItem } from '@/types'
import { asExample, InsightCallout, Label, TextInput } from '@/components/ui'
import { StageFlow, type WizardStep } from '@/components/StageFlow'
import { useWizardMode } from '@/state/WizardModeContext'
import { AddItemButton, ChipPicker, GuidedLabel, RemoveItemButton, headline, whyStyle } from '@/components/guided'
import { coaching, type Insight } from '@/data/coaching'
import { getBusinessProfile } from '@/data/business'
import { uid } from '@/lib/id'

/** Screens per activity in the guided flow: title, audience, format, owner, date. */
const STEPS_PER_ITEM = 5

/** "12 Jun 2026" from an ISO yyyy-mm-dd, for reading back a chosen date. */
export const longDate = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

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
        {items.length ? 'Your training activities' : 'Add your first activity'}
      </h2>
      <p style={{ margin: '0 0 18px', fontSize: '14px', color: 'rgba(var(--fg),0.6)', lineHeight: 1.6 }}>
        {items.length
          ? 'These are the training activities for this change. Tap one to edit it, add another below, or mark this step complete to continue.'
          : coaching.training.wizard.title.why}
      </p>

      {showNote && <InsightCallout tone={note.tone} style={{ marginBottom: '18px' }}>{note.text}</InsightCallout>}

      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.map((t, i) => {
            // One line summarising the whole activity: audience, format, owner, date.
            const detail = [
              t.audience.trim() && `For ${t.audience.trim()}`,
              t.format,
              t.owner.trim() && `led by ${t.owner.trim()}`,
              t.date && longDate(t.date),
            ]
              .filter(Boolean)
              .join('  ·  ')
            return (
              <div key={t.id} style={{ border: '1px solid rgba(var(--fg),0.1)', borderRadius: '14px', padding: '14px 16px', background: 'rgba(var(--fg),0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => editItem(i * STEPS_PER_ITEM)}
                    style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
                  >
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                        {t.title.trim() || `Activity ${i + 1}`}
                      </span>
                      {detail && (
                        <span style={{ display: 'block', fontSize: '13px', color: 'rgba(var(--fg),0.6)', marginTop: '3px' }}>{detail}</span>
                      )}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', flexShrink: 0, fontSize: '12px', fontWeight: 600, color: 'var(--accent-text)' }}>
                      Edit <ChevronRight size={14} />
                    </span>
                  </button>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemove(t.id)}
                      aria-label="Remove training activity"
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
        <AddItemButton label={items.length ? 'Add another training activity' : 'Add your first training activity'} onClick={onAdd} />
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

  const setItem = (id: number, patch: Partial<TrainingItem>) =>
    update({ items: data.items.map((t) => (t.id === id ? { ...t, ...patch } : t)) })
  const delItem = (id: number) => update({ items: data.items.filter((t) => t.id !== id) })
  const addItem = () => update({ items: [...data.items, { id: uid(), title: '', audience: '', format: formats[0], owner: '', date: '', done: false }] })

  const steps: WizardStep[] = []

  data.items.forEach((t, i) => {
    const what = t.title.trim() || `Activity ${i + 1}`

    // Screen 1: title. First screen of the item → Back returns to the hub.
    steps.push({
      id: `${t.id}-title`,
      title: `${what}: what`,
      isFilled: !!t.title.trim(),
      summary: t.title || undefined,
      itemFirst: true,
      node: (
        <div>
          <h2 style={headline}>{w.title.label}</h2>
          <div style={whyStyle}>{w.title.why}</div>
          <Label>Training title</Label>
          <TextInput value={t.title} onCommit={(v) => setItem(t.id, { title: v })} placeholder={asExample(ex.title)} />
          {data.items.length > 1 && <RemoveItemButton label="Remove this activity" onClick={() => delItem(t.id)} />}
        </div>
      ),
    })

    // Screen 2: audience
    steps.push({
      id: `${t.id}-audience`,
      title: `${what}: audience`,
      isFilled: !!t.title.trim(),
      summary: t.audience || undefined,
      node: (
        <div>
          <h2 style={headline}>{w.audience.label}</h2>
          <div style={whyStyle}>{w.audience.why}</div>
          <Label>Audience</Label>
          <TextInput value={t.audience} onCommit={(v) => setItem(t.id, { audience: v })} placeholder={asExample(ex.audience)} />
        </div>
      ),
    })

    // Screen 3: format
    steps.push({
      id: `${t.id}-format`,
      title: `${what}: format`,
      isFilled: !!t.title.trim(),
      summary: t.format || undefined,
      node: (
        <div>
          <h2 style={headline}>{w.format.label}</h2>
          <div style={whyStyle}>{w.format.why}</div>
          <GuidedLabel>Format</GuidedLabel>
          <ChipPicker value={t.format} options={formats} onChange={(v) => setItem(t.id, { format: v })} />
        </div>
      ),
    })

    // Screen 4: owner
    steps.push({
      id: `${t.id}-owner`,
      title: `${what}: owner`,
      isFilled: !!t.title.trim(),
      summary: t.owner ? `led by ${t.owner}` : undefined,
      node: (
        <div>
          <h2 style={headline}>{w.owner.label}</h2>
          <div style={whyStyle}>{w.owner.why}</div>
          <Label>Owner</Label>
          <TextInput value={t.owner} onCommit={(v) => setItem(t.id, { owner: v })} placeholder={asExample(ex.owner)} />
        </div>
      ),
    })

    // Screen 5: when it runs. Last screen of the item → "Done" returns to the hub.
    steps.push({
      id: `${t.id}-date`,
      title: `${what}: when`,
      isFilled: !!t.title.trim(),
      summary: t.date ? longDate(t.date) : undefined,
      emptyLabel: 'No date set',
      itemLast: true,
      node: (
        <div>
          <h2 style={headline}>{w.date.label}</h2>
          <div style={whyStyle}>{w.date.why}</div>
          <Label>Date</Label>
          <input
            type="date"
            className="cq-input"
            value={t.date ?? ''}
            onChange={(e) => setItem(t.id, { date: e.target.value })}
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
