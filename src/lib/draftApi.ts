// Thin client for the serverless draft endpoints. Keys live server-side; this only sees text.

export interface DraftResult {
  draft: string;
  used_model: string; // e.g. 'claude-haiku-4-5-20251001'
  fallback?: string; // present when the requested provider key was missing
  error?: string;
}

async function post(path: string, body: unknown): Promise<DraftResult> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as DraftResult;
  if (!res.ok && !json.draft) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

export function draftOutreach(prospectId: string): Promise<DraftResult> {
  return post('/api/draft-outreach', { prospect_id: prospectId });
}

export function draftFollowup(followupId: string): Promise<DraftResult> {
  return post('/api/draft-followup', { followup_id: followupId });
}

export function classify(text: string, task: 'category' | 'summary'): Promise<DraftResult> {
  return post('/api/classify', { text, task });
}
