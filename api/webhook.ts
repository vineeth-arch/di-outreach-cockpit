import type { VercelRequest, VercelResponse } from '@vercel/node';
import { admin } from './_lib/supabaseAdmin';

// Forward-compat stub. When settings.webhook_url is set, POST the full prospect record +
// graduation_event to it when a prospect graduates (stage → Call Booked / Won).
// We do NOT build the n8n side — this only forwards.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { prospect_id, graduation_event } = (req.body ?? {}) as {
    prospect_id?: string;
    graduation_event?: string;
  };
  if (!prospect_id || !graduation_event) {
    return res.status(400).json({ error: 'prospect_id and graduation_event required' });
  }

  try {
    const db = admin();
    const { data: settings } = await db.from('settings').select('webhook_url').limit(1).single();
    const url = settings?.webhook_url;
    if (!url) return res.status(200).json({ forwarded: false, reason: 'no webhook_url set' });

    const { data: prospect, error } = await db
      .from('prospects')
      .select('*')
      .eq('id', prospect_id)
      .single();
    if (error || !prospect) return res.status(404).json({ error: 'Prospect not found' });

    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ graduation_event, prospect }),
    });
    return res.status(200).json({ forwarded: true });
  } catch (e) {
    // Never hard-fail the caller — the webhook is best-effort.
    return res.status(200).json({ forwarded: false, error: e instanceof Error ? e.message : 'failed' });
  }
}
