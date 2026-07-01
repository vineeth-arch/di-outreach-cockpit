import type { VercelRequest, VercelResponse } from '@vercel/node';
import { admin } from './_lib/supabaseAdmin';

// Trivial Supabase query keeps both Vercel and the Supabase free-tier DB warm.
// Point an Uptime Robot HTTP monitor here at a 5-min interval (see README).
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const { error } = await admin().from('settings').select('id', { head: true, count: 'exact' });
    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.status(200).json({ ok: true, ts: new Date().toISOString() });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e instanceof Error ? e.message : 'ping failed' });
  }
}
