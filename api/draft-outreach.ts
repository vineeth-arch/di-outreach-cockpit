import type { VercelRequest, VercelResponse } from '@vercel/node';
import { admin } from './_lib/supabaseAdmin';
import { generate, type DraftModel } from './_lib/models';
import { buildOutreachPrompt } from './_lib/prompts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { prospect_id } = (req.body ?? {}) as { prospect_id?: string };
  if (!prospect_id) return res.status(400).json({ error: 'prospect_id required' });

  try {
    const db = admin();
    const [{ data: prospect, error: pErr }, { data: settings, error: sErr }] = await Promise.all([
      db.from('prospects').select('*').eq('id', prospect_id).single(),
      db.from('settings').select('*').limit(1).single(),
    ]);
    if (pErr || !prospect) return res.status(404).json({ error: 'Prospect not found' });
    if (sErr || !settings) return res.status(500).json({ error: 'Settings missing' });

    const { system, prompt } = buildOutreachPrompt(prospect, settings);
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
