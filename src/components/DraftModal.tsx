import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { DraftResult } from '../lib/draftApi';
import { copyText, mailtoLink, splitDraft, whatsappLink } from '../lib/actions';
import { Spinner } from './ui';

/**
 * Editable draft surface with manual-send links. NOTHING auto-sends.
 * The caller supplies `fetchDraft` (already bound to draftOutreach/draftFollowup).
 */
export function DraftModal({
  open,
  onClose,
  title,
  fetchDraft,
  recipientEmail,
  recipientPhone,
  extraActions,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  fetchDraft: () => Promise<DraftResult>;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  extraActions?: (currentText: string) => ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [meta, setMeta] = useState<Partial<Pick<DraftResult, 'used_model' | 'fallback' | 'error'>>>({});
  const [copied, setCopied] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    setMeta({});
    try {
      const r = await fetchDraft();
      setText(r.draft ?? '');
      setMeta({ used_model: r.used_model, fallback: r.fallback, error: r.error });
    } catch (e) {
      setMeta({ error: e instanceof Error ? e.message : 'Draft failed' });
    } finally {
      setLoading(false);
    }
  }, [fetchDraft]);

  useEffect(() => {
    if (open) void run();
  }, [open, run]);

  if (!open) return null;
  const { subject, body } = splitDraft(text);

  async function doCopy() {
    await copyText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="card relative z-10 flex w-full max-w-2xl flex-col gap-3 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl">{title}</h3>
          <button onClick={onClose} className="text-dim hover:text-ink" aria-label="Close">
            ✕
          </button>
        </div>

        {meta.error && (
          <p className="rounded-lg bg-red-400/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">{meta.error}</p>
        )}
        {meta.fallback && (
          <p className="rounded-lg bg-amber-400/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">{meta.fallback}</p>
        )}

        {loading ? (
          <div className="grid h-64 place-items-center">
            <Spinner label="Drafting with your voice…" />
          </div>
        ) : (
          <textarea
            className="h-72 w-full resize-none font-body text-sm leading-relaxed"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-mint" onClick={doCopy} disabled={loading || !text}>
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
          <a
            className="btn-ghost"
            href={mailtoLink(recipientEmail, subject, body)}
            aria-disabled={loading}
          >
            Email
          </a>
          <a
            className="btn-ghost"
            href={whatsappLink(recipientPhone, text)}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp
          </a>
          <button className="btn-ghost" onClick={() => void run()} disabled={loading}>
            Regenerate
          </button>
          <div className="ml-auto flex items-center gap-2">
            {extraActions?.(text)}
          </div>
        </div>

        {meta.used_model && (
          <p className="text-right text-xs text-dim/70">model: {meta.used_model}</p>
        )}
        <p className="text-xs text-dim/60">
          Nothing is sent automatically — Copy, Email, or WhatsApp puts you in control of the send.
        </p>
      </div>
    </div>
  );
}
