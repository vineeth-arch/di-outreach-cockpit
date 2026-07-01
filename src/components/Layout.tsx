import { NavLink, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useProspectDrawer } from '../lib/nav';
import ProspectDrawer from './ProspectDrawer';
import { ThemeToggle } from './ThemeToggle';
import logoLight from '../assets/logo-light.png';
import logoDark from '../assets/logo-dark.png';

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
        <div className="flex items-center">
          <img src={logoLight} alt="Design Innsaeit" className="h-7 w-auto dark:hidden" />
          <img src={logoDark} alt="Design Innsaeit" className="hidden h-7 w-auto dark:block" />
        </div>
        <nav className="flex items-center gap-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  isActive ? 'bg-accent/15 text-accent' : 'text-dim hover:text-ink'
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
          <ThemeToggle />
          <button
            onClick={() => supabase.auth.signOut()}
            className="ml-2 rounded-lg px-3 py-1.5 text-sm text-dim hover:text-ink"
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
