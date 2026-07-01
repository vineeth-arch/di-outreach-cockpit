import { useEffect, useState } from 'react';
import type { CadenceStep, DraftModel, Settings as SettingsType } from '../lib/types';
import { getSettings, updateSettings } from '../lib/db';
import { Card, Field, TextInput, TextArea, Select, Spinner } from '../components/ui';
import { CadenceEditor } from '../components/CadenceEditor';

const MODEL_OPTIONS: { value: DraftModel; label: string }[] = [
  { value: 'claude-haiku', label: 'Claude Haiku (default)' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'gemini-flash', label: 'Gemini Flash' },
  { value: 'groq-llama', label: 'Groq Llama' },
];

// The subset of settings this page owns (the ICP lives on its own page).
type Editable = Pick<
  SettingsType,
  'my_voice' | 'my_offer' | 'credibility' | 'draft_model' | 'openrouter_model' | 'followup_cadence' | 'webhook_url'
>;

export default function Settings() {
  const [form, setForm] = useState<Editable | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void getSettings().then((s) =>
      setForm({
        my_voice: s.my_voice,
        my_offer: s.my_offer,
        credibility: s.credibility,
        draft_model: s.draft_model,
        openrouter_model: s.openrouter_model,
        followup_cadence: s.followup_cadence,
        webhook_url: s.webhook_url,
      }),
    );
  }, []);

  function set<K extends keyof Editable>(key: K, value: Editable[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaved(false);
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    try {
      await updateSettings(form);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (!form) {
    return (
      <div className="py-16">
        <Spinner label="Loading settings…" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-text-dim">
          Your voice, offer, and drafting model — the context Claude uses to write outreach.
        </p>
      </div>

      <Card className="flex flex-col gap-5 p-6">
        <Field label="My voice" hint="How you write — tone, phrasing, what you sound like.">
          <TextArea
            rows={5}
            value={form.my_voice ?? ''}
            onChange={(e) => set('my_voice', e.target.value)}
            placeholder="Direct, warm, no jargon. I open with a specific observation…"
          />
        </Field>

        <Field label="My offer" hint="What you're actually pitching.">
          <TextArea
            rows={5}
            value={form.my_offer ?? ''}
            onChange={(e) => set('my_offer', e.target.value)}
            placeholder="I help wellness brands turn their retail data into…"
          />
        </Field>

        <Field label="Credibility" hint="Proof points Claude can weave in — results, clients, background.">
          <TextArea
            rows={5}
            value={form.credibility ?? ''}
            onChange={(e) => set('credibility', e.target.value)}
            placeholder="Previously grew X to Y, worked with brands like…"
          />
        </Field>
      </Card>

      <Card className="flex flex-col gap-5 p-6">
        <Field label="Draft model" hint="Which model writes your drafts.">
          <Select
            value={form.draft_model}
            onChange={(e) => set('draft_model', e.target.value as DraftModel)}
          >
            {MODEL_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </Field>

        {form.draft_model === 'openrouter' && (
          <Field label="OpenRouter model" hint="Any OpenRouter free model id.">
            <TextInput
              value={form.openrouter_model}
              onChange={(e) => set('openrouter_model', e.target.value)}
              placeholder="meta-llama/llama-3.3-70b-instruct:free"
            />
          </Field>
        )}

        <Field label="Webhook URL" hint="Optional — n8n graduation webhook.">
          <TextInput
            type="url"
            value={form.webhook_url ?? ''}
            onChange={(e) => set('webhook_url', e.target.value || null)}
            placeholder="https://…"
          />
        </Field>
      </Card>

      <Card className="flex flex-col gap-5 p-6">
        <CadenceEditor
          value={form.followup_cadence}
          onChange={(next: CadenceStep[]) => set('followup_cadence', next)}
        />
      </Card>

      <div className="flex items-center gap-3">
        <button className="btn-mint" onClick={() => void save()} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        {saved && <span className="text-sm text-mint">Saved ✓</span>}
      </div>
    </div>
  );
}
