import type { CadenceStep, Followup, Prospect } from '../lib/types';
import type { Bucket } from '../lib/cadence';
import { dueLabel, stepLabel } from '../lib/cadence';
import { useProspectDrawer } from '../lib/nav';
import { CategoryBadge, WarmthDot } from './ui';
import { FollowupActions } from './FollowupActions';

const ACCENT: Record<Bucket, string> = {
  overdue: 'border-l-red-400',
  today: 'border-l-mint',
  upcoming: 'border-l-white/15',
};

const DUE_STYLE: Record<Bucket, string> = {
  overdue: 'text-red-300',
  today: 'text-mint',
  upcoming: 'text-text-dim',
};

export function FollowupRow({
  followup,
  prospect,
  bucket,
  cadence,
  onChange,
}: {
  followup: Followup;
  prospect: Prospect;
  bucket: Bucket;
  cadence: CadenceStep[];
  onChange: () => void;
}) {
  const { open } = useProspectDrawer();

  const contactLine = [prospect.contact_name, prospect.contact_role]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className={`card border-l-2 ${ACCENT[bucket]} flex flex-col gap-3 p-4`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <button
            onClick={() => open(prospect.id)}
            className="font-display text-lg font-extrabold tracking-tightest text-text transition hover:text-mint"
          >
            {prospect.brand_name}
          </button>
          <CategoryBadge category={prospect.category} />
          <WarmthDot warmth={prospect.warmth} />
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className={`font-semibold ${DUE_STYLE[bucket]}`}>{dueLabel(followup.due_date)}</span>
          <span className="text-text-dim/70">{stepLabel(followup.sequence_step, cadence)}</span>
        </div>
      </div>

      {contactLine && <p className="text-sm text-text-dim">{contactLine}</p>}

      {followup.reason && (
        <p className="text-sm text-text">
          <span className="text-text-dim/70">Why: </span>
          {followup.reason}
        </p>
      )}

      <FollowupActions followup={followup} prospect={prospect} onChange={onChange} />
    </div>
  );
}
