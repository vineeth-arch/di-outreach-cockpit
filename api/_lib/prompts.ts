// Prompt construction for first-touch and follow-up drafts.
// Server-owned shapes (a subset of the DB rows) to keep this decoupled from the client bundle.

export interface PromptProspect {
  brand_name: string;
  category: string | null;
  country: string | null;
  contact_name: string | null;
  contact_role: string | null;
  website: string | null;
  source: string | null;
  signal: string | null;
  warmth: string | null;
  notes: string | null;
}

export interface PromptSettings {
  my_voice: string | null;
  my_offer: string | null;
  credibility: string | null;
  icp: Record<string, unknown>;
}

export interface PromptActivity {
  type: string;
  body: string | null;
  created_at: string;
}

const BASE_RULES = `You are the founder of Design Innsaeit, a boutique brand & packaging design studio, writing your own outreach.
Write in first person as the founder. Match the founder's voice below exactly.
Hard rules:
- Flush-left, plain, human. No corporate filler, no "I hope this email finds you well", no "just reaching out".
- Short. 90–150 words. Every sentence earns its place.
- Lead with something specific and true about THEIR brand (use the signal). Never generic flattery.
- One clear, low-friction call to action. Never pushy.
- Output a ready-to-send email. First line must be "Subject: <line>". Then a blank line, then the body.
- Sign off as the founder. Do not invent facts, case studies, metrics, or names not given below.`;

function context(settings: PromptSettings): string {
  return [
    settings.my_voice ? `MY VOICE:\n${settings.my_voice}` : '',
    settings.my_offer ? `MY OFFER:\n${settings.my_offer}` : '',
    settings.credibility ? `MY CREDIBILITY (only use what's here, verbatim in spirit):\n${settings.credibility}` : '',
    Object.keys(settings.icp || {}).length ? `MY ICP:\n${JSON.stringify(settings.icp, null, 2)}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

function prospectFacts(p: PromptProspect): string {
  return [
    `Brand: ${p.brand_name}`,
    p.category && `Category: ${p.category}`,
    p.country && `Country: ${p.country}`,
    p.contact_name && `Contact: ${p.contact_name}${p.contact_role ? ` (${p.contact_role})` : ''}`,
    p.website && `Website: ${p.website}`,
    p.source && `How I know them / source: ${p.source}`,
    p.warmth && `Warmth: ${p.warmth}`,
    p.signal && `Reason to reach out (the signal): ${p.signal}`,
    p.notes && `My notes: ${p.notes}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildOutreachPrompt(p: PromptProspect, settings: PromptSettings) {
  const system = `${BASE_RULES}\n\n${context(settings)}`;
  const prompt = `Write a FIRST-TOUCH outreach email to this prospect.\n\n${prospectFacts(p)}\n\nGround the opening in the signal. Make the ask easy to say yes to.`;
  return { system, prompt };
}

export function buildFollowupPrompt(
  p: PromptProspect,
  settings: PromptSettings,
  activities: PromptActivity[],
  step: { number: number; total: number; note: string; reason: string | null },
) {
  const system = `${BASE_RULES}
This is a FOLLOW-UP, not a first touch. Extra rules:
- NEVER write "just checking in", "circling back", "bumping this", or "following up".
- Reference the prior touch naturally, then add ONE genuinely NEW angle, idea, or piece of value they didn't get before.
- Even shorter than a first touch: 60–110 words.
- Keep the door open; make it effortless to reply. Do not guilt-trip about silence.

${context(settings)}`;

  const history = activities.length
    ? activities
        .slice(0, 12)
        .map((a) => `- [${a.created_at.slice(0, 10)}] ${a.type}${a.body ? `: ${a.body}` : ''}`)
        .join('\n')
    : '- (no prior activity logged)';

  const prompt = `Write follow-up touch ${step.number} of ${step.total} to this prospect.

${prospectFacts(p)}

PRIOR ACTIVITY (newest first):
${history}

This step's intent: ${step.note}
Why now: ${step.reason ?? step.note}

Add a NEW angle — do not repeat what an earlier touch already said.`;
  return { system, prompt };
}
