import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  BusFront,
  Compass,
  Gauge,
  HandHeart,
  Languages,
  QrCode,
  Siren,
  Smartphone,
  UtensilsCrossed,
  WifiOff,
} from 'lucide-react';
import { canBook, homeFor, ROLE_LABELS, useAuth } from '../lib/auth';
import API, { errorMessage } from '../lib/api';
import { InvitationCodeBox, PublicEventList, YatraCard } from '../components/EventCards';
import { DEFAULT_EVENTS } from '../data/defaultEvents';
import { isVideo, LANDING_MEDIA } from '../data/landingMedia';
import { SCENES } from '../components/landing/Scenes';
import RoleDashboards from '../components/landing/RoleDashboards';
import { openTour } from '../components/GuidedTour';
import '../styles/landing.css';

const SAFFRON = '#E36F1E';
const BLUE = '#1F3F8F';
const GREEN = '#138A43';

/** The three kinds of gathering, given equal room everywhere on the page. */
const KINDS = [
  { id: 'pilgrimage', tab: 'yatras', name: 'Pilgrimages', short: 'Pilgrimage', line: 'Melas, yatras, darshan', color: SAFFRON },
  { id: 'public', tab: 'public', name: 'Public events', short: 'Public', line: 'Concerts, fests, walks, shows', color: BLUE },
  { id: 'corporate', tab: 'corporate', name: 'Corporate & campus', short: 'Corporate', line: 'Summits, seminars, college fests', color: GREEN },
];

/** A photo or clip when one is set in landingMedia.js, otherwise the drawn scene. */
function Media({ slot }) {
  const src = LANDING_MEDIA[slot];
  const Scene = SCENES[slot];
  if (src && isVideo(src)) {
    return <video src={src} autoPlay muted loop playsInline aria-hidden="true" />;
  }
  if (src) return <img src={src} alt="" loading="eager" />;
  return Scene ? <Scene /> : null;
}

