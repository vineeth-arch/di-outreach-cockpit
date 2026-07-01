import { useCallback, useEffect, useState } from 'react';
import type { Icp, ProspectWithFollowup } from '../lib/types';
import { getSettings, listProspectsWithFollowups } from '../lib/db';
import { Drawer, EmptyState, Spinner } from '../components/ui';
import { HeaderStats } from '../components/HeaderStats';
import { KanbanBoard } from '../components/KanbanBoard';
import { AddProspectForm } from '../components/AddProspectForm';
import { IcpPanel } from '../components/IcpPanel';

export default function Pipeline() {
  const [items, setItems] = useState<ProspectWithFollowup[]>([]);
  const [icp, setIcp] = useState<Icp | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const refresh = useCallback(async () => {
    const data = await listProspectsWithFollowups();
    setItems(data);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const [prospects, settings] = await Promise.all([
        listProspectsWithFollowups(),
        getSettings(),
      ]);
      if (!active) return;
      setItems(prospects);
      setIcp(settings.icp);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tightest">Pipeline</h1>
          <p className="mt-1 text-sm text-text-dim">
            Drag prospects across stages to move them through the funnel.
          </p>
        </div>
        <button className="btn-mint" onClick={() => setAdding(true)}>
          + Add prospect
        </button>
      </div>

      {loading ? (
        <Spinner label="Loading pipeline…" />
      ) : (
        <>
          <HeaderStats items={items} />
          {items.length === 0 ? (
            <EmptyState
              title="No prospects yet"
              sub="Add your first prospect to start building the pipeline."
            />
          ) : (
            <KanbanBoard items={items} onChange={refresh} />
          )}
        </>
      )}

      <Drawer open={adding} onClose={() => setAdding(false)}>
        <div className="flex flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-extrabold tracking-tightest">Add prospect</h2>
            <button
              className="text-text-dim hover:text-text"
              onClick={() => setAdding(false)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {icp && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-dim/70">
                Your ICP — reference
              </p>
              <IcpPanel icp={icp} />
            </div>
          )}

          <AddProspectForm onCreated={refresh} onClose={() => setAdding(false)} />
        </div>
      </Drawer>
    </div>
  );
}
