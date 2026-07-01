import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { ProspectWithFollowup } from '../lib/types';
import { bucketFor, dueLabel } from '../lib/cadence';
import { useProspectDrawer } from '../lib/nav';
import { CategoryBadge, WarmthDot } from './ui';

const DUE_COLOR: Record<'overdue' | 'today' | 'upcoming', string> = {
  overdue: 'text-red-300',
  today: 'text-mint',
  upcoming: 'text-text-dim/70',
};

export function ProspectCard({ item }: { item: ProspectWithFollowup }) {
  const { open } = useProspectDrawer();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { prospect: item },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  const bucket = item.followup ? bucketFor(item.followup.due_date) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => {
        if (!isDragging) open(item.id);
      }}
      className="card cursor-pointer touch-none select-none p-3 transition hover:-translate-y-0.5 hover:border-white/20 hover:shadow-lg hover:shadow-black/20"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-display text-sm font-extrabold leading-tight tracking-tightest text-text">
          {item.brand_name}
        </h4>
        <CategoryBadge category={item.category} />
      </div>

      <div className="mt-2 flex items-center gap-3 text-xs text-text-dim">
        {item.country && <span>{item.country}</span>}
        <WarmthDot warmth={item.warmth} />
      </div>

      {item.signal && (
        <p className="mt-2 truncate text-xs text-text-dim/80" title={item.signal}>
          {item.signal}
        </p>
      )}

      {item.followup && bucket && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-mint" />
          <span className={`font-semibold ${DUE_COLOR[bucket]}`}>
            {dueLabel(item.followup.due_date)}
          </span>
        </div>
      )}
    </div>
  );
}
