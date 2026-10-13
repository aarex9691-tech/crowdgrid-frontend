import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Briefcase, CalendarPlus, LogOut, Menu, MessageCircle, ScanLine, ShieldCheck, ShoppingCart, Tent, Ticket, UserRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ROLE_LABELS, useAuth } from '../lib/auth';
import { useCart } from '../lib/cart';
import { SITE } from '../lib/site';

/**
 * Each role gets its own navigation. Pilgrims see booking (passbook, cart,
 * "Book now"); admins and hosts see their dashboards instead and never book.
 */
const navFor = (role) => {
  const scan = { to: '/scan', label: 'Scanner', icon: ScanLine };
  const about = { to: '/about', label: 'About' };
  switch (role) {
    case 'SUPER_ADMIN':
      return {
        links: [{ to: '/control', label: 'Control room', icon: ShieldCheck }, { to: '/host', label: 'Hosted events', icon: CalendarPlus }, { to: '/corporate-admin', label: 'Corporate', icon: Briefcase }, scan],
        cta: { to: '/host', label: 'Host an event' },
      };
    case 'AUTHORITY':
      return {
        links: [{ to: '/control', label: 'Control room', icon: ShieldCheck }, { to: '/host', label: 'Hosted events', icon: CalendarPlus }, scan, about],
        cta: { to: '/host', label: 'Host an event' },
      };
    case 'NGO_ADMIN':
      return { links: [{ to: '/ngo', label: 'My camps', icon: Tent }, scan, { to: '/events', label: 'Events' }, about], cta: { to: '/scan', label: 'Open scanner' } };
    case 'CORPORATE_ADMIN':
      return { links: [{ to: '/corporate-admin', label: 'My events', icon: Briefcase }, scan, about], cta: { to: '/corporate-admin', label: 'New event' } };
    case 'VOLUNTEER':
      return { links: [scan, { to: '/passbook', label: 'My ID badge', icon: Ticket }, about], cta: { to: '/scan', label: 'Open scanner' } };
    default:
      return {
        links: [{ to: '/', label: 'Home', end: true }, { to: '/events', label: 'Events' }, { to: '/passbook', label: 'My Passbook' }, about],
        cta: { to: `/yatra/${SITE.flagshipSlug}`, label: 'Book now' },
        shopper: true,
      };
  }
};

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
  const cart = useCart();
  const navigate = useNavigate();
  const online = useOnline();
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = navFor(user?.role);
  const close = () => setMenuOpen(false);

  const doLogout = () => {
    close();
    cart.clear();
    logout();
    navigate('/');
  };

  const linkCls = ({ isActive }) =>
    `flex min-h-11 items-center gap-2 rounded-xl px-3 font-semibold ${isActive ? 'bg-mist text-ink' : 'text-ink-soft hover:text-ink'}`;
  const menuCls = ({ isActive }) =>
    `flex min-h-12 items-center gap-3 rounded-xl px-4 text-lg font-semibold ${isActive ? 'bg-mist text-ink' : 'text-ink'}`;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="shell flex h-16 items-center gap-1">
          <Link to="/" className="mr-auto flex items-center gap-2 lg:mr-4" aria-label="CrowdGrid home" onClick={close}>
            <img src="/favicon.svg" alt="" className="h-8 w-8" />
            <span className="font-display text-xl leading-none text-ink sm:text-2xl">CrowdGrid</span>
          </Link>

          {/* Desktop navigation */}
          <nav aria-label="Main" className="mr-auto hidden items-center gap-0.5 lg:flex">
            {nav.links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkCls}>
                {l.icon && <l.icon size={18} aria-hidden />} {l.label}
              </NavLink>
            ))}
          </nav>

          {nav.shopper && cart.count > 0 && (
            <NavLink to="/checkout" className={linkCls} aria-label={`Cart, ${cart.count} item${cart.count > 1 ? 's' : ''}`} onClick={close}>
              <span className="relative">
                <ShoppingCart size={20} aria-hidden />
                <span className="absolute -right-2 -top-2 rounded-full bg-kumkum px-1.5 text-xs font-bold text-white">{cart.count}</span>
              </span>
            </NavLink>
          )}

          <div className="hidden items-center gap-1 lg:flex">
            {user ? (
              <>
                <NavLink to="/account" className={linkCls} title={ROLE_LABELS[user.role]}>
                  <UserRound size={18} aria-hidden />
                  <span className="max-w-28 truncate">{user.name.split(' ')[0]}</span>
                </NavLink>
                <button type="button" className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-ink-soft hover:text-ink" onClick={doLogout} aria-label="Log out" title="Log out">
                  <LogOut size={20} aria-hidden />
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-ghost min-h-10 px-4">Log in</Link>
            )}
          </div>

          {/* Call to action */}
          <Link to={nav.cta.to} className="btn-primary ml-1 hidden min-h-10 whitespace-nowrap px-4 sm:inline-flex" onClick={close}>
            {nav.cta.label}
          </Link>

          {/* Mobile menu button */}
          <button
            type="button"
            className="ml-1 flex min-h-11 min-w-11 items-center justify-center rounded-xl text-ink lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X size={26} aria-hidden /> : <Menu size={26} aria-hidden />}
          </button>
        </div>

        {menuOpen && (
          <nav id="mobile-menu" aria-label="Main" className="border-t border-line bg-white lg:hidden">
            <div className="shell space-y-1 py-3">
              {nav.links.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} className={menuCls} onClick={close}>
                  {l.icon && <l.icon size={20} aria-hidden />} {l.label}
                </NavLink>
              ))}
              <div className="my-2 border-t border-line" />
              {user ? (
                <>
                  <NavLink to="/account" className={menuCls} onClick={close}>
                    <UserRound size={20} aria-hidden /> {user.name} <span className="text-sm font-normal text-ink-soft">· {ROLE_LABELS[user.role]}</span>
                  </NavLink>
                  <button type="button" className="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-lg font-semibold text-ink" onClick={doLogout}>
                    <LogOut size={20} aria-hidden /> Log out
                  </button>
                </>
              ) : (
                <NavLink to="/login" className={menuCls} onClick={close}>Log in or create account</NavLink>
              )}
              <Link to={nav.cta.to} className="btn-primary mt-2 w-full sm:hidden" onClick={close}>
                {nav.cta.label}
              </Link>
            </div>
          </nav>
        )}

        {!online && (
          <p className="bg-ink py-1 text-center text-sm text-white" role="status">
            You're offline. Your saved passes still work in the passbook.
          </p>
        )}
      </header>

      <main className="flex-1 pb-16">
        <Outlet />
      </main>

      <a
        href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent('Hi, I need help with CrowdGrid.')}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with us on WhatsApp"
        title="Chat with us on WhatsApp"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 hover:brightness-105"
      >
        <MessageCircle size={28} aria-hidden />
      </a>

      <footer className="border-t border-line bg-white text-ink-soft">
        <div className="shell grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="flex items-center gap-2">
              <img src="/favicon.svg" alt="" className="h-7 w-7" />
              <span className="font-display text-xl text-ink">CrowdGrid</span>
            </p>
            <p className="mt-2 text-sm">{SITE.tagline}. Built for the Simhastha Kumbh Mela 2027, Nashik–Trimbakeshwar.</p>
          </div>
          <div>
            <p className="font-semibold text-ink">Explore</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              <li><Link className="hover:text-ink" to={`/yatra/${SITE.flagshipSlug}`}>Book lodging, food &amp; transit</Link></li>
              <li><Link className="hover:text-ink" to="/events">All events</Link></li>
              <li><Link className="hover:text-ink" to="/events?tab=corporate">Have an invitation code?</Link></li>
              <li><Link className="hover:text-ink" to="/passbook">My Passbook</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-ink">About</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              <li><Link className="hover:text-ink" to="/about">About CrowdGrid</Link></li>
              <li><Link className="hover:text-ink" to="/about#done">What we have done</Link></li>
              <li><Link className="hover:text-ink" to="/about#contact">Contact the owner</Link></li>
              <li><a className="hover:text-ink" href={`tel:${SITE.phone.replace(/[^\d+]/g, '')}`}>{SITE.phone}</a></li>
              <li><a className="hover:text-ink" href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
              <li><a className="hover:text-ink" href={SITE.github[0].url} target="_blank" rel="noreferrer">Source code on GitHub</a></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-ink">Help</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              <li>Emergency: <a className="font-semibold text-kumkum" href="tel:112">112</a></li>
              <li>Medical: <a className="font-semibold text-kumkum" href="tel:108">108</a></li>
              <li>Child helpline: <a className="font-semibold text-kumkum" href="tel:1098">1098</a></li>
              <li><Link className="hover:text-ink" to={`/yatra/${SITE.flagshipSlug}?tab=sos`}>SOS &amp; lost and found</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-line py-4 text-center text-sm">
          © 2026 CrowdGrid · Full Stack Development mini project
        </div>
      </footer>
    </div>
  );
}
