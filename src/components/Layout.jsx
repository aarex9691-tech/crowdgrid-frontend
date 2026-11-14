import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Briefcase, CalendarPlus, Globe, HandHeart, Inbox, KeyRound, LogOut, Menu, MessageCircle, ScanLine, Search, ShieldCheck, ShoppingCart, Tent, Ticket, UserRound, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ROLE_LABELS, useAuth } from '../lib/auth';
import { useCart } from '../lib/cart';
import { useConfirm } from '../lib/confirm';
import { useCelebrate } from './SuccessSplash';
import { SITE } from '../lib/site';
import LiveToasts from './LiveToasts';
import GuidedTour, { openTour } from './GuidedTour';
import { LanguageSwitcherButton, applyBackgroundTranslation, useLang, useT } from '../lib/i18n';
import Avatar from './Avatar';

/**
 * Each role gets its own navigation. Pilgrims and visitors get the top bar (booking, passbook, cart).
 * Staff and organisation hosts get a workspace: a left sidebar grouped by task, every page listed once,
 * and nothing in the top bar but the logo and their account.
 */
const navFor = (role, t = (k) => k) => {
  const scan = { to: '/scan', label: 'Scanner', icon: ScanLine };
  const control = [
    { to: '/control', label: 'Control room', icon: ShieldCheck },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/helpdesk', label: 'Help desk', icon: KeyRound },
    scan,
  ];
  const people = [
    { to: '/requests', label: 'Requests', icon: Inbox },
    { to: '/volunteers', label: 'Volunteer duties', icon: HandHeart },
  ];
  const site = { label: 'Public site', links: [{ to: '/events', label: 'Events on CrowdGrid', icon: Globe }] };
  const about = { to: '/about', label: t('nav.about') };
  let groups;
  switch (role) {
    case 'SUPER_ADMIN':
      groups = [
        { label: 'Operations', links: control },
        { label: 'People and organisations', links: people },
        { label: 'Hosted events', links: [{ to: '/host', label: 'Public events', icon: CalendarPlus }, { to: '/corporate-admin', label: 'Campus and corporate', icon: Briefcase }] },
        site,
      ];
      break;
    case 'AUTHORITY':
      groups = [{ label: 'Operations', links: control }, { label: 'People and organisations', links: people }, site];
      break;
    case 'NGO_ADMIN':
      groups = [{ label: 'Your trust', links: [{ to: '/ngo', label: 'Camps and kitchens', icon: Tent }, scan] }, site];
      break;
    case 'EVENT_HOST':
      groups = [{ label: 'Your organisation', links: [{ to: '/host', label: 'Public events', icon: CalendarPlus }, scan] }, site];
      break;
    case 'ORG_HOST':
      groups = [{ label: 'Your organisation', links: [{ to: '/host', label: 'Public events', icon: CalendarPlus }, { to: '/corporate-admin', label: 'Campus events', icon: Briefcase }, scan] }, site];
      break;
    case 'CORPORATE_ADMIN':
      groups = [{ label: 'Your organisation', links: [{ to: '/corporate-admin', label: 'Campus and corporate', icon: Briefcase }, scan] }, site];
      break;
    case 'VOLUNTEER':
      groups = [{ label: 'Your seva', links: [{ to: '/scan', label: 'Duties and scanner', icon: ScanLine }, { to: '/passbook', label: 'My ID badge', icon: Ticket }] }, site];
      break;
    default:
      return {
        // pilgrim navigation follows the chosen language (Hindi / Marathi / English)
        links: [{ to: '/', label: t('nav.home'), end: true }, { to: '/events', label: t('nav.events') }, { to: '/passbook', label: t('nav.passbook') }, { to: '/help', label: t('nav.help') }, about],
        shopper: true,
      };
  }
  return { groups, links: groups.flatMap((g) => g.links), workspace: true };
};

