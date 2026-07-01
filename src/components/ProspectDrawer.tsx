import { useCallback, useEffect, useState } from 'react';
import {
  ACTIVITY_TYPES,
  CATEGORIES,
  SOURCES,
  STAGES,
  WARMTHS,
  type Activity,
  type ActivityType,
  type Category,
  type Followup,
  type Prospect,
  type Settings,
  type Source,
  type Stage,
  type Warmth,
} from '../lib/types';
import {
  addActivity,
  cancelFollowup,
  getActiveFollowup,
  getProspect,
  getSettings,
  listActivities,
  moveProspectStage,
  updateProspect,
} from '../lib/db';
import { draftOutreach } from '../lib/draftApi';
import { stepLabel } from '../lib/cadence';
import { Drawer, Field, Select, Spinner, TextArea, TextInput } from './ui';
import { DraftModal } from './DraftModal';
import { FollowupActions } from './FollowupActions';
import ActivityTimeline from './ActivityTimeline';

// Text prospect fields that save-on-blur through updateProspect.
const TEXT_FIELDS: { key: keyof Prospect; label: string; type?: string }[] = [
  { key: 'contact_name', label: 'Contact name' },
  { key: 'contact_role', label: 'Contact role' },
  { key: 'contact_email', label: 'Contact email', type: 'email' },
  { key: 'country', label: 'Country' },
  { key: 'website', label: 'Website', type: 'url' },
  { key: 'linkedin_url', label: 'LinkedIn', type: 'url' },
  { key: 'signal', label: 'Signal' },
];

