import { supabase } from './supabase';
import { firstFollowup, nextFollowup } from './cadence';
import {
  GRADUATION_STAGES,
  type Activity,
  type ActivityType,
  type Followup,
  type Prospect,
  type ProspectWithFollowup,
  type Settings,
  type Stage,
} from './types';

// A follow-up is "active" (shows on the dashboard, blocks new ones) when it is awaiting action.
const ACTIVE_STATUSES = ['Pending', 'Snoozed'] as const;

function must<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  return data as T;
}

// ---------- settings (single row) ----------
export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabase.from('settings').select('*').limit(1).single();
  return must(data, error);
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const { data, error } = await supabase
    .from('settings')
    .update(patch)
    .eq('id', current.id)
    .select('*')
    .single();
  return must(data, error);
}

// ---------- prospects ----------
export async function listProspects(): Promise<Prospect[]> {
  const { data, error } = await supabase
    .from('prospects')
    .select('*')
    .order('created_at', { ascending: false });
  return must(data, error);
}

/** Prospects with their single active follow-up attached — the shape the board & dashboard use. */
export async function listProspectsWithFollowups(): Promise<ProspectWithFollowup[]> {
  const [prospects, { data: fData, error: fErr }] = await Promise.all([
    listProspects(),
    supabase.from('followups').select('*').in('status', ACTIVE_STATUSES as unknown as string[]),
  ]);
  const active = must(fData, fErr) as Followup[];
  const byProspect = new Map<string, Followup>();
  for (const f of active) byProspect.set(f.prospect_id, f); // at most one active per prospect
  return prospects.map((p) => ({ ...p, followup: byProspect.get(p.id) ?? null }));
}

export async function getProspect(id: string): Promise<Prospect> {
  const { data, error } = await supabase.from('prospects').select('*').eq('id', id).single();
  return must(data, error);
}

export type NewProspect = Partial<Prospect> & Pick<Prospect, 'brand_name'>;

export async function createProspect(input: NewProspect): Promise<Prospect> {
  const { data, error } = await supabase.from('prospects').insert(input).select('*').single();
  return must(data, error);
}

export async function updateProspect(id: string, patch: Partial<Prospect>): Promise<Prospect> {
  const { data, error } = await supabase
    .from('prospects')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  return must(data, error);
}

/**
 * Move a prospect to a new stage and run the side effects:
 *  - first entry into 'Contacted' (no follow-up ever created) → auto-create the Step-1 follow-up + log it.
 *  - entry into a graduation stage ('Call Booked' / 'Won') → fire the webhook stub.
 * Returns the newly-created follow-up if one was made.
 */
export async function moveProspectStage(
  prospect: Prospect,
  stage: Stage,
): Promise<{ prospect: Prospect; createdFollowup: Followup | null }> {
  const updated = await updateProspect(prospect.id, { stage });
  let createdFollowup: Followup | null = null;

  if (stage === 'Contacted' && prospect.stage !== 'Contacted') {
    const { count } = await supabase
      .from('followups')
      .select('id', { count: 'exact', head: true })
      .eq('prospect_id', prospect.id);
    if (!count) {
      const settings = await getSettings();
      const first = firstFollowup(settings.followup_cadence);
      if (first) {
        createdFollowup = await createFollowup({
          prospect_id: prospect.id,
          due_date: first.due_date,
          sequence_step: first.sequence_step,
          reason: first.reason,
        });
        await addActivity(prospect.id, 'Follow-up done', `Cadence started — step 1 due ${first.due_date}`);
      }
    }
  }

  if (GRADUATION_STAGES.includes(stage) && prospect.stage !== stage) {
    void fireGraduationWebhook(updated, stage);
  }
  return { prospect: updated, createdFollowup };
}

// ---------- activities ----------
export async function listActivities(prospectId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('prospect_id', prospectId)
    .order('created_at', { ascending: false });
  return must(data, error);
}

export async function addActivity(
  prospectId: string,
  type: ActivityType,
  body?: string | null,
): Promise<Activity> {
  const { data, error } = await supabase
    .from('activities')
    .insert({ prospect_id: prospectId, type, body: body ?? null })
    .select('*')
    .single();
  return must(data, error);
}

// ---------- followups (the engine) ----------
export async function getActiveFollowup(prospectId: string): Promise<Followup | null> {
  const { data, error } = await supabase
    .from('followups')
    .select('*')
    .eq('prospect_id', prospectId)
    .in('status', ACTIVE_STATUSES as unknown as string[])
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** All active follow-ups joined with their prospect — the follow-up dashboard's data source. */
export async function listActiveFollowups(): Promise<(Followup & { prospect: Prospect })[]> {
  const { data, error } = await supabase
    .from('followups')
    .select('*, prospect:prospects(*)')
    .in('status', ACTIVE_STATUSES as unknown as string[])
    .order('due_date', { ascending: true });
  return must(data, error) as (Followup & { prospect: Prospect })[];
}

async function createFollowup(
  input: Pick<Followup, 'prospect_id' | 'due_date' | 'sequence_step' | 'reason'>,
): Promise<Followup> {
  const { data, error } = await supabase
    .from('followups')
    .insert({ ...input, status: 'Pending' })
    .select('*')
    .single();
  return must(data, error);
}

/**
 * Mark a follow-up done: close it, log the activity, and auto-create the next cadence step
 * (until the sequence is exhausted). Returns the next follow-up if one was created.
 */
export async function completeFollowup(followup: Followup): Promise<Followup | null> {
  const { error } = await supabase
    .from('followups')
    .update({ status: 'Done', completed_at: new Date().toISOString() })
    .eq('id', followup.id);
  if (error) throw new Error(error.message);
  await addActivity(followup.prospect_id, 'Follow-up done', followup.reason);

  const settings = await getSettings();
  const next = nextFollowup(followup, settings.followup_cadence);
  if (!next) return null;
  return createFollowup({
    prospect_id: followup.prospect_id,
    due_date: next.due_date,
    sequence_step: next.sequence_step,
    reason: next.reason,
  });
}

export async function snoozeFollowup(followup: Followup, newDue: string): Promise<Followup> {
  const { data, error } = await supabase
    .from('followups')
    .update({ status: 'Snoozed', due_date: newDue })
    .eq('id', followup.id)
    .select('*')
    .single();
  return must(data, error);
}

/** Stop the whole cadence for a prospect (they replied / not a fit). */
export async function cancelFollowup(followup: Followup): Promise<void> {
  const { error } = await supabase
    .from('followups')
    .update({ status: 'Cancelled' })
    .eq('id', followup.id);
  if (error) throw new Error(error.message);
}

// ---------- webhook stub (fire-and-forget) ----------
export async function fireGraduationWebhook(prospect: Prospect, event: Stage): Promise<void> {
  try {
    await fetch('/api/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prospect_id: prospect.id, graduation_event: event }),
    });
  } catch {
    // Stub — never blocks the UI if the webhook is down or unset.
  }
}
