import { useState } from 'react';
import type { Followup, Prospect } from '../lib/types';
import { addDays, isoToday } from '../lib/cadence';
import { cancelFollowup, completeFollowup, snoozeFollowup } from '../lib/db';
import { draftFollowup } from '../lib/draftApi';
import { DraftModal } from './DraftModal';

/**
 * Inline action row for a single follow-up: draft, mark done (auto-advances cadence),
 * snooze (+3d / +1w / custom date), and stop the whole cadence.
 * Nothing sends automatically — the draft modal only drafts.
 */
export function FollowupActions({
  followup,
  prospect,
  onChange,
}: {
  followup: Followup;
  prospect: Prospect;
  onChange: () => void;
}) {
  const [draftOpen, setDraftOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      onChange();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        className="btn-mint"
        onClick={() => setDraftOpen(true)}
        disabled={busy}
      >
        ★ Draft follow-up with Claude
      </button>

      <button
        className="btn-ghost"
        onClick={() => void run(() => completeFollowup(followup))}
        disabled={busy}
      >
        Mark done
      </button>

      <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-ink-2/40 px-2 py-1">
        <span className="pl-1 text-xs text-text-dim">Snooze</span>
        <button
          className="rounded-md px-2 py-0.5 text-xs font-semibold text-text-dim transition hover:bg-white/5 hover:text-text disabled:opacity-40"
          onClick={() => void run(() => snoozeFollowup(followup, addDays(isoToday(), 3)))}
          disabled={busy}
        >
          +3d
        </button>
        <button
          className="rounded-md px-2 py-0.5 text-xs font-semibold text-text-dim transition hover:bg-white/5 hover:text-text disabled:opacity-40"
          onClick={() => void run(() => snoozeFollowup(followup, addDays(isoToday(), 7)))}
          disabled={busy}
        >
          +1w
        </button>
        <input
          type="date"
          min={isoToday()}
          className="w-[8.5rem] px-2 py-0.5 text-xs"
          disabled={busy}
          onChange={(e) => {
            const picked = e.target.value;
            if (picked) void run(() => snoozeFollowup(followup, picked));
          }}
        />
      </span>

      <button
        className="btn-danger"
        onClick={() => void run(() => cancelFollowup(followup))}
        disabled={busy}
      >
        Stop follow-ups
      </button>

      <DraftModal
        open={draftOpen}
        onClose={() => setDraftOpen(false)}
        title="Follow-up draft"
        fetchDraft={() => draftFollowup(followup.id)}
        recipientEmail={prospect.contact_email}
        recipientPhone={null}
      />
    </div>
  );
}
