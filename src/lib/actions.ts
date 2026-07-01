// Manual-send helpers. NOTHING here sends automatically — they only build links / copy text.

export async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

/** mailto: deeplink. Body newlines are encoded; opens the user's mail client, does not send. */
export function mailtoLink(to: string | null | undefined, subject: string, body: string): string {
  const params = new URLSearchParams({ subject, body });
  return `mailto:${to ?? ''}?${params.toString()}`;
}

/** wa.me deeplink. Phone optional; if absent, opens WhatsApp with just the prefilled text. */
export function whatsappLink(phone: string | null | undefined, text: string): string {
  const digits = (phone ?? '').replace(/[^\d]/g, '');
  const q = new URLSearchParams({ text }).toString();
  return digits ? `https://wa.me/${digits}?${q}` : `https://wa.me/?${q}`;
}

/** Split a drafted email into a subject line + body for mailto. First non-empty line = subject. */
export function splitDraft(draft: string): { subject: string; body: string } {
  const trimmed = draft.trim();
  const m = trimmed.match(/^subject:\s*(.+)$/im);
  if (m) {
    const subject = m[1].trim();
    const body = trimmed.replace(m[0], '').trim();
    return { subject, body };
  }
  const [first, ...rest] = trimmed.split('\n');
  return { subject: first.trim(), body: rest.join('\n').trim() || trimmed };
}
