// Run: npm test  (node --test)
// The cadence engine is the app's money path — one runnable check that fails if it breaks.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, daysUntil, bucketFor, dueLabel, firstFollowup, nextFollowup } from './cadence.ts';

const CADENCE = [
  { days_after: 3, note: 'bump' },
  { days_after: 7, note: 'proof' },
  { days_after: 14, note: 'close' },
];

test('addDays crosses month/leap boundaries', () => {
  assert.equal(addDays('2026-01-30', 3), '2026-02-02');
  assert.equal(addDays('2024-02-28', 1), '2024-02-29'); // leap year
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});

test('daysUntil / bucketFor / dueLabel', () => {
  const today = '2026-07-01';
  assert.equal(daysUntil('2026-06-29', today), -2);
  assert.equal(daysUntil('2026-07-01', today), 0);
  assert.equal(daysUntil('2026-07-04', today), 3);
  assert.equal(bucketFor('2026-06-29', today), 'overdue');
  assert.equal(bucketFor('2026-07-01', today), 'today');
  assert.equal(bucketFor('2026-07-04', today), 'upcoming');
  assert.equal(dueLabel('2026-06-29', today), 'Overdue 2d');
  assert.equal(dueLabel('2026-07-01', today), 'Due today');
  assert.equal(dueLabel('2026-07-04', today), 'Due in 3d');
});

test('firstFollowup: step 1 due = today + cadence[0]', () => {
  const f = firstFollowup(CADENCE, '2026-07-01');
  assert.deepEqual(f, { sequence_step: 1, due_date: '2026-07-04', reason: 'bump' });
});

test('nextFollowup advances the sequence, then exhausts', () => {
  const s2 = nextFollowup({ sequence_step: 1 }, CADENCE, '2026-07-04');
  assert.deepEqual(s2, { sequence_step: 2, due_date: '2026-07-11', reason: 'proof' });
  const s3 = nextFollowup({ sequence_step: 2 }, CADENCE, '2026-07-11');
  assert.deepEqual(s3, { sequence_step: 3, due_date: '2026-07-25', reason: 'close' });
  const done = nextFollowup({ sequence_step: 3 }, CADENCE, '2026-07-25');
  assert.equal(done, null); // sequence exhausted
});

test('empty cadence produces no follow-up', () => {
  assert.equal(firstFollowup([], '2026-07-01'), null);
});
