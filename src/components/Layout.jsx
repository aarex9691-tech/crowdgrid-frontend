import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, ScanLine, ShieldCheck, Tent, Ticket, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ROLE_LABELS, useAuth } from '../lib/auth';

const workspaceFor = (role) =>
  ({
    SUPER_ADMIN: { to: '/control', label: 'Control room', icon: ShieldCheck },
    AUTHORITY: { to: '/control', label: 'Control room', icon: ShieldCheck },
    NGO_ADMIN: { to: '/ngo', label: 'My camps', icon: Tent },
    VOLUNTEER: { to: '/scan', label: 'Scanner', icon: ScanLine },
    CORPORATE_ADMIN: { to: '/scan', label: 'Scanner', icon: ScanLine },
  })[role];

function useOnline() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return online;
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const online = useOnline();
  const workspace = user && workspaceFor(user.role);

  const navCls = ({ isActive }) =>
    `flex min-h-12 items-center gap-2 rounded-xl px-3 font-semibold ${isActive ? 'bg-mist text-ink' : 'text-ink-soft hover:text-ink'}`;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="shell flex h-16 items-center gap-1 sm:gap-2">
          <Link to="/" className="mr-auto flex items-center gap-2" aria-label="CrowdGrid home">
            <img src="/favicon.svg" alt="" className="h-8 w-8" />
            <span className="font-display text-xl leading-none text-ink sm:text-2xl">CrowdGrid</span>
          </Link>

          {workspace && (
            <NavLink to={workspace.to} className={navCls}>
              <workspace.icon size={20} aria-hidden />
              <span className="hidden sm:inline">{workspace.label}</span>
            </NavLink>
          )}
          <NavLink to="/passbook" className={navCls} aria-label="My Yatra Passbook">
            <Ticket size={20} aria-hidden />
            <span className="hidden sm:inline">My Yatra Passbook</span>
          </NavLink>

          {user ? (
            <div className="flex items-center gap-1">
              <NavLink to="/account" className={navCls} title={ROLE_LABELS[user.role]}>
                <UserRound size={20} aria-hidden />
                <span className="hidden max-w-32 truncate md:inline">{user.name.split(' ')[0]}</span>
              </NavLink>
              <button
                type="button"
                className="flex min-h-12 min-w-12 items-center justify-center rounded-xl text-ink-soft hover:text-ink"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                aria-label="Log out"
                title="Log out"
              >
                <LogOut size={20} aria-hidden />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-ink min-h-10 whitespace-nowrap px-4">
              Log in
            </Link>
          )}
        </div>
        {!online && (
          <p className="bg-ink py-1 text-center text-sm text-white" role="status">
            You're offline. Your saved passes still work in the passbook.
          </p>
        )}
      </header>

      <main className="flex-1 pb-16">
        <Outlet />
      </main>

      <footer className="border-t border-line bg-white py-6 text-sm text-ink-soft">
        <div className="shell flex flex-wrap justify-between gap-2">
          <span>CrowdGrid · Pilgrimage &amp; mass gathering operations</span>
          <span>
            Emergency: <a className="font-semibold text-kumkum" href="tel:112">112</a> · Medical:{' '}
            <a className="font-semibold text-kumkum" href="tel:108">108</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
