import { useEffect, useState } from 'react';
import type { Icp } from '../lib/types';
import { getSettings, updateSettings } from '../lib/db';
import { Card, Field, TextInput, TextArea, Spinner } from '../components/ui';

const CATEGORY_OPTIONS = ['Wellness', 'F&B', 'Beauty'] as const;
const REGION_OPTIONS = ['GCC/UAE', 'EU', 'Singapore', 'ANZ', 'Other'] as const;

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function CheckboxRow({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const on = selected.includes(opt);
        return (
          <label
            key={opt}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition ${
              on ? 'border-mint/60 bg-mint/10 text-text' : 'border-white/10 text-text-dim hover:text-text'
            }`}
          >
            <input
              type="checkbox"
              checked={on}
              onChange={() => onToggle(opt)}
              className="h-auto w-auto"
            />
            {opt}
          </label>
        );
      })}
    </div>
  );
}

export default function Icp() {
  const [icp, setIcp] = useState<Icp | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void getSettings().then((s) => setIcp(s.icp ?? {}));
  }, []);

  function set<K extends keyof Icp>(key: K, value: Icp[K]) {
    setIcp((prev) => ({ ...(prev ?? {}), [key]: value }));
    setSaved(false);
  }

  async function save() {
    if (!icp) return;
    setSaving(true);
    try {
      await updateSettings({ icp });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (!icp) {
    return (
      <div className="py-16">
        <Spinner label="Loading ICP…" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-3xl">My ICP</h1>
        <p className="mt-1 text-sm text-text-dim">
          Your ideal customer profile. This feeds Claude when it drafts outreach so messages fit the
          right accounts.
        </p>
      </div>

      <Card className="flex flex-col gap-5 p-6">
        <Field label="Target categories">
          <CheckboxRow
            options={CATEGORY_OPTIONS}
            selected={icp.target_categories ?? []}
            onToggle={(v) => set('target_categories', toggle(icp.target_categories ?? [], v))}
          />
        </Field>

        <Field label="Target regions">
          <CheckboxRow
            options={REGION_OPTIONS}
            selected={icp.target_regions ?? []}
            onToggle={(v) => set('target_regions', toggle(icp.target_regions ?? [], v))}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company stage">
            <TextInput
              value={icp.company_stage ?? ''}
              onChange={(e) => set('company_stage', e.target.value)}
              placeholder="e.g. Seed to Series A"
            />
          </Field>
          <Field label="Company size">
            <TextInput
              value={icp.company_size ?? ''}
              onChange={(e) => set('company_size', e.target.value)}
              placeholder="e.g. 10–50 employees"
            />
          </Field>
        </div>

        <Field label="Decision-maker roles">
          <TextInput
            value={icp.decision_maker_roles ?? ''}
            onChange={(e) => set('decision_maker_roles', e.target.value)}
            placeholder="e.g. Founder, Head of Growth"
          />
        </Field>

        <Field label="Buying signals" hint="What tells you they're ready to talk.">
          <TextArea
            rows={3}
            value={icp.buying_signals ?? ''}
            onChange={(e) => set('buying_signals', e.target.value)}
            placeholder="Recent funding, hiring for growth, new market launch…"
          />
        </Field>

        <Field label="Disqualifiers" hint="Reasons to skip a prospect.">
          <TextArea
            rows={3}
            value={icp.disqualifiers ?? ''}
            onChange={(e) => set('disqualifiers', e.target.value)}
            placeholder="Enterprise-only, no budget, wrong region…"
          />
        </Field>

        <Field label="Notes">
          <TextArea
            rows={3}
            value={icp.notes ?? ''}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Anything else Claude should keep in mind."
          />
        </Field>

        <div className="flex items-center gap-3">
          <button className="btn-mint" onClick={() => void save()} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          {saved && <span className="text-sm text-mint">Saved ✓</span>}
        </div>
      </Card>
    </div>
  );
}