/** The workspace sidebar (desktop) and the same groups in the phone menu. */
function SideNav({ groups, onPick, large = false }) {
  const cls = ({ isActive }) =>
    `relative flex items-center gap-3 rounded-xl px-3 font-semibold transition-colors ${large ? 'min-h-14 text-xl font-bold' : 'min-h-11 text-[15px]'} ${
      isActive ? 'bg-blue-wash text-blue before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full before:bg-marigold' : 'text-ink-soft hover:bg-mist hover:text-ink'
    }`;
  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="px-3 pb-1 text-sm font-semibold text-ink-faint">{g.label}</p>
          <ul className="space-y-0.5">
            {g.links.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} end={l.end} className={cls} onClick={onPick}>
                  {l.icon && <l.icon size={large ? 22 : 19} aria-hidden className="shrink-0" />} {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

const TITLES = [
  [/^\/$/, ''], [/^\/login/, 'Log in'], [/^\/register/, 'Create account'], [/^\/events/, 'Events'], [/^\/event\//, 'Event'],
  [/^\/about/, 'About us'], [/^\/help/, 'Help centre'], [/^\/yatra\//, 'Yatra services'], [/^\/corporate\//, 'Campus & Corporate event'], [/^\/passbook/, 'My Passbook'],
  [/^\/account/, 'My account'], [/^\/checkout/, 'Checkout'], [/^\/scan/, 'Scanner'], [/^\/control/, 'Control room'], [/^\/analytics/, 'Analytics'],
  [/^\/corporate-admin/, 'Campus & Corporate events'], [/^\/camps\/.+\/map/, 'Tent map'], [/^\/host-with-us/, 'Host with CrowdGrid'], [/^\/host-requests/, 'Requests'], [/^\/requests/, 'Requests'], [/^\/register-organisation/, 'Register your organisation'], [/^\/volunteers/, 'Volunteer duties'], [/^\/host/, 'Public events'], [/^\/ngo/, 'My camps'], [/^\/helpdesk/, 'Help desk'], [/^\/set-password/, 'Set password'],
];

/** New page: start at the top (or at the #section asked for) and name the browser tab. */
function useRouteChange(lang) {
  const { pathname, hash } = useLocation();
  const firstRoute = useRef(true);
  useEffect(() => {
    const t = TITLES.find(([re]) => re.test(pathname));
    let title = t && t[1] ? `${t[1]} · CrowdGrid` : 'CrowdGrid · Every crowd, cared for';
    if (lang === 'hi') {
      const hiMap = {
        'Log in': 'लॉग इन',
        'Create account': 'खाता बनाएँ',
        'Events': 'कार्यक्रम',
        'Event': 'कार्यक्रम',
        'About us': 'हमारे बारे में',
        'Help centre': 'सहायता केंद्र',
        'Yatra services': 'यात्रा सेवाएँ',
        'Campus & Corporate event': 'कैंपस और कॉर्पोरेट कार्यक्रम',
        'My Passbook': 'मेरी पासबुक',
        'My account': 'मेरा खाता',
        'Checkout': 'चेकआउट',
        'Scanner': 'स्कैनर',
        'Control room': 'नियंत्रण कक्ष',
        'Analytics': 'विश्लेषण',
        'Campus & Corporate events': 'कैंपस और कॉर्पोरेट कार्यक्रम',
        'Tent map': 'टेंट नक्शा',
        'Hosted events': 'आयोजित कार्यक्रम',
        'My camps': 'मेरे शिविर',
      };
      if (t && t[1] && hiMap[t[1]]) {
        title = `${hiMap[t[1]]} · CrowdGrid`;
      } else if (!t || !t[1]) {
        title = 'CrowdGrid · हर भीड़ की देखभाल';
      }
    }
    document.title = title;
  }, [pathname, lang]);
  useEffect(() => {
    if (hash) {
      const id = setTimeout(() => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
      return () => clearTimeout(id);
    }
    window.scrollTo(0, 0);
    // Move keyboard and screen-reader focus to the new page instead of leaving it on the old link
    // (not on the first load, so the skip link and the menu stay first in the tab order)
    if (firstRoute.current) firstRoute.current = false;
    else document.getElementById('main')?.focus({ preventScroll: true });
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
  const { lang } = useLang();
  useRouteChange(lang);
  const [menuOpen, setMenuOpen] = useState(false);
  const confirm = useConfirm();
  const celebrate = useCelebrate();
  const headerRef = useRef(null);
  const t = useT();
  const nav = navFor(user?.role, t);
  const close = () => setMenuOpen(false);
  const [navQuery, setNavQuery] = useState('');
  const { pathname } = useLocation();

  useEffect(() => {
    applyBackgroundTranslation(lang);
  }, [pathname, lang]);

  const handleNavSearch = (e) => {
    e.preventDefault();
    if (navQuery.trim()) {
      navigate(`/events?q=${encodeURIComponent(navQuery.trim())}`);
      setNavQuery('');
      setMenuOpen(false);
    }
  };

  // Staff and hosts work from the sidebar; the top bar keeps only the logo and the account
  const workspace = Boolean(nav.workspace);
  // Roles with many links switch to the full desktop bar only on wide screens,
  // so labels never squeeze onto two lines or run into each other.
  const wide = !workspace && nav.links.reduce((n, l) => n + l.label.length, 0) > 36;
  const desk = wide ? 'xl' : 'lg';
  const showDesk = wide ? 'hidden xl:flex' : 'hidden lg:flex';
  // The event search pill is for visitors and pilgrims; staff bars have too many links to fit it
  const showSearch = !user || user.role === 'USER';
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
    celebrate({
      tone: 'leave',
      title: 'Logged out',
      line: 'See you soon.',
      then: () => {
        // Leave the private page first, so we land on Home rather than the login page
        navigate('/', { replace: true });
        setTimeout(() => {
          cart.clear();
          logout();
        }, 0);
      },
    });
  };

  const linkCls = ({ isActive }) =>
    `flex h-16 items-center gap-2 whitespace-nowrap border-y-[3px] border-t-transparent ${wide ? 'px-2.5 text-base' : 'px-3.5 text-[1.125rem]'} font-semibold tracking-tight transition-colors ${isActive ? 'border-b-marigold text-ink font-bold' : 'border-b-transparent text-ink-soft hover:text-ink'}`;
  const menuCls = ({ isActive }) =>
    `flex min-h-14 items-center gap-3.5 rounded-xl px-4 text-xl font-bold ${isActive ? 'bg-blue-wash text-blue' : 'text-ink'}`;

  return (
    <div className="relative z-10 flex min-h-dvh flex-col">
      {/* First Tab stop: jump past the header straight to the page */}
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-blue focus:px-4 focus:py-3 focus:font-bold focus:text-white">
        Skip to main content
      </a>
      <header ref={headerRef} className="sticky top-0 z-30 border-b border-line bg-white">
        <div className="toran" aria-hidden />
        <div className={`mx-auto flex h-16 w-full items-center gap-2 px-4 sm:px-6 ${workspace ? '' : 'max-w-[var(--page-max)]'}`}>
          <Link
            to="/"
            className={`group mr-2 flex min-h-11 flex-none items-center gap-2.5 ${showSearch ? '' : desk === 'xl' ? 'xl:mr-4' : 'lg:mr-4'}`}
            aria-label="CrowdGrid home"
            onClick={() => {
              close();
              if (window.location.pathname === '/') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          >
            <img
              src="/assets/crowdgrid-logo.jpg"
              alt=""
              className="h-10 w-10 rounded-xl border border-line bg-white object-contain"
            />
            <span className="font-display text-2xl leading-none text-ink transition-colors group-hover:text-blue">
              CrowdGrid
            </span>
          </Link>

          {/* Event search */}
          {showSearch && <form
            onSubmit={handleNavSearch}
            className="hidden xl:flex flex-1 max-w-sm items-center rounded-full border border-line bg-mist py-1 pr-1 pl-3.5 text-sm transition-[border-color,background-color] focus-within:border-blue focus-within:bg-white"
          >
            <Search size={16} className="text-ink-soft shrink-0" />
            <input
              type="text"
              placeholder={t("nav.searchPlaceholder")}
              value={navQuery}
              onChange={(e) => setNavQuery(e.target.value)}
              aria-label="Search events"
              className="h-9 w-full bg-transparent px-2.5 text-sm text-ink outline-none placeholder:text-ink-soft"
            />
            <button
              type="submit"
              aria-label="Search"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue text-white hover:bg-blue-deep"
            >
              <Search size={13} strokeWidth={2.5} />
            </button>
          </form>}

          {/* Desktop navigation (staff and hosts: in the sidebar instead) */}
          {workspace ? (
            // the organisation an account works for (its role is shown next to the name on the right)
            user.organisationName ? (
              <span className="ml-1 hidden min-w-0 truncate text-[15px] font-semibold text-ink-soft lg:block" translate="no">{user.organisationName}</span>
            ) : null
          ) : <nav aria-label="Main" className={`ml-auto min-w-0 items-center gap-0.5 ${showDesk}`}>
            {nav.links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkCls}>
                {/* Staff bars are long (the header is capped at 1280px), so they show text only */}
                {l.icon && <l.icon size={18} aria-hidden className={wide ? 'hidden' : ''} />} {l.label}
              </NavLink>
            ))}
          </nav>}

          {/* On phones, push the cart and menu button to the right edge */}
          <span className={`flex-1 ${hideDesk}`} aria-hidden />
          {nav.shopper && cart.count > 0 && (
            <NavLink to="/checkout" className={linkCls} aria-label={`Cart, ${cart.count} item${cart.count > 1 ? 's' : ''}`} onClick={close}>
              <span className="relative">
                <ShoppingCart size={20} aria-hidden />
                <span className="absolute -right-2 -top-2 rounded-full bg-kumkum px-1.5 text-xs font-bold text-white">{cart.count}</span>
              </span>
            </NavLink>
          )}

          <div className={`flex-none items-center gap-2 ${showDesk} ${workspace ? 'ml-auto' : ''}`}>
            {user ? (
              <>
                <NavLink to="/account" className={linkCls} title={ROLE_LABELS[user.role]}>
                  {user.photoUrl ? <Avatar name={user.name} photoUrl={user.photoUrl} size={28} /> : <UserRound size={18} aria-hidden />}
                  <span translate="no" className={`truncate ${workspace ? 'max-w-64' : 'max-w-28'} ${wide ? 'sr-only' : ''}`}>{workspace ? user.name : user.name.split(' ')[0]}</span>
                  {workspace && <span className="pill-quiet">{ROLE_LABELS[user.role]}</span>}
                </NavLink>
                <button type="button" className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-ink-soft hover:bg-mist hover:text-ink" onClick={doLogout} aria-label="Log out" title="Log out">
                  <LogOut size={20} aria-hidden />
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-ghost min-h-11 px-4">{t('nav.login')}</Link>
            )}
          </div>

          {/* Language switcher in the corner. Phones have it inside the menu instead,
              so the logo, the switcher and the menu button never crowd past 360px */}
          {(!user || user.role === 'USER') && (
            <div className="ml-2 hidden flex-none items-center sm:flex">
              <LanguageSwitcherButton />
            </div>
          )}

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
          <nav id="mobile-menu" aria-label="Main" className={`cg-menu max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-white ${hideDesk}`}>
            <div className="mx-auto w-full max-w-[var(--page-max)] space-y-1 px-4 py-3 sm:px-6">
              {/* Mobile Search Bar */}
              {showSearch && <form onSubmit={handleNavSearch} className="mb-3 flex items-center rounded-xl border-[1.5px] border-edge bg-white py-1.5 pr-1.5 pl-3 text-sm focus-within:border-blue">
                <Search size={18} className="text-ink-soft mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder={t("nav.searchPlaceholder")}
                  aria-label="Search events"
                  value={navQuery}
                  onChange={(e) => setNavQuery(e.target.value)}
                  className="bg-transparent text-ink placeholder:text-ink-faint outline-none w-full text-base"
                />
                <button type="submit" className="flex min-h-11 shrink-0 items-center rounded-lg bg-blue px-3.5 text-sm font-bold text-white">{t("nav.search")}</button>
              </form>}
              {workspace ? (
                <SideNav groups={nav.groups} onPick={close} large />
              ) : (
                nav.links.map((l) => (
                  <NavLink key={l.to} to={l.to} end={l.end} className={menuCls} onClick={close}>
                    {l.icon && <l.icon size={20} aria-hidden />} {l.label}
                  </NavLink>
                ))
              )}
              <div className="my-2 border-t border-line" />
              {user ? (
                <>
                  <NavLink to="/account" className={menuCls} onClick={close}>
                    {user.photoUrl ? <Avatar name={user.name} photoUrl={user.photoUrl} size={28} /> : <UserRound size={20} aria-hidden />} <span translate="no">{user.name}</span> <span className="pill-quiet">{ROLE_LABELS[user.role]}</span>
                  </NavLink>
                  <button type="button" className="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-lg font-semibold text-ink" onClick={doLogout}>
                    <LogOut size={20} aria-hidden /> Log out
                  </button>
                </>
              ) : (
                <NavLink to="/login" className={menuCls} onClick={close}>Log in or create account</NavLink>
              )}
              {(!user || user.role === 'USER') && (
                <div className="pt-2">
                  <LanguageSwitcherButton className="w-full justify-center" />
                </div>
              )}
            </div>
          </nav>
        )}

        {!online && (
          <p className="bg-navy py-1.5 text-center text-sm text-white" role="status">
            You're offline. Your saved passes still work in the passbook.
          </p>
        )}
      </header>

      <LiveToasts />
      {/* first-visit tour: home page, pilgrims and visitors only */}
      <GuidedTour auto={pathname === '/' && (!user || user.role === 'USER')} />

      <div className={`flex-1 ${workspace ? 'lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]' : 'flex flex-col'}`}>
        {workspace && (
          <aside className="cg-sidebar hidden border-r border-line bg-white/85 lg:block">
            <nav aria-label="Main" className="sticky top-[var(--header-h,4.25rem)] max-h-[calc(100dvh-var(--header-h,4.25rem))] overflow-y-auto px-3 py-6">
              <SideNav groups={nav.groups} />
            </nav>
          </aside>
        )}
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 pb-16 focus:outline-none">
          {user?.mustChangePassword && pathname !== '/set-password' ? <Navigate to="/set-password" replace state={{ from: pathname }} /> : (
            // keyed by path, so each page change plays the short entrance (see .cg-page)
            <div key={pathname} className="cg-page"><Outlet /></div>
          )}
        </main>
      </div>

      <a
        href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent('Hi, I need help with CrowdGrid.')}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with us on WhatsApp"
        title="Chat with us on WhatsApp"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#128C7E] text-white shadow-lg shadow-black/20 hover:brightness-105"
      >
        <MessageCircle size={28} aria-hidden />
      </a>

      <footer className="cg-foot bg-navy text-blue-mist">
        <div className="shell grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link
              to="/"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex min-h-11 items-center gap-2.5"
              aria-label="CrowdGrid home"
            >
              <img src="/assets/crowdgrid-logo.jpg" alt="" className="h-9 w-9 rounded-lg bg-white object-contain" />
              <span className="font-display text-2xl text-white">CrowdGrid</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm">
              {SITE.tagline}. Passes, stays, food, transport and SOS for pilgrimages, public events and company gatherings.
            </p>
            <div className="toran mt-5 w-24 rounded-full" aria-hidden />
          </div>
          <div>
            <p className="font-semibold text-white">Explore</p>
            <ul className="mt-2 text-sm">
              <li><Link className="hover:text-white" to="/events">All events</Link></li>
              <li><Link className="hover:text-white" to={`/yatra/${SITE.flagshipSlug}`}>Book lodging, food &amp; transport</Link></li>
              <li><Link className="hover:text-white" to="/events?tab=corporate">Campus &amp; corporate events</Link></li>
              <li><Link className="hover:text-white" to="/passbook">My Passbook</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white">About us</p>
            <ul className="mt-2 text-sm">
              <li><Link className="hover:text-white" to="/about">About CrowdGrid</Link></li>
              <li><Link className="hover:text-white" to="/register-organisation">Register your organisation</Link></li>
              <li><Link className="hover:text-white" to="/host-with-us">Host your events with us</Link></li>
              <li><Link className="hover:text-white" to="/about#contact">Contact customer care</Link></li>
              <li><a className="hover:text-white" href={`tel:${SITE.phone.replace(/[^\d+]/g, '')}`}>{SITE.phone}</a></li>
              <li><a className="hover:text-white" href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white">Help</p>
            <ul className="mt-2 text-sm">
              <li><Link className="hover:text-white" to="/help">Help centre &amp; FAQs</Link></li>
              <li><button type="button" className="hover:text-white" onClick={openTour}>Take the tour</button></li>
              <li><Link className="hover:text-white" to={`/yatra/${SITE.flagshipSlug}?tab=sos`}>SOS &amp; lost and found</Link></li>
              <li>Emergency <a className="font-bold text-white underline" href="tel:112">112</a></li>
              <li>Medical <a className="font-bold text-white underline" href="tel:108">108</a></li>
              <li>Child helpline <a className="font-bold text-white underline" href="tel:1098">1098</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/15 py-4 text-center text-sm">
          © 2026 CrowdGrid, a capstone project
        </div>
      </footer>
    </div>
  );
}