export default function ProspectDrawer({
  prospectId,
  onClose,
}: {
  prospectId: string;
  onClose: () => void;
}) {
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [followup, setFollowup] = useState<Followup | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedAt, setSavedAt] = useState(0);
  const [draftOpen, setDraftOpen] = useState(false);

  // add-note form state
  const [noteType, setNoteType] = useState<ActivityType>('Note');
  const [noteBody, setNoteBody] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  const load = useCallback(async () => {
    const [p, acts, fu, s] = await Promise.all([
      getProspect(prospectId),
      listActivities(prospectId),
      getActiveFollowup(prospectId),
      getSettings(),
    ]);
    setProspect(p);
    setActivities(acts);
    setFollowup(fu);
    setSettings(s);
  }, [prospectId]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    load()
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [load]);

  const refresh = useCallback(async () => {
    await load().catch(() => {});
  }, [load]);

  function flagSaved() {
    setSavedAt(Date.now());
  }

  // Save a single text/select field (never stage — that goes through moveProspectStage).
  const saveField = useCallback(
    async (patch: Partial<Prospect>) => {
      if (!prospect) return;
      const updated = await updateProspect(prospect.id, patch);
      setProspect(updated);
      flagSaved();
    },
    [prospect],
  );

  const changeStage = useCallback(
    async (stage: Stage) => {
      if (!prospect || stage === prospect.stage) return;
      const { prospect: updated } = await moveProspectStage(prospect, stage);
      setProspect(updated);
      flagSaved();
      // Stage move may auto-create/close follow-ups + log activity — re-pull the rest.
      const [acts, fu] = await Promise.all([
        listActivities(updated.id),
        getActiveFollowup(updated.id),
      ]);
      setActivities(acts);
      setFollowup(fu);
    },
    [prospect],
  );

  async function submitNote(e: React.FormEvent) {
    e.preventDefault();
    if (!prospect) return;
    setNoteSaving(true);
    try {
      await addActivity(prospect.id, noteType, noteBody.trim() || null);
      if (noteType === 'Reply received') {
        const active = followup ?? (await getActiveFollowup(prospect.id));
        if (active && window.confirm('Pause the automated cadence?')) {
          await cancelFollowup(active);
        }
      }
      setNoteBody('');
      setNoteType('Note');
      await refresh();
    } finally {
      setNoteSaving(false);
    }
  }

  return (
    <Drawer open={true} onClose={onClose}>
      {loading || !prospect || !settings ? (
        <div className="grid h-full place-items-center">
          <Spinner label="Loading prospect…" />
        </div>
      ) : (
        <div className="flex flex-col gap-8 p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-display text-3xl font-extrabold tracking-tightest">
              {prospect.brand_name}
            </h2>
            <div className="flex items-center gap-3">
              <SavedIndicator savedAt={savedAt} />
              <button
                onClick={onClose}
                className="text-dim hover:text-ink"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Stage + draft CTA */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="w-56">
              <Field label="Stage">
                <Select
                  value={prospect.stage}
                  onChange={(e) => void changeStage(e.target.value as Stage)}
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <button className="btn-mint" onClick={() => setDraftOpen(true)}>
              ★ Draft outreach with Claude
            </button>
          </div>

          {/* Active follow-up */}
          {followup && (
            <section className="card flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm text-ink">Active follow-up</h3>
                <span className="text-xs text-dim/70">
                  {stepLabel(followup.sequence_step, settings.followup_cadence)}
                </span>
              </div>
              <FollowupActions followup={followup} prospect={prospect} onChange={refresh} />
            </section>
          )}

          {/* Editable fields */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Category">
              <Select
                value={prospect.category ?? ''}
                onChange={(e) =>
                  void saveField({ category: (e.target.value || null) as Category | null })
                }
              >
                <option value="">—</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Source">
              <Select
                value={prospect.source ?? ''}
                onChange={(e) =>
                  void saveField({ source: (e.target.value || null) as Source | null })
                }
              >
                <option value="">—</option>
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Warmth">
              <Select
                value={prospect.warmth ?? ''}
                onChange={(e) =>
                  void saveField({ warmth: (e.target.value || null) as Warmth | null })
                }
              >
                <option value="">—</option>
                {WARMTHS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </Select>
            </Field>

            {TEXT_FIELDS.map((f) => (
              <EditableText
                key={f.key as string}
                label={f.label}
                type={f.type}
                value={(prospect[f.key] as string | null) ?? ''}
                onSave={(v) => void saveField({ [f.key]: v || null } as Partial<Prospect>)}
              />
            ))}

            <div className="sm:col-span-2">
              <EditableTextArea
                label="Notes"
                value={prospect.notes ?? ''}
                onSave={(v) => void saveField({ notes: v || null })}
              />
            </div>
          </section>

          {/* Add note / log activity */}
          <section className="card flex flex-col gap-3">
            <h3 className="font-display text-sm text-ink">Log activity</h3>
            <form onSubmit={submitNote} className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="sm:w-48">
                  <Select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value as ActivityType)}
                  >
                    {ACTIVITY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </div>
                <TextInput
                  placeholder="Add a note…"
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <button className="btn-mint" type="submit" disabled={noteSaving}>
                  {noteSaving ? 'Saving…' : 'Log'}
                </button>
              </div>
            </form>
          </section>

          {/* Timeline */}
          <section className="flex flex-col gap-4">
            <h3 className="font-display text-sm text-ink">Activity</h3>
            <ActivityTimeline activities={activities} />
          </section>
        </div>
      )}

      {prospect && (
        <DraftModal
          open={draftOpen}
          onClose={() => setDraftOpen(false)}
          title="Outreach draft"
          fetchDraft={() => draftOutreach(prospect.id)}
          recipientEmail={prospect.contact_email}
          extraActions={() => (
            <button
              className="btn-ghost"
              onClick={async () => {
                await addActivity(prospect.id, 'Email sent', 'Sent outreach');
                if (prospect.stage !== 'Contacted') {
                  await changeStage('Contacted');
                }
                await refresh();
                setDraftOpen(false);
              }}
            >
              Log as sent
            </button>
          )}
        />
      )}
    </Drawer>
  );
}

function SavedIndicator({ savedAt }: { savedAt: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!savedAt) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 1600);
    return () => clearTimeout(t);
  }, [savedAt]);
  if (!show) return null;
  return <span className="text-xs text-accent dark:text-spark">Saved ✓</span>;
}

function EditableText({
  label,
  value,
  type,
  onSave,
}: {
  label: string;
  value: string;
  type?: string;
  onSave: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <Field label={label}>
      <TextInput
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== value) onSave(draft);
        }}
      />
    </Field>
  );
}

function EditableTextArea({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string;
  onSave: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <Field label={label}>
      <TextArea
        rows={3}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== value) onSave(draft);
        }}
      />
    </Field>
  );
}
