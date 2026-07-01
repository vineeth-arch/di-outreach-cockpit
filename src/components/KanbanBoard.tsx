import {
  DndContext,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import type { ProspectWithFollowup, Stage } from '../lib/types';
import { STAGES } from '../lib/types';
import { moveProspectStage } from '../lib/db';
import { ProspectCard } from './ProspectCard';

function Column({
  stage,
  items,
}: {
  stage: Stage;
  items: ProspectWithFollowup[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h3 className="font-display text-sm font-extrabold tracking-tightest text-text">
          {stage}
        </h3>
        <span className="text-xs font-semibold text-text-dim">{items.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-[60vh] flex-col gap-2 rounded-xl border border-white/5 bg-ink-2/20 p-2 transition ${
          isOver ? 'border-mint/40 bg-mint/5' : ''
        }`}
      >
        {items.map((item) => (
          <ProspectCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export function KanbanBoard({
  items,
  onChange,
}: {
  items: ProspectWithFollowup[];
  onChange: () => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const byStage = (stage: Stage) => items.filter((i) => i.stage === stage);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const item = active.data.current?.prospect as ProspectWithFollowup | undefined;
    const newStage = over.id as Stage;
    if (!item || item.stage === newStage) return;
    await moveProspectStage(item, newStage);
    onChange();
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <Column key={stage} stage={stage} items={byStage(stage)} />
        ))}
      </div>
    </DndContext>
  );
}
