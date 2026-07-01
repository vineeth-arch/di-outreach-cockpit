import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui';

// Sign-in only. Sign-up is disabled in the Supabase dashboard and intentionally has no UI here.
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setBusy(false);
  }

  return (
    <div className="grid min-h-full place-items-center p-6">
      <Card className="w-full max-w-sm p-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-mint">Design Innsaeit</p>
        <h1 className="mt-1 text-3xl">Outreach Cockpit</h1>
        <p className="mt-2 text-sm text-text-dim">Private. One driver.</p>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button type="submit" className="btn-mint mt-1" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </Card>
    </div>
  );
}
