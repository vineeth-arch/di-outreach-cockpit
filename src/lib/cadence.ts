import type { CadenceStep, Followup } from './types';

// All dates are 'YYYY-MM-DD' strings interpreted as calendar days (no TZ math).

export function isoToday(): string {
  const d = new Date();
  return toIso(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function toIso(y: number, m: number, day: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Add n calendar days to an ISO date. Uses UTC to avoid DST drift. */
export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d) + n * 86400000;
  const dt = new Date(t);
  return toIso(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

/** Signed day difference dueDate - today. Negative = overdue, 0 = due today. */
export function daysUntil(dueIso: string, today = isoToday()): number {
  const [y1, m1, d1] = dueIso.split('-').map(Number);
  const [y2, m2, d2] = today.split('-').map(Number);
  return Math.round((Date.UTC(y1, m1 - 1, d1) - Date.UTC(y2, m2 - 1, d2)) / 86400000);
}

export type Bucket = 'overdue' | 'today' | 'upcoming';

export function bucketFor(dueIso: string, today = isoToday()): Bucket {
  const d = daysUntil(dueIso, today);
  if (d < 0) return 'overdue';
  if (d === 0) return 'today';
  return 'upcoming';
}

/** Human label for a follow-up's due date, e.g. "Overdue 2d", "Due today", "Due in 3d". */
export function dueLabel(dueIso: string, today = isoToday()): string {
  const d = daysUntil(dueIso, today);
  if (d < 0) return `Overdue ${-d}d`;
  if (d === 0) return 'Due today';
  if (d === 1) return 'Due tomorrow';
  return `Due in ${d}d`;
}

/**
 * The first follow-up when a prospect enters Contacted.
 * sequence_step is 1-based; cadence is 0-indexed, so step N uses cadence[N-1].
 */
export function firstFollowup(
  cadence: CadenceStep[],
  today = isoToday(),
): { sequence_step: number; due_date: string; reason: string } | null {
  if (!cadence.length) return null;
  return {
    sequence_step: 1,
    due_date: addDays(today, cadence[0].days_after),
    reason: cadence[0].note,
  };
}

/**
 * Given the just-completed follow-up, the next one in the cadence (or null if exhausted).
 * A step with sequence_step = s used cadence[s-1]; the next step is cadence[s].
 */
export function nextFollowup(
  completed: Pick<Followup, 'sequence_step'>,
  cadence: CadenceStep[],
  today = isoToday(),
): { sequence_step: number; due_date: string; reason: string } | null {
  const nextIdx = completed.sequence_step; // 0-based index of the NEXT step
  if (nextIdx >= cadence.length) return null;
  return {
    sequence_step: completed.sequence_step + 1,
    due_date: addDays(today, cadence[nextIdx].days_after),
    reason: cadence[nextIdx].note,
  };
}

export function stepLabel(step: number, cadence: CadenceStep[]): string {
  return `Touch ${step} of ${cadence.length}`;
}
