import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BedDouble, Briefcase, BusFront, CalendarCheck, CreditCard, HandHeart, MapPin, QrCode, ScanLine, Siren, Ticket, UtensilsCrossed, Users } from 'lucide-react';
import { SITE } from '../lib/site';
import { canBook, homeFor, ROLE_LABELS, useAuth } from '../lib/auth';
import HeroSearch from '../components/HeroSearch';
import API, { errorMessage } from '../lib/api';
import { compactNumber, fmtDate } from '../lib/format';
import Notice, { Loading } from '../components/Notice';
import { InvitationCodeBox, PublicEventList, YatraCard } from '../components/EventCards';

function useCountdown(target) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = Math.max(0, new Date(target).getTime() - now);
  return {
    done: ms === 0,
    days: Math.floor(ms / 86400000),
    hours: Math.floor((ms / 3600000) % 24),
    minutes: Math.floor((ms / 60000) % 60),
    seconds: Math.floor((ms / 1000) % 60),
  };
}

const SERVICES = [
  { tab: 'lodging', label: 'Lodging', icon: BedDouble },
  { tab: 'food', label: 'Food tokens', icon: UtensilsCrossed },
  { tab: 'transit', label: 'Transit', icon: BusFront },
  { tab: 'seva', label: 'Volunteering', icon: HandHeart },
  { tab: 'sos', label: 'Emergency SOS', icon: Siren },
];

