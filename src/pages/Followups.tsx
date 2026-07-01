import { useCallback, useEffect, useState } from 'react';
import type { CadenceStep, Followup, Prospect } from '../lib/types';
import type { Bucket } from '../lib/cadence';
import { bucketFor } from '../lib/cadence';
import { getSettings, listActiveFollowups } from '../lib/db';
import { EmptyState, Spinner } from '../components/ui';
import { FollowupRow } from '../components/FollowupRow';

type Row = Followup & { prospect: Prospect };

const SECTIONS: {
  bucket: Bucket;
  label: string;
  heading: string;
  count: string;
  hint: string;
}[] = [
  {
    bucket: 'overdue',
    label: 'Overdue',
    heading: 'text-red-600 dark:text-red-400',
    count: 'bg-red-400/15 text-red-600 dark:text-red-300',
    hint: "These slipped. Clear them first.",
  },
  {
    bucket: 'today',
    label: 'Due today',
    heading: 'text-accent',
    count: 'bg-accent/15 text-accent',
    hint: "Today's touches.",
  },
  {
    bucket: 'upcoming',
    label: 'Upcoming',
    heading: 'text-dim',
    count: 'bg-surface-emphasis text-dim',
    hint: 'On the horizon.',
  },
];

export default function Followups() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [cadence, setCadence] = useState<CadenceStep[]>([]);

  const load = useCallback(async () => {
    const [followups, settings] = await Promise.all([listActiveFollowups(), getSettings()]);
    setCadence(settings.followup_cadence);
    // db already orders by due_date asc; keep that ordering within each bucket.
    setRows(followups);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl">Follow-ups</h1>
        <p className="mt-1 text-dim">
          Your daily driver — every open thread, sorted by what needs you first.
        </p>
      </div>

      {rows === null ? (
        <Spinner label="Loading follow-ups…" />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Inbox zero. Nothing to chase."
          sub="No open follow-ups right now — move a prospect to Contacted to start a cadence."
        />
      ) : (
        <div className="flex flex-col gap-10">
          {SECTIONS.map((section) => {
            const bucketRows = rows.filter((r) => bucketFor(r.due_date) === section.bucket);
            if (bucketRows.length === 0) return null;
            return (
              <section key={section.bucket} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <h2 className={`text-xl uppercase tracking-tightest ${section.heading}`}>
                    {section.label}
                  </h2>
                  <span className={`chip ${section.count}`}>{bucketRows.length}</span>
                  <span className="text-sm text-dim/60">{section.hint}</span>
                </div>
                <div className="flex flex-col gap-3">
                  {bucketRows.map((row) => (
                    <FollowupRow
                      key={row.id}
                      followup={row}
                      prospect={row.prospect}
                      bucket={section.bucket}
                      cadence={cadence}
                      onChange={() => void load()}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
