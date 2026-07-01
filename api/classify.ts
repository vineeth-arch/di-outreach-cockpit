import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generate, type DraftModel } from './_lib/models';

// Lighter helper: categorize a signal, or summarize pasted website copy.
// Defaults to a free provider (OpenRouter → Groq → Gemini), falling back to Claude Haiku.
function pickFreeModel(): DraftModel {
  if (process.env.OPENROUTER_API_KEY) return 'openrouter';
  if (process.env.GROQ_API_KEY) return 'groq-llama';
  if (process.env.GEMINI_API_KEY) return 'gemini-flash';
  return 'claude-haiku';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { text, task } = (req.body ?? {}) as { text?: string; task?: 'category' | 'summary' };
  if (!text) return res.status(400).json({ error: 'text required' });

  const system =
    task === 'category'
      ? 'You classify a brand into exactly one of: Wellness, F&B, Beauty. Reply with only the single label.'
      : 'You summarize pasted website/brand copy into 2–3 tight sentences a designer could use as an outreach signal. No preamble.';

  try {
    const result = await generate({
      model: pickFreeModel(),
      openrouterModel: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
      system,
      prompt: text,
      maxTokens: task === 'category' ? 12 : 220,
    });
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Classify failed' });
  }
}