function Hero({ event, withSearch = false }) {
  const c = useCountdown(event.startDate);
  const nextDates = (event.keyDates || []).slice(0, 3);
  return (
    <section className="overflow-hidden rounded-3xl bg-ink text-white" aria-labelledby="hero-title">
      <div className="toran" aria-hidden />
      <div className="grid gap-8 p-6 sm:p-10 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="text-lg text-[#c9d6ee]">{event.tagline}</p>
          <h1 id="hero-title" className="mt-1 font-display text-4xl leading-tight sm:text-5xl">
            {event.title}
          </h1>
          <p className="mt-3 max-w-prose text-[#c9d6ee]">{event.description}</p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-[#e6ecf7]">
            <span className="flex items-center gap-1.5">
              <Users size={18} aria-hidden /> {compactNumber(event.expectedFootfall || 0)} pilgrims expected
            </span>
            {event.stats && (
              <span className="flex items-center gap-1.5">
                <MapPin size={18} aria-hidden /> {event.stats.verifiedProviders} verified seva groups
              </span>
            )}
          </div>
          <Link to={`/yatra/${event.slug}`} className="btn-primary mt-7 px-7 text-lg">
            Enter Yatra Portal
          </Link>
        </div>

        <div className="flex flex-col justify-between gap-6">
          <div>
            <p className="text-[#c9d6ee]">{c.done ? 'The mela has begun' : 'Dhwajarohan in'}</p>
            {!c.done && (
              <div className="mt-1 flex items-end gap-4" aria-live="off">
                <span className="text-7xl font-extrabold leading-none tabular-nums text-marigold sm:text-8xl">{c.days}</span>
                <span className="pb-2 text-xl font-semibold">days</span>
                <span className="pb-2 text-xl tabular-nums text-[#c9d6ee]">
                  {String(c.hours).padStart(2, '0')}:{String(c.minutes).padStart(2, '0')}:{String(c.seconds).padStart(2, '0')}
                </span>
              </div>
            )}
            <p className="mt-1 text-sm text-[#c9d6ee]">{fmtDate(event.startDate)}</p>
          </div>
          {nextDates.length > 0 && (
            <ol className="space-y-2 border-l-2 border-marigold/60 pl-4">
              {nextDates.map((k) => (
                <li key={k.label}>
                  <span className="font-semibold">{k.label}</span>
                  <span className="block text-sm text-[#c9d6ee]">{fmtDate(k.date)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {withSearch && <div className="h-10" aria-hidden />}
      {!withSearch && (
        <nav aria-label="Services" className="grid grid-cols-2 border-t border-white/10 sm:grid-cols-5">
          {SERVICES.map((s) => (
            <Link
              key={s.tab}
              to={`/yatra/${event.slug}?tab=${s.tab}`}
              className={`flex min-h-14 items-center gap-2 border-white/10 px-5 py-3 font-semibold hover:bg-white/5 sm:justify-center sm:border-l first:sm:border-l-0 ${
                s.tab === 'sos' ? 'text-[#ff8a9a]' : ''
              }`}
            >
              <s.icon size={20} aria-hidden /> {s.label}
            </Link>
          ))}
        </nav>
      )}
    </section>
  );
}

const STEPS = [
  { icon: CalendarCheck, title: 'Choose', text: 'A camp, a meal, a bus or a seva slot' },
  { icon: CreditCard, title: 'Book or pay', text: 'Free seva is confirmed instantly; camps pay at checkout' },
  { icon: QrCode, title: 'Keep your QR', text: 'Saved to your passbook and works offline' },
  { icon: ScanLine, title: 'Scan at the gate', text: 'Volunteers and camp managers verify in half a second' },
];

function HowItWorks() {
  return (
    <section aria-labelledby="hiw" className="panel p-6 sm:p-8">
      <h2 id="hiw" className="text-center font-display text-2xl sm:text-3xl">How CrowdGrid works</h2>
      <p className="mt-1 text-center text-ink-soft">Verified camps, kitchens and transit for pilgrims and organizers</p>
      <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex flex-col items-center rounded-2xl bg-mist p-5 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-white">
              <s.icon size={22} aria-hidden />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-ink-faint">Step {i + 1}</p>
            <h3 className="mt-1 text-lg font-bold">{s.title}</h3>
            <p className="mt-1 text-sm text-ink-soft">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

const flag = `/yatra/${SITE.flagshipSlug}`;
const TILES = [
  { to: `${flag}?tab=lodging`, icon: BedDouble, title: 'Stays & Tents', text: 'Verified camps, dharamshalas and family tents with your tent and bed number.', tint: '#16234a' },
  { to: `${flag}?tab=food`, icon: UtensilsCrossed, title: 'Annadanam', text: "Today's menu at every kitchen and one token for the whole family.", tint: '#3a1a08' },
  { to: `${flag}?tab=transit`, icon: BusFront, title: 'Shuttles & Buses', text: 'E-rickshaws and feeder buses with stops, water points and a day pass.', tint: '#0b2e22' },
  { to: `${flag}?tab=seva`, icon: HandHeart, title: 'Seva & Volunteering', text: 'Serve with a verified trust and get your volunteer ID badge.', tint: '#2a1238' },
  { to: '/events?tab=public', icon: Ticket, title: 'Public Events', text: 'Aartis, heritage walks and bhajan evenings. Register, pay and get your entry pass.', tint: '#0f2b3a' },
  { to: '/events?tab=corporate', icon: Briefcase, title: 'Campus & Corporate', text: 'Invite-only seminars, college fests and company summits with access codes and digital badges.', tint: '#3a1410' },
  { to: `${flag}?tab=sos`, icon: Siren, title: 'SOS & Lost and Found', text: 'One-tap emergency alert and help to find family members.', tint: '#3b0c16' },
  { to: '/passbook', icon: QrCode, title: 'My Passbook', text: 'All your passes in one QR, even without network at the ghats.', tint: '#1f2a12' },
];

function PlanTiles() {
  return (
    <section aria-labelledby="plan" className="rounded-3xl bg-[#0e1426] p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2 px-2 text-white">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-marigold">Plan your yatra</p>
          <h2 id="plan" className="text-2xl font-bold sm:text-3xl">Everything for the mela, in one place</h2>
        </div>
      </div>
      <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-4">
        {TILES.map((t, i) => (
          <li key={t.title}>
            <Link
              to={t.to}
              className="group relative flex h-full min-h-56 flex-col justify-end overflow-hidden rounded-xl p-5 text-white outline-offset-2 transition hover:brightness-125"
              style={{ background: `linear-gradient(180deg, ${t.tint} 0%, #0b0f1c 100%)` }}
            >
              <t.icon aria-hidden className="absolute right-4 top-6 h-24 w-24 text-white/10 transition group-hover:text-white/20" strokeWidth={1.2} />
              <span className="mb-2 w-fit rounded-md bg-marigold px-2 text-xs font-bold tracking-widest text-ink">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-xl font-bold leading-tight">{t.title}</span>
              <span className="mt-1 text-[15px] leading-snug text-[#c9d1e3]">{t.text}</span>
              <span className="mt-3 flex items-center gap-1 text-sm font-semibold text-marigold opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                Open <ArrowRight size={16} aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FloatingCta() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 520);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!show) return null;
  return (
    <Link
      to={flag}
      className="fixed bottom-5 left-4 z-40 flex items-center gap-2 rounded-full sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 bg-gradient-to-r from-marigold to-[#ff7a1a] px-6 py-3 font-bold text-ink shadow-lg shadow-black/20 hover:brightness-105"
    >
      <CalendarCheck size={20} aria-hidden /> Plan your yatra
    </Link>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const [events, setEvents] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    API.get('/events')
      .then(({ data }) => {
        if (Array.isArray(data)) {
          setEvents(data);
        } else {
          setError('Backend returned non-array data. Please check VITE_API_URL.');
        }
      })
      .catch((e) => setError(errorMessage(e)));
  };

  useEffect(() => {
    load();
  }, []);

  const groups = useMemo(() => {
    const list = Array.isArray(events) ? events : [];
    return {
      flagship: list.find((e) => e.kind === 'YATRA' && e.isFlagship),
      yatras: list.filter((e) => e.kind === 'YATRA' && !e.isFlagship),
      publicEvents: list.filter((e) => e.kind === 'PUBLIC'),
    };
  }, [events]);

  if (error) return <div className="shell py-10"><Notice tone="error">{error}</Notice></div>;
  if (!events) return <Loading label="Loading yatras" />;

  return (
    <div className="shell space-y-12 py-6">
      {!canBook(user) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-marigold bg-marigold-wash p-4">
          <p>
            Signed in as <b>{ROLE_LABELS[user.role]}</b>. Staff accounts manage the mela; booking is for pilgrims.
          </p>
          <Link to={homeFor(user.role)} className="btn-ink min-h-10 px-4">Open my dashboard</Link>
        </div>
      )}
      {groups.flagship && (
        <div>
          <Hero event={groups.flagship} withSearch={canBook(user)} />
          {canBook(user) && <HeroSearch event={groups.flagship} />}
        </div>
      )}

      <HowItWorks />

      {groups.yatras.length > 0 && (
        <section aria-labelledby="yatras">
          <div className="flex items-end justify-between gap-3">
            <h2 id="yatras" className="text-2xl font-bold">More yatras</h2>
            <Link to="/events?tab=yatras" className="font-semibold underline">All events</Link>
          </div>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {groups.yatras.map((e) => <YatraCard key={e._id} event={e} />)}
          </ul>
        </section>
      )}

      {groups.publicEvents.length > 0 && (
        <section aria-labelledby="public">
          <h2 id="public" className="text-2xl font-bold">Public events near the mela</h2>
          <p className="text-ink-soft">Open to everyone. Register, pay at checkout and get your entry pass.</p>
          <PublicEventList events={groups.publicEvents} onChange={load} from="/" />
        </section>
      )}

      <InvitationCodeBox from="/" />

      <PlanTiles />
      {canBook(user) && <FloatingCta />}
    </div>
  );
}
