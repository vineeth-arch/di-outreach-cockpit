// One-time: create the single login user. Sign-up is disabled, so this is how the
// founder's account gets made. Run it yourself — the password never goes through chat.
//
//   NEW_USER_EMAIL=you@example.com NEW_USER_PASSWORD='a-strong-password' npm run create-user
//
// Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local (or the shell env).
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// Minimal .env.local loader (no dependency).
try {
  for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  /* no .env.local — rely on shell env */
}

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.NEW_USER_EMAIL;
const password = process.env.NEW_USER_PASSWORD;

if (!url || !key) throw new Error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
if (!email || !password) throw new Error('Set NEW_USER_EMAIL and NEW_USER_PASSWORD env vars');

const supabase = createClient(url, key, { auth: { persistSession: false } });
const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true, // no confirmation email needed for a single-user app
});
if (error) throw error;
console.log(`✓ Created login user: ${data.user.email} (${data.user.id})`);
console.log('Now disable sign-ups: Supabase dashboard → Authentication → Providers → Email → turn OFF "Allow new users to sign up".');
