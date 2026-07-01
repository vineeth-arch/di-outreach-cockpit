import { NavLink, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useProspectDrawer } from '../lib/nav';
import ProspectDrawer from './ProspectDrawer';

const NAV = [
  { to: '/followups', label: 'Follow-ups' },
  { to: '/pipeline', label: 'Pipeline' },
  { to: '/icp', label: 'My ICP' },
  { to: '/settings', label: 'Settings' },
];

export default function Layout() {
  const { selectedId, close } = useProspectDrawer();

  return (
    <div className="mx-auto flex min-h-full max-w-[1400px] flex-col px-5 py-4">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-lg font-extrabold tracking-tightest text-mint">◆</span>
          <span className="font-display text-lg font-extrabold tracking-tightest">Outreach Cockpit</span>
        </div>
        <nav className="flex items-center gap-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  isActive ? 'bg-mint/15 text-mint' : 'text-text-dim hover:text-text'
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
          <button
            onClick={() => supabase.auth.signOut()}
            className="ml-2 rounded-lg px-3 py-1.5 text-sm text-text-dim hover:text-text"
          >
            Sign out
          </button>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {selectedId && <ProspectDrawer prospectId={selectedId} onClose={close} />}
    </div>
  );
}