function Hero() {
  return (
    <section className="cg-shell grid items-center gap-10 pt-8 pb-4 sm:pt-12 lg:grid-cols-[1fr_1.2fr] lg:gap-14">
      <div className="cg-rise">
        <div className="cg-tricolour" aria-hidden>
          <span style={{ background: SAFFRON }} />
          <span style={{ background: '#FFFDF8', boxShadow: 'inset 0 0 0 1px #E7E1D7' }} />
          <span style={{ background: GREEN }} />
        </div>
        <h1 className="cg-h1 mt-5">Every crowd,<br />cared for.</h1>
        <p className="mt-5 max-w-md text-lg text-[#4A4F5E]">
          Pilgrimages, public shows and company events. Passes, stays, food, transport and safety, all in one place.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link to="/events" className="cg-btn cg-btn-saffron">
            Find an event <ArrowRight size={18} aria-hidden />
          </Link>
          <a href="#invite" className="cg-btn cg-btn-line">I have an invite code</a>
        </div>
        <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-[#4A4F5E]">
          <li className="flex items-center gap-1.5"><QrCode size={16} className="text-[#E36F1E]" aria-hidden /> One QR pass</li>
          <li className="flex items-center gap-1.5"><WifiOff size={16} className="text-[#1F3F8F]" aria-hidden /> Works offline</li>
          <li className="flex items-center gap-1.5"><Languages size={16} className="text-[#138A43]" aria-hidden /> English · हिन्दी · मराठी</li>
        </ul>
      </div>

      <nav aria-label="Choose a kind of event" className="cg-tri">
        {KINDS.map((k, i) => (
          <Link key={k.id} to={`/events?tab=${k.tab}`} className={`cg-panel cg-rise cg-rise-${i + 1}`} style={{ background: k.color }}>
            <Media slot={k.id} />
            <span className="cg-panel-label" style={{ background: k.color }}>
              <b className="cg-long">{k.name}</b>
              <b className="cg-short">{k.short}</b>
              <small>{k.line}</small>
            </span>
          </Link>
        ))}
      </nav>
    </section>
  );
}

/** What the platform does, with which kinds of event each part serves. */
const SERVICES = [
  { icon: QrCode, name: 'Entry passes', text: 'Tickets and passes on one QR, checked in a second.', kinds: [0, 1, 2] },
  { icon: BedDouble, name: 'Stays & tents', text: 'Pick a tent and beds on a map. Named bed for each person.', kinds: [0] },
  { icon: UtensilsCrossed, name: 'Meals', text: 'Free langar tokens or paid meal plans, with daily quotas.', kinds: [0, 2] },
  { icon: BusFront, name: 'Transport', text: 'Shuttle seats and the least crowded walking route.', kinds: [0, 1] },
  { icon: BadgeCheck, name: 'Badges & sessions', text: 'Invite codes, session check-in and printable badges.', kinds: [2] },
  { icon: HandHeart, name: 'Volunteers', text: 'Sign up for seva or crew shifts and get a staff pass.', kinds: [0, 1] },
  { icon: Gauge, name: 'Live crowd levels', text: 'Occupancy by sector, so staff act before it gets tight.', kinds: [0, 1, 2] },
  { icon: Siren, name: 'SOS & lost and found', text: 'One tap sends your location. Missing-person reports too.', kinds: [0, 1, 2], sos: true },
];

function Services() {
  return (
    <section aria-labelledby="services-title" className="cg-shell cg-section">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-xl">
          <p className="cg-kicker text-[#B4530F]">What you get</p>
          <h2 id="services-title" className="cg-h2">Everything an event needs</h2>
        </div>
        <ul className="flex flex-wrap gap-4 text-sm font-semibold text-[#4A4F5E]" aria-label="Colour key">
          {KINDS.map((k) => (
            <li key={k.id} className="flex items-center gap-2"><span className="cg-dot" style={{ background: k.color }} /> {k.name}</li>
          ))}
        </ul>
      </div>

      <ul className="cg-rows mt-8 grid gap-x-12 md:grid-cols-2">
        {SERVICES.map((s) => (
          <li key={s.name} className="flex gap-4 py-5">
            <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${s.sos ? 'bg-[#FBEAEA] text-[#C8102E]' : 'bg-[#F4F1EA] text-[#1B1E28]'}`}>
              <s.icon size={22} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-bold">{s.name}</h3>
                <span className="flex gap-1.5" aria-label={`For ${s.kinds.map((i) => KINDS[i].name).join(', ')}`}>
                  {s.kinds.map((i) => <span key={i} className="cg-dot" style={{ background: KINDS[i].color }} />)}
                </span>
              </div>
              <p className="mt-0.5 text-[#4A4F5E]">{s.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

const STEPS = [
  { title: 'Pick an event', text: 'Search by place or date, or enter your invite code.' },
  { title: 'Book for your group', text: 'Up to 5 people. Free items confirm at once; paid ones by UPI or card.' },
  { title: 'Get one QR', text: 'Everything sits in your passbook, ready without network.' },
  { title: 'Show and walk in', text: 'Staff scan it at the gate, kitchen or bus.' },
];

function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className="bg-[#FDEEDF]">
      <div className="cg-shell cg-section">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="cg-kicker text-[#B4530F]">How it works</p>
            <h2 id="how-title" className="cg-h2">Four steps, one pass</h2>
          </div>
          <button type="button" className="cg-btn cg-btn-line self-start md:self-auto" onClick={openTour}>
            <Compass size={18} aria-hidden /> Take the 1-minute tour
          </button>
        </div>
        <ol className="cg-steps relative mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <span className="absolute top-5 right-8 left-8 hidden h-0.5 bg-[#E36F1E]/35 lg:block" aria-hidden />
          {STEPS.map((s) => (
            <li key={s.title}>
              <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
              <p className="mt-1 text-[#4A4F5E]">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const EVENT_TABS = [
  { id: 'public', label: 'Public events', color: BLUE },
  { id: 'yatras', label: 'Pilgrimages', color: SAFFRON },
  { id: 'corporate', label: 'Corporate & campus', color: GREEN },
];

function Upcoming({ yatras, publicEvents }) {
  const [tab, setTab] = useState('public');
  return (
    <section aria-labelledby="upcoming-title" className="cg-shell cg-section">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="cg-kicker text-[#0D6331]">Coming up</p>
          <h2 id="upcoming-title" className="cg-h2">Where people are heading</h2>
        </div>
        <Link to={`/events?tab=${tab}`} className="font-bold text-[#1F3F8F] underline-offset-4 hover:underline">
          See all {EVENT_TABS.find((t) => t.id === tab).label.toLowerCase()} →
        </Link>
      </div>

      <div role="tablist" aria-label="Event type" className="no-scrollbar mt-6 flex gap-2 overflow-x-auto">
        {EVENT_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`ev-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls="ev-panel"
            onClick={() => setTab(t.id)}
            className="flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 font-semibold transition-colors"
            style={tab === t.id ? { background: t.color, color: '#fff' } : { background: '#fff', boxShadow: 'inset 0 0 0 1.5px #E7E1D7' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div id="ev-panel" role="tabpanel" aria-labelledby={`ev-tab-${tab}`} className="mt-6">
        {tab === 'public' && (
          <PublicEventList events={publicEvents.slice(0, 6)} emptyMessage="No public events listed right now. Check back soon." from="/" />
        )}
        {tab === 'yatras' && (
          yatras.length > 0
            ? <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{yatras.slice(0, 6).map((e) => <YatraCard key={e._id} event={e} />)}</ul>
            : <p className="text-[#4A4F5E]">No pilgrimages listed right now.</p>
        )}
        {tab === 'corporate' && (
          <p className="max-w-xl text-[#4A4F5E]">
            Company and campus events are private, so they are not listed. Your host sends a 6-digit code. Enter it below.
          </p>
        )}
      </div>
    </section>
  );
}

const ACCESS = [
  { icon: Languages, text: 'English, हिन्दी and मराठी' },
  { icon: WifiOff, text: 'Passes open without network' },
  { icon: Smartphone, text: 'Big buttons, made for phones' },
  { icon: Siren, text: 'Help is always one tap away' },
];

function ForEveryone() {
  return (
    <section aria-labelledby="access-title" className="cg-dots text-white">
      <div className="cg-shell grid gap-8 py-14 sm:py-16 lg:grid-cols-[1fr_1.4fr] lg:items-center">
        <div>
          <p className="cg-kicker text-[#FFD9B8]">Open to all</p>
          <h2 id="access-title" className="cg-h2" style={{ color: '#fff' }}>Built for every visitor</h2>
          <p className="mt-2 max-w-sm text-white/85">First-timers, elders, families and staff use the same app.</p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {ACCESS.map((a) => (
            <li key={a.text} className="flex items-center gap-3 rounded-2xl bg-[#142B66] px-4 py-4 font-semibold">
              <a.icon size={22} className="shrink-0 text-[#FFD9B8]" aria-hidden /> {a.text}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function HostCta() {
  return (
    <section aria-labelledby="host-title" className="cg-shell pb-16">
      <div className="grid overflow-hidden rounded-3xl bg-[#E5F3EA] md:grid-cols-[1.3fr_1fr]">
        <div className="p-6 sm:p-10">
          <p className="cg-kicker text-[#0D6331]">For organisers</p>
          <h2 id="host-title" className="cg-h2">Running a gathering?</h2>
          <p className="mt-3 max-w-md text-[#4A4F5E]">
            Tell us the dates and expected crowd. We set up passes, staff logins and a control room for you.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/help" className="cg-btn cg-btn-blue">Talk to us <ArrowRight size={18} aria-hidden /></Link>
            <Link to="/about" className="cg-btn cg-btn-line">About CrowdGrid</Link>
          </div>
        </div>
        <div className="relative hidden min-h-64 md:block" aria-hidden>
          {LANDING_MEDIA.together ? (
            isVideo(LANDING_MEDIA.together)
              ? <video src={LANDING_MEDIA.together} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
              : <img src={LANDING_MEDIA.together} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 grid grid-cols-3">
              {KINDS.map((k) => <div key={k.id} className="relative overflow-hidden"><Media slot={k.id} /></div>)}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const [events, setEvents] = useState(DEFAULT_EVENTS);
  const [error, setError] = useState('');

  const load = () =>
    API.get('/events')
      .then(({ data }) => {
        if (Array.isArray(data) && data.length > 0) {
          setEvents(data);
          setError('');
        }
      })
      .catch((e) => setError(errorMessage(e)));

  useEffect(() => {
    load();
  }, []);
  // The free server sleeps when idle: keep retrying until the real list arrives
  useEffect(() => {
    if (!error) return undefined;
    const t = setTimeout(load, 15000);
    return () => clearTimeout(t);
  }, [error]);

  const { yatras, publicEvents } = useMemo(() => {
    const list = Array.isArray(events) ? events : DEFAULT_EVENTS;
    return {
      yatras: list.filter((e) => e.kind === 'YATRA'),
      publicEvents: list.filter((e) => e.kind === 'PUBLIC'),
    };
  }, [events]);

  return (
    <div className="cg-home relative">
      {!canBook(user) && (
        <div className="cg-shell pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#E7EDF9] p-4">
            <p className="text-sm">Signed in as <b>{ROLE_LABELS[user.role]}</b>. Your tools are on your dashboard.</p>
            <Link to={homeFor(user.role)} className="cg-btn cg-btn-blue min-h-10 text-sm">Open my dashboard</Link>
          </div>
        </div>
      )}

      <Hero />
      <Services />
      <HowItWorks />
      <Upcoming yatras={yatras} publicEvents={publicEvents} />
      <div className="bg-[#F4F1EA]/60">
        <div className="cg-shell"><RoleDashboards /></div>
      </div>
      <ForEveryone />
      <div className="cg-shell py-14">
        <InvitationCodeBox from="/" />
      </div>
      <HostCta />
    </div>
  );
}
