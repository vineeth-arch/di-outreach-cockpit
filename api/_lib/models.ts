// Single shared model router. Both draft endpoints (and classify) import this.
// Every provider is called via fetch — no SDK deps, one place to add providers later.
// ALL keys are read from process.env here (server only). Nothing here ever reaches the client bundle.

export type DraftModel = 'claude-haiku' | 'openrouter' | 'gemini-flash' | 'groq-llama';

export interface GenerateInput {
  model: DraftModel;
  system: string;
  prompt: string;
  openrouterModel?: string; // used only when model === 'openrouter'
  maxTokens?: number;
}

export interface GenerateResult {
  text: string;
  used_model: string;
  fallback?: string; // set when we had to fall back (e.g. requested key missing)
}

const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';
const GEMINI_MODEL = 'gemini-2.0-flash';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const DEFAULT_OPENROUTER_MODEL = 'meta-llama/llama-3.3-70b-instruct:free';

class MissingKeyError extends Error {}

async function callAnthropic(system: string, prompt: string, maxTokens: number): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new MissingKeyError('ANTHROPIC_API_KEY not set');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.content?.[0]?.text ?? '';
}

// OpenAI-compatible chat completions (OpenRouter + Groq share this shape).
async function callOpenAICompat(
  baseUrl: string,
  key: string | undefined,
  keyName: string,
  model: string,
  system: string,
  prompt: string,
  maxTokens: number,
  extraHeaders: Record<string, string> = {},
): Promise<string> {
  if (!key) throw new MissingKeyError(`${keyName} not set`);
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}`, ...extraHeaders },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`${keyName} ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? '';
}

async function callGemini(system: string, prompt: string, maxTokens: number): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new MissingKeyError('GEMINI_API_KEY not set');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
}

async function dispatch(model: DraftModel, input: GenerateInput, maxTokens: number): Promise<string> {
  switch (model) {
    case 'claude-haiku':
      return callAnthropic(input.system, input.prompt, maxTokens);
    case 'openrouter':
      return callOpenAICompat(
        'https://openrouter.ai/api/v1',
        process.env.OPENROUTER_API_KEY,
        'OPENROUTER_API_KEY',
        input.openrouterModel || DEFAULT_OPENROUTER_MODEL,
        input.system,
        input.prompt,
        maxTokens,
        { 'HTTP-Referer': 'https://outreach.designinnsaeit.com', 'X-Title': 'DI Outreach Cockpit' },
      );
    case 'groq-llama':
      return callOpenAICompat(
        'https://api.groq.com/openai/v1',
        process.env.GROQ_API_KEY,
        'GROQ_API_KEY',
        GROQ_MODEL,
        input.system,
        input.prompt,
        maxTokens,
      );
    case 'gemini-flash':
      return callGemini(input.system, input.prompt, maxTokens);
  }
}

const LABEL: Record<DraftModel, string> = {
  'claude-haiku': ANTHROPIC_MODEL,
  openrouter: 'openrouter',
  'gemini-flash': GEMINI_MODEL,
  'groq-llama': GROQ_MODEL,
};

/**
 * Generate text via the chosen provider. If the chosen provider's key is missing,
 * gracefully fall back to Claude Haiku with a clear message. If Haiku's key is also
 * missing, throw — the caller surfaces the error.
 */
export async function generate(input: GenerateInput): Promise<GenerateResult> {
  const maxTokens = input.maxTokens ?? 900;
  try {
    const text = await dispatch(input.model, input, maxTokens);
    const label = input.model === 'openrouter' ? input.openrouterModel || DEFAULT_OPENROUTER_MODEL : LABEL[input.model];
    return { text, used_model: label };
  } catch (e) {
    if (e instanceof MissingKeyError && input.model !== 'claude-haiku') {
      const text = await callAnthropic(input.system, input.prompt, maxTokens);
      return {
        text,
        used_model: ANTHROPIC_MODEL,
        fallback: `${input.model} key missing — fell back to Claude Haiku. Add the key in Vercel env to use it.`,
      };
    }
    throw e;
  }
}
