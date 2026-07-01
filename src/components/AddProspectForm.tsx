import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Category, Source, Stage, Warmth } from '../lib/types';
import { CATEGORIES, SOURCES, STAGES, WARMTHS } from '../lib/types';
import { createProspect, moveProspectStage } from '../lib/db';
import type { NewProspect } from '../lib/db';
import { Field, Select, Spinner, TextArea, TextInput } from './ui';

export function AddProspectForm({
  onCreated,
  onClose,
}: {
  onCreated: () => void;
  onClose: () => void;
}) {
  const [brandName, setBrandName] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [country, setCountry] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [website, setWebsite] = useState('');
  const [source, setSource] = useState<Source | ''>('');
  const [signal, setSignal] = useState('');
  const [warmth, setWarmth] = useState<Warmth | ''>('');
  const [notes, setNotes] = useState('');
  const [stage, setStage] = useState<Stage>('To Research');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!brandName.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const clean = (v: string) => (v.trim() ? v.trim() : null);
      const wantsCadence = stage === 'Contacted';

      const input: NewProspect = {
        brand_name: brandName.trim(),
        category: category || null,
        country: clean(country),
        contact_name: clean(contactName),
        contact_role: clean(contactRole),
        contact_email: clean(contactEmail),
        linkedin_url: clean(linkedinUrl),
        website: clean(website),
        source: source || null,
        signal: clean(signal),
        warmth: warmth || null,
        notes: clean(notes),
        // Create at the base stage when Contacted so moveProspectStage's guard fires the cadence.
        stage: wantsCadence ? 'To Research' : stage,
      };

      const created = await createProspect(input);
      if (wantsCadence) {
        await moveProspectStage(created, 'Contacted');
      }

      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create prospect.');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Brand name">
        <TextInput
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          placeholder="e.g. Aura Wellness"
          required
          autoFocus
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <Select value={category} onChange={(e) => setCategory(e.target.value as Category | '')}>
            <option value="">—</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Country">
          <TextInput value={country} onChange={(e) => setCountry(e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Contact name">
          <TextInput value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </Field>
        <Field label="Contact role">
          <TextInput value={contactRole} onChange={(e) => setContactRole(e.target.value)} />
        </Field>
      </div>

      <Field label="Contact email">
        <TextInput
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="LinkedIn URL">
          <TextInput value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
        </Field>
        <Field label="Website">
          <TextInput value={website} onChange={(e) => setWebsite(e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Source">
          <Select value={source} onChange={(e) => setSource(e.target.value as Source | '')}>
            <option value="">—</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Warmth">
          <Select value={warmth} onChange={(e) => setWarmth(e.target.value as Warmth | '')}>
            <option value="">—</option>
            {WARMTHS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Signal">
        <TextArea
          rows={2}
          value={signal}
          onChange={(e) => setSignal(e.target.value)}
          placeholder="What makes them a good fit right now?"
        />
      </Field>

      <Field label="Notes">
        <TextArea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>

      <Field label="Stage" hint="Set to Contacted to start the follow-up cadence.">
        <Select value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>

      {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn-mint" disabled={saving || !brandName.trim()}>
          {saving ? <Spinner label="Saving…" /> : 'Add prospect'}
        </button>
      </div>
    </form>
  );
}
