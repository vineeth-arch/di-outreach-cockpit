import type { ProspectWithFollowup } from '../lib/types';
import { STAGES } from '../lib/types';
import { bucketFor } from '../lib/cadence';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function HeaderStats({ items }: { items: ProspectWithFollowup[] }) {
  const cutoff = Date.now() - WEEK_MS;

  const contactedThisWeek = items.filter(
    (i) =>
      i.stage !== 'To Research' &&
      i.stage !== 'Ready to Reach' &&
      new Date(i.updated_at).getTime() >= cutoff,
  ).length;

  const dueToday = items.filter(
    (i) => i.followup && bucketFor(i.followup.due_date) === 'today',
  ).length;

  const overdue = items.filter(
    (i) => i.followup && bucketFor(i.followup.due_date) === 'overdue',
  ).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <ProminentStat label="Contacted this week" value={contactedThisWeek} tone="neutral" />
        <ProminentStat label="Follow-ups due today" value={dueToday} tone="mint" />
        <ProminentStat label="Overdue" value={overdue} tone="red" />
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-text-dim">
        {STAGES.map((stage) => (
          <span key={stage} className="inline-flex items-center gap-1.5">
            <span className="text-text-dim/70">{stage}</span>
            <span className="font-semibold text-text">
              {items.filter((i) => i.stage === stage).length}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function ProminentStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'neutral' | 'mint' | 'red';
}) {
  const toneClasses =
    tone === 'mint'
      ? 'border-mint/40 bg-mint/10'
      : tone === 'red'
        ? 'border-red-400/40 bg-red-400/10'
        : 'border-white/10 bg-ink-2/40';
  const valueClasses =
    tone === 'mint' ? 'text-mint' : tone === 'red' ? 'text-red-300' : 'text-text';

  return (
    <div className={`card flex min-w-[9rem] flex-col gap-0.5 border px-4 py-3 ${toneClasses}`}>
      <span className={`font-display text-3xl font-extrabold tracking-tightest ${valueClasses}`}>
        {value}
      </span>
      <span className="text-xs font-medium text-text-dim">{label}</span>
    </div>
  );
}
