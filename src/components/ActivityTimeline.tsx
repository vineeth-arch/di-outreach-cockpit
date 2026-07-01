import type { Activity } from '../lib/types';
import { EmptyState } from './ui';

/** Vertical activity feed, newest first (caller passes already-ordered rows). */
export default function ActivityTimeline({ activities }: { activities: Activity[] }) {
  if (!activities.length) {
    return <EmptyState title="No activity yet" sub="Notes, drafts, and sends will show up here." />;
  }

  return (
    <ol className="relative flex flex-col gap-5 border-l border-white/10 pl-5">
      {activities.map((a) => (
        <li key={a.id} className="relative">
          <span className="absolute -left-[1.4rem] top-1.5 h-2 w-2 rounded-full bg-mint" />
          <div className="flex items-baseline justify-between gap-3">
            <span className="chip bg-mint/15 text-mint">{a.type}</span>
            <span className="text-xs text-text-dim/70">{formatDate(a.created_at)}</span>
          </div>
          {a.body && <p className="mt-1.5 whitespace-pre-wrap text-sm text-text-dim">{a.body}</p>}
        </li>
      ))}
    </ol>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
