import type { Icp } from '../lib/types';
import { Card } from './ui';

// Compact read-only summary of the ICP, shown beside the add-prospect form so the
// user can sanity-check a new prospect against their ideal profile at a glance.

function isEmpty(icp: Icp): boolean {
  return (
    !(icp.target_categories && icp.target_categories.length) &&
    !(icp.target_regions && icp.target_regions.length) &&
    !icp.decision_maker_roles &&
    !icp.buying_signals &&
    !icp.disqualifiers
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-text-dim/70">{label}</span>
      <span className="text-sm text-text">{value}</span>
    </div>
  );
}

export function IcpPanel({ icp }: { icp: Icp }) {
  const categories = icp.target_categories ?? [];
  const regions = icp.target_regions ?? [];

  return (
    <Card className="flex flex-col gap-3 p-4">
      <p className="font-display text-sm text-mint">My ICP</p>

      {isEmpty(icp) ? (
        <p className="text-sm text-text-dim">
          No ICP defined yet. Fill it in on the My ICP page to guide who you reach out to.
        </p>
      ) : (
        <>
          {(categories.length > 0 || regions.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <span key={`c-${c}`} className="chip bg-mint/15 text-mint">
                  {c}
                </span>
              ))}
              {regions.map((r) => (
                <span key={`r-${r}`} className="chip bg-white/5 text-text-dim">
                  {r}
                </span>
              ))}
            </div>
          )}

          {icp.decision_maker_roles && <Row label="Decision makers" value={icp.decision_maker_roles} />}
          {icp.buying_signals && <Row label="Buying signals" value={icp.buying_signals} />}
          {icp.disqualifiers && <Row label="Disqualifiers" value={icp.disqualifiers} />}
        </>
      )}
    </Card>
  );
}
