import type { VercelRequest, VercelResponse } from '@vercel/node';
import { admin } from './_lib/supabaseAdmin';
import { generate, type DraftModel } from './_lib/models';
import { buildFollowupPrompt } from './_lib/prompts';

interface CadenceStep {
  days_after: number;
  note: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { followup_id } = (req.body ?? {}) as { followup_id?: string };
  if (!followup_id) return res.status(400).json({ error: 'followup_id required' });

  try {
    const db = admin();
    const { data: followup, error: fErr } = await db
      .from('followups')
      .select('*')
      .eq('id', followup_id)
      .single();
    if (fErr || !followup) return res.status(404).json({ error: 'Follow-up not found' });

    const [{ data: prospect, error: pErr }, { data: settings, error: sErr }, { data: activities }] =
      await Promise.all([
        db.from('prospects').select('*').eq('id', followup.prospect_id).single(),
        db.from('settings').select('*').limit(1).single(),
        db
          .from('activities')
          .select('type, body, created_at')
          .eq('prospect_id', followup.prospect_id)
          .order('created_at', { ascending: false }),
      ]);
    if (pErr || !prospect) return res.status(404).json({ error: 'Prospect not found' });
    if (sErr || !settings) return res.status(500).json({ error: 'Settings missing' });

    const cadence = (settings.followup_cadence ?? []) as CadenceStep[];
    const step = {
      number: followup.sequence_step,
      total: cadence.length,
      note: cadence[followup.sequence_step - 1]?.note ?? 'Add a new angle and keep the door open.',
      reason: followup.reason,
    };

    const { system, prompt } = buildFollowupPrompt(prospect, settings, activities ?? [], step);
    const result = await generate({
      model: settings.draft_model as DraftModel,
      openrouterModel: settings.openrouter_model,
      system,
      prompt,
    });
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Draft failed' });
  }
}
