import type { CadenceStep } from '../lib/types';

// Controlled editor for the follow-up cadence. Each step's due date is relative
// to the previous touch (days_after), so the list reads as a running sequence.

export function CadenceEditor({
  value,
  onChange,
}: {
  value: CadenceStep[];
  onChange: (next: CadenceStep[]) => void;
}) {
  function update(index: number, patch: Partial<CadenceStep>) {
    onChange(value.map((step, i) => (i === index ? { ...step, ...patch } : step)));
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...value, { days_after: 3, note: '' }]);
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="font-medium text-text">Follow-up cadence</p>
        <p className="text-xs text-text-dim/70">
          Each step is due this many days after the previous touch. Step 1 counts from when a
          prospect enters Contacted.
        </p>
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-text-dim">No steps yet — add one to start the cadence.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {value.map((step, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-xs font-semibold text-mint">Touch {i + 1}</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  value={step.days_after}
                  onChange={(e) => update(i, { days_after: Number(e.target.value) })}
                  className="w-20"
                  aria-label={`Days after previous touch for step ${i + 1}`}
                />
                <span className="text-xs text-text-dim">days after</span>
              </div>
              <input
                type="text"
                value={step.note}
                onChange={(e) => update(i, { note: e.target.value })}
                placeholder="What this touch is about"
                className="flex-1"
                aria-label={`Note for step ${i + 1}`}
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="btn-danger shrink-0"
                aria-label={`Remove step ${i + 1}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ol>
      )}

      <div>
        <button type="button" onClick={add} className="btn-ghost">
          Add step
        </button>
      </div>
    </div>
  );
}
