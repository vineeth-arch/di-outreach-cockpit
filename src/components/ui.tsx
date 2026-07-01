import type { ReactNode, TextareaHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import type { Category, Warmth } from '../lib/types';

// Shared primitives. Feature modules compose from these to keep one visual language.

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-medium">{label}</label>
      {children}
      {hint && <span className="text-xs text-dim/70">{hint}</span>}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full ${props.className ?? ''}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`w-full ${props.className ?? ''}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full ${props.className ?? ''}`} />;
}

const CATEGORY_STYLES: Record<Category, string> = {
  Wellness: 'bg-emerald-400/15 text-emerald-300',
  'F&B': 'bg-amber-400/15 text-amber-300',
  Beauty: 'bg-pink-400/15 text-pink-300',
};

export function CategoryBadge({ category }: { category: Category | null }) {
  if (!category) return null;
  return <span className={`chip ${CATEGORY_STYLES[category]}`}>{category}</span>;
}

const WARMTH_DOT: Record<Warmth, string> = {
  Cold: 'bg-sky-400/70',
  'Warm-adjacent': 'bg-amber-400/80',
  Warm: 'bg-accent',
};

export function WarmthDot({ warmth }: { warmth: Warmth | null }) {
  if (!warmth) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-dim" title={`Warmth: ${warmth}`}>
      <span className={`h-2 w-2 rounded-full ${WARMTH_DOT[warmth]}`} />
      {warmth}
    </span>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-dim">
      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent/40 border-t-accent" />
      {label}
    </span>
  );
}

export function EmptyState({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-16 text-center">
      <p className="font-display text-lg text-ink">{title}</p>
      {sub && <p className="text-sm text-dim">{sub}</p>}
    </div>
  );
}

/** Lightweight right-side drawer used by the prospect detail panel. */
export function Drawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-line bg-surface shadow-2xl">
        {children}
      </div>
    </div>
  );
}
