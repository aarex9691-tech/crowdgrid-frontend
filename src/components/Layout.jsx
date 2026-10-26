import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Briefcase, CalendarPlus, LogOut, MapPin, Menu, MessageCircle, ScanLine, Search, ShieldCheck, ShoppingCart, Tent, Ticket, UserRound, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ROLE_LABELS, useAuth } from '../lib/auth';
import { useCart } from '../lib/cart';
import { useConfirm } from '../lib/confirm';
import { SITE } from '../lib/site';
import LiveToasts from './LiveToasts';

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
        links: [{ to: '/control', label: 'Control room', icon: ShieldCheck }, { to: '/analytics', label: 'Analytics', icon: BarChart3 }, { to: '/host', label: 'Hosted events', icon: CalendarPlus }, { to: '/corporate-admin', label: 'Campus & Corporate', icon: Briefcase }, scan],
        cta: { to: '/host', label: 'Host an event' },
      };
    case 'AUTHORITY':
      return {
        links: [{ to: '/control', label: 'Control room', icon: ShieldCheck }, { to: '/analytics', label: 'Analytics', icon: BarChart3 }, { to: '/host', label: 'Hosted events', icon: CalendarPlus }, scan],
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

const TITLES = [
  [/^\/$/, ''], [/^\/login/, 'Log in'], [/^\/register/, 'Create account'], [/^\/events/, 'Events'], [/^\/event\//, 'Event'],
  [/^\/about/, 'About'], [/^\/yatra\//, 'Yatra services'], [/^\/corporate\//, 'Campus & Corporate event'], [/^\/passbook/, 'My Passbook'],
  [/^\/account/, 'My account'], [/^\/checkout/, 'Checkout'], [/^\/scan/, 'Scanner'], [/^\/control/, 'Control room'], [/^\/analytics/, 'Analytics'],
  [/^\/corporate-admin/, 'Campus & Corporate events'], [/^\/camps\/.+\/map/, 'Tent map'], [/^\/host/, 'Hosted events'], [/^\/ngo/, 'My camps'],
];

/** New page: start at the top (or at the #section asked for) and name the browser tab. */
function useRouteChange() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    const t = TITLES.find(([re]) => re.test(pathname));
    document.title = t && t[1] ? `${t[1]} · CrowdGrid` : 'CrowdGrid · Pilgrimage & mass gathering platform';
  }, [pathname]);
  useEffect(() => {
    if (hash) {
      // Wait a moment for the page to render its sections
      const id = setTimeout(() => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
      return () => clearTimeout(id);
    }
    window.scrollTo(0, 0);
    return undefined;
  }, [pathname, hash]);
}

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
  useRouteChange();
  const [menuOpen, setMenuOpen] = useState(false);
  const confirm = useConfirm();
  const headerRef = useRef(null);
  const nav = navFor(user?.role);
  const close = () => setMenuOpen(false);
  const [navQuery, setNavQuery] = useState('');

  const handleNavSearch = (e) => {
    e.preventDefault();
    if (navQuery.trim()) {
      navigate(`/events?tab=public&q=${encodeURIComponent(navQuery.trim())}`);
      setNavQuery('');
      setMenuOpen(false);
    }
  };

  // Roles with many links switch to the full desktop bar only on wide screens,
  // so labels never squeeze onto two lines or run into each other.
  const wide = nav.links.reduce((n, l) => n + l.label.length, 0) > 36;
  const desk = wide ? 'xl' : 'lg';
  const showDesk = wide ? 'hidden xl:flex' : 'hidden lg:flex';
  const hideDesk = wide ? 'xl:hidden' : 'lg:hidden';

  // Publish the real header height so sticky bars and #anchors sit below it
  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const set = () => document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Close the mobile menu with Esc
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const doLogout = async () => {
    close();
    const ok = await confirm({
      title: 'Log out?',
      message: cart.count > 0
        ? `You have ${cart.count} item${cart.count > 1 ? 's' : ''} in your cart. Logging out empties the cart. Your booked passes stay safe in your account.`
        : 'You will need your phone number and password to log in again.',
      confirmLabel: 'Log out',
      cancelLabel: 'Stay logged in',
      icon: 'logout',
    });
    if (!ok) return;
    // Leave the private page first, so we land on Home rather than the login page
    navigate('/', { replace: true });
    setTimeout(() => {
      cart.clear();
      logout();
    }, 0);
  };

  const linkCls = ({ isActive }) =>
    `flex min-h-11 items-center gap-2 whitespace-nowrap rounded-xl px-3 font-semibold ${isActive ? 'bg-mist text-ink' : 'text-ink-soft hover:text-ink'}`;
  const menuCls = ({ isActive }) =>
    `flex min-h-12 items-center gap-3 rounded-xl px-4 text-lg font-semibold ${isActive ? 'bg-mist text-ink' : 'text-ink'}`;

  return (
    <div className="relative z-10 flex min-h-dvh flex-col bg-transparent">
      <header ref={headerRef} className="sticky top-0 z-30 border-b border-line bg-[#fbf8f3]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-2 px-4">
          <Link
            to="/"
            className="group mr-2 flex flex-none items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95"
            aria-label="CrowdGrid home"
            onClick={(e) => {
              close();
              if (window.location.pathname === '/') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          >
            <img
              src="/assets/crowdgrid-logo.jpg"
              alt="CrowdGrid Logo"
              className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl object-contain border border-amber-300/60 shadow-xs bg-[#fdfbf7]"
            />
            <span className="font-display text-xl leading-none text-ink sm:text-2xl group-hover:text-[#bd5338] transition-colors">
              CrowdGrid
            </span>
          </Link>

          {/* Clean Warm Search Pill */}
          <form
            onSubmit={handleNavSearch}
            className="hidden md:flex flex-1 max-w-sm lg:max-w-md items-center rounded-full border border-line bg-white/85 px-3 py-1.5 text-sm hover:border-ink-faint focus-within:border-[#bd5338] focus-within:bg-white shadow-xs transition-all mx-2"
          >
            <Search size={16} className="text-ink-soft shrink-0" />
            <input
              type="text"
              placeholder="Search events, yatras, stays..."
              value={navQuery}
              onChange={(e) => setNavQuery(e.target.value)}
              className="bg-transparent px-2.5 text-ink placeholder:text-ink-faint outline-none w-full text-sm"
            />
            <div className="h-4 w-px bg-line mx-1 shrink-0" />
            <span className="flex items-center gap-1 text-xs font-semibold text-ink-soft whitespace-nowrap pr-1.5 shrink-0">
              <MapPin size={13} className="text-[#bd5338]" /> Nashik
            </span>
            <button
              type="submit"
              aria-label="Search"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#bd5338] text-white hover:bg-[#a14129] shrink-0 transition"
            >
              <Search size={13} strokeWidth={2.5} />
            </button>
          </form>

          {/* Desktop navigation */}
          <nav aria-label="Main" className={`ml-auto min-w-0 items-center gap-0.5 ${showDesk}`}>
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

          <div className={`flex-none items-center gap-1 ${showDesk}`}>
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
          <Link to={nav.cta.to} className="btn-primary ml-1 hidden min-h-10 flex-none whitespace-nowrap px-4 sm:inline-flex" onClick={close}>
            {nav.cta.label}
          </Link>

          {/* Mobile menu button */}
          <button
            type="button"
            className={`ml-1 flex min-h-11 min-w-11 flex-none items-center justify-center rounded-xl text-ink ${hideDesk}`}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X size={26} aria-hidden /> : <Menu size={26} aria-hidden />}
          </button>
        </div>

        {menuOpen && (
          <nav id="mobile-menu" aria-label="Main" className={`max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-[#fbf8f3] ${hideDesk}`}>
            <div className="mx-auto w-full max-w-7xl space-y-1 px-4 py-3">
              {/* Mobile Search Bar */}
              <form onSubmit={handleNavSearch} className="mb-3 flex items-center rounded-xl border border-line bg-white px-3 py-2 text-sm focus-within:border-[#bd5338]">
                <Search size={18} className="text-ink-soft mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Search events, stays, seva..."
                  value={navQuery}
                  onChange={(e) => setNavQuery(e.target.value)}
                  className="bg-transparent text-ink placeholder:text-ink-faint outline-none w-full text-base"
                />
                <button type="submit" className="rounded-lg bg-[#bd5338] px-3.5 py-1 text-xs font-bold text-white shrink-0">
                  Search
                </button>
              </form>
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

      <LiveToasts />

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
            <Link
              to="/"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="group inline-flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95"
              aria-label="CrowdGrid home"
            >
              <img src="/assets/crowdgrid-logo.jpg" alt="CrowdGrid Logo" className="h-8 w-8 rounded-lg object-contain border border-amber-300/60 shadow-2xs bg-[#fdfbf7]" />
              <span className="font-display text-xl text-ink group-hover:text-[#bd5338] transition-colors">CrowdGrid</span>
            </Link>
            <p className="mt-2 text-sm">{SITE.tagline}. Built for the Simhastha Kumbh Mela 2027, Nashik–Trimbakeshwar.</p>
          </div>
          <div>
            <p className="font-semibold text-ink">Explore</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              <li><Link className="hover:text-ink" to={`/yatra/${SITE.flagshipSlug}`}>Book lodging, food &amp; transit</Link></li>
              <li><Link className="hover:text-ink" to="/events">All events</Link></li>
              <li><Link className="hover:text-ink" to="/events?tab=corporate">Campus &amp; corporate events</Link></li>
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
