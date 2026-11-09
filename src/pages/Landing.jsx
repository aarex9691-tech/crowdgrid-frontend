import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BedDouble,
  BusFront,
  CalendarCheck,
  Compass,
  CreditCard,
  LifeBuoy,
  HandHeart,
  MapPin,
  QrCode,
  ScanLine,
  Siren,
  Ticket,
  UtensilsCrossed,
} from 'lucide-react';
import { SITE } from '../lib/site';
import { canBook, homeFor, ROLE_LABELS, useAuth } from '../lib/auth';
import HeroSearch from '../components/HeroSearch';
import API, { errorMessage } from '../lib/api';
import { addDaysIST, todayIST } from '../lib/format';
import { InvitationCodeBox, PublicEventList } from '../components/EventCards';
import { DEFAULT_EVENTS } from '../data/defaultEvents';
import NamasteIntro from '../components/NamasteIntro';
import YatraChooser from '../components/YatraChooser';
import { openTour } from '../components/GuidedTour';
import { GrandSacredDiya } from '../components/FestiveDecorations';

function FullWidthGarland() {
  return (
    <div className="w-full overflow-hidden pointer-events-none select-none -mb-5 sm:-mb-7 z-20 relative" aria-hidden="true">
      <svg className="w-full h-12 sm:h-16" viewBox="0 0 1600 64" preserveAspectRatio="none">
        {/* Festive Swag Strings across 1600 width */}
        <path d="M0,8 Q100,56 200,8 Q300,56 400,8 Q500,56 600,8 Q700,56 800,8 Q900,56 1000,8 Q1100,56 1200,8 Q1300,56 1400,8 Q1500,56 1600,8" fill="none" stroke="#d97706" strokeWidth="2.5" />
        <path d="M0,12 Q100,60 200,12 Q300,60 400,12 Q500,60 600,12 Q700,60 800,12 Q900,60 1000,12 Q1100,60 1200,12 Q1300,60 1400,12 Q1500,60 1600,12" fill="none" stroke="#b45309" strokeWidth="1.5" strokeDasharray="3 3" />

        {/* Mango Leaves at each peak */}
        {[0, 200, 400, 600, 800, 1000, 1200, 1400, 1600].map((x, i) => (
          <g key={`leaf-${i}`} transform={`translate(${x - 8}, 6)`}>
            <path d="M8,0 C2,14 0,28 8,38 C16,28 14,14 8,0 Z" fill="#1b5e20" stroke="#0d3d12" strokeWidth="1" />
            <path d="M8,4 L8,34" stroke="#2e7d32" strokeWidth="1" />
          </g>
        ))}

        {/* Marigold Flowers along the swags */}
        {Array.from({ length: 49 }).map((_, i) => {
          const x = (i * 1600) / 48;
          const phase = (x % 200) / 200;
          const y = 8 + 44 * Math.sin(phase * Math.PI);
          return (
            <g key={`flower-${i}`} transform={`translate(${x}, ${y})`}>
              <circle cx="0" cy="0" r="7.5" fill="#f59e0b" />
              <circle cx="0" cy="0" r="5.5" fill="#fbbf24" />
              <circle cx="0" cy="0" r="3.5" fill="#f97316" />
              <circle cx="0" cy="0" r="1.5" fill="#c2410c" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Traditional Jharokha Window Service Alcoves:
 * Shaped like ornate temple windows (cusped arch tops) on a warm Bandhani-sandstone background.
 */
function JharokhaConcourse({ flagshipSlug }) {
  const base = flagshipSlug ? `/yatra/${flagshipSlug}` : '/events';

  const services = [
    {
      to: `${base}?tab=lodging`,
      icon: BedDouble,
      hindi: 'आवास एवं तंबू',
      title: 'Stays & tents',
      desc: 'Verified dharamshalas, family tents & clean bedding with confirmed bed number.',
      pill: 'Verified stays',
      highlight: false,
    },
    {
      to: `${base}?tab=food`,
      icon: UtensilsCrossed,
      hindi: 'अन्नदानम्',
      title: 'Annadanam & prasad',
      desc: 'Daily kitchen timings and family meal tokens for registered pilgrims.',
      pill: 'Free prasad',
      highlight: false,
    },
    {
      to: `${base}?tab=transit`,
      icon: BusFront,
      hindi: 'घाट शटल सेवा',
      title: 'Transport to the ghats',
      desc: 'Feeder buses and e-rickshaws to the bathing ghats, plus the safest walking route.',
      pill: 'Transport',
      highlight: false,
    },
    {
      to: `${base}?tab=seva`,
      icon: HandHeart,
      hindi: 'सेवा एवं स्वयंसेवक',
      title: 'Seva & volunteering',
      desc: 'Serve with registered ashrams & trusts and receive your official volunteer pass.',
      pill: 'Volunteer ID',
      highlight: false,
    },
    {
      to: '/events?tab=public',
      icon: Ticket,
      hindi: 'आरती एवं दर्शन',
      title: 'Aartis & passes',
      desc: 'Maha Aartis, heritage walks, and bhajan evenings with digital entry passes.',
      pill: 'Entry passes',
      highlight: false,
    },
    {
      to: `${base}?tab=sos`,
      icon: Siren,
      hindi: 'आपातकालीन सहायता',
      title: 'Emergency SOS',
      desc: 'One-tap SOS with your location, emergency helplines, and lost and found for families.',
      pill: '24/7 helpline',
      highlight: true,
    },
  ];

  return (
    <section aria-labelledby="concourse-title" className="space-y-6 pt-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b-2 border-[#c99436]/40 pb-4">
        <div>
          <span className="font-display text-sm font-bold tracking-widest text-[#832014]">
            ॥ तीर्थ यात्री सेवा ॥
          </span>
          <h2 id="concourse-title" className="font-display text-2xl sm:text-4xl font-extrabold text-ink">
            Pilgrim services
          </h2>
        </div>
        <p className="text-base text-ink-soft max-w-sm">
          Everything you need for the yatra. Choose a service to book or get help.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <Link
            key={s.title}
            to={s.to}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-t-[3.5rem] rounded-b-2xl border-2 p-6 transition-all hover:-translate-y-1 hover:shadow-lg ${
              s.highlight
                ? 'border-kumkum bg-gradient-to-b from-[#fff5f5] to-[#fdebeb]'
                : 'border-[#c99436]/60 bg-gradient-to-b from-[#fdfbf7] to-[#f7ede0] hover:border-[#832014]'
            }`}
          >
            {/* Top Arch Finial Icon */}
            <div className="flex flex-col items-center text-center">
              <span className="font-display text-xs font-bold text-[#832014] tracking-widest mb-2">
                {s.hindi}
              </span>

              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm mb-3 transition-transform group-hover:scale-110 ${
                  s.highlight
                    ? 'bg-kumkum text-white'
                    : 'bg-[#832014] text-[#fff4d6] border border-amber-300'
                }`}
              >
                <s.icon size={26} strokeWidth={1.8} />
              </div>

              <h3 className="font-display text-xl font-bold text-ink group-hover:text-[#832014] transition-colors">
                {s.title}
              </h3>
              <span className="mt-1 inline-block rounded-full bg-white/80 border border-line px-3 py-0.5 text-xs font-bold text-ink-soft">
                {s.pill}
              </span>
              <p className="mt-2 text-sm sm:text-base text-ink-soft leading-relaxed">
                {s.desc}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-1.5 text-sm font-bold text-[#832014] group-hover:underline pt-3 border-t border-line/60">
              <span>{s.highlight ? 'Get help now' : `Open ${s.title.toLowerCase()}`}</span> <ArrowRight size={14} aria-hidden />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/**
 * Traditional Location Tag & Filter Chips:
 */
function BrowsingFilterBar({ selectedFilter, onSelectFilter, place }) {
  const chips = ['All', 'Free Entry', 'Today & Weekend', 'Aartis & Rituals', 'Flagship Mela'];

  return (
    <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between border-b-2 border-[#c99436]/40 pb-5 pt-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-ink-soft">Showing</span>
        <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#c99436] bg-[#fbf5ec] px-4 py-1.5 text-sm font-bold text-ink shadow-2xs">
          <MapPin size={14} className="text-[#832014] shrink-0" aria-hidden />
          <span>{place}</span>
        </span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {chips.map((chip) => {
          const active = selectedFilter === chip;
          return (
            <button
              key={chip}
              type="button"
              onClick={() => onSelectFilter(chip)}
              aria-pressed={active}
              className={`min-h-10 rounded-full px-4 py-1.5 text-sm font-bold whitespace-nowrap transition-all ${
                active
                  ? 'bg-[#832014] text-[#fff4d6] shadow-sm border border-amber-300 scale-105'
                  : 'border border-[#d0c0ad] bg-white text-ink-soft hover:border-[#832014] hover:text-ink'
              }`}
            >
              {chip}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const STEPS = [
  { icon: CalendarCheck, title: '1. Choose a service', text: 'Pick a camp, a free meal token, a bus or a seva slot. Book for up to 5 people.' },
  { icon: CreditCard, title: '2. Get it confirmed', text: 'Free services are confirmed at once. Paid stays, buses and events are paid by UPI or card.' },
  { icon: QrCode, title: '3. One QR in your passbook', text: 'Everything you book is saved in My Passbook, under one QR that also works offline.' },
  { icon: ScanLine, title: '4. Show it at the counter', text: 'Show your QR at the camp gate, kitchen or bus. Staff scan it in a second.' },
];

function HowItWorks() {
  return (
    <section aria-labelledby="how" className="rounded-3xl border-2 border-[#c99436]/40 bg-[#fdfbf8] p-5 sm:p-10 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-line pb-4">
        <div>
          <span className="font-display text-sm font-bold tracking-wider text-[#832014]">
            ॥ चार सरल चरण ॥
          </span>
          <h2 id="how" className="font-display text-2xl sm:text-3xl font-extrabold text-ink">
            How CrowdGrid works
          </h2>
          <p className="mt-1 text-base text-ink-soft max-w-md">No paper slips or separate queues. Everything is on your phone.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary min-h-11 px-4 text-sm" onClick={openTour}>
            <Compass size={18} aria-hidden /> Take the 1-minute tour
          </button>
          <Link to="/help" className="btn-ghost min-h-11 px-4 text-sm">
            <LifeBuoy size={18} aria-hidden /> Help &amp; FAQs
          </Link>
        </div>
      </div>
      <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s) => (
          <li key={s.title} className="flex flex-col justify-between rounded-2xl border border-line bg-white p-5 shadow-2xs">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5ede2] text-[#832014] border border-[#c99436]/40 mb-4">
              <s.icon size={22} aria-hidden strokeWidth={2} />
            </span>
            <div>
              <p className="font-display text-lg font-bold text-ink">{s.title}</p>
              <p className="mt-1 text-sm text-ink-soft leading-relaxed">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

const flag = `/yatra/${SITE.flagshipSlug}`;

/** For first-time visitors: what the site is and where to learn it, right under the hero. */
function NewHereStrip() {
  return (
    <section aria-label="New to CrowdGrid" className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 shadow-xs sm:flex-row sm:items-center">
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-marigold-wash text-marigold-deep">
        <Compass size={26} aria-hidden />
      </span>
      <div className="flex-1">
        <p className="text-lg font-bold">New to CrowdGrid?</p>
        <p className="text-ink-soft">Book a verified stay, free meals and transport for your family, and keep everything under one QR. Here is how it works.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary min-h-11 px-4" onClick={openTour}>Take the tour</button>
        <Link to="/register" className="btn-ghost min-h-11 px-4">Create free account</Link>
      </div>
    </section>
  );
}

/** Floating "Plan your yatra" button */
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
      className="fixed bottom-5 left-4 z-40 flex items-center gap-2 rounded-full sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 bg-gradient-to-r from-amber-600 via-[#832014] to-[#7c1d13] px-7 py-3.5 font-bold text-white shadow-xl shadow-amber-950/40 border-2 border-amber-300 hover:scale-105 transition-transform"
    >
      <CalendarCheck size={18} aria-hidden /> Plan your yatra
    </Link>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const [events, setEvents] = useState(DEFAULT_EVENTS);
  const [error, setError] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

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

  const groups = useMemo(() => {
    const list = Array.isArray(events) ? events : DEFAULT_EVENTS;
    const flagship = list.find((e) => e.kind === 'YATRA' && e.isFlagship) || DEFAULT_EVENTS[0];
    return {
      flagship,
      // every yatra on equal footing, soonest first
      allYatras: [flagship, ...list.filter((e) => e.kind === 'YATRA' && e._id !== flagship._id)].sort((a, b) => new Date(a.startDate) - new Date(b.startDate)),
      publicEvents: list.filter((e) => e.kind === 'PUBLIC'),
    };
  }, [events]);
  // The yatra the search bar and service shortcuts point at (the one the pilgrim picked)
  const [picked, setPicked] = useState(null);
  const current = groups.allYatras.find((e) => e._id === picked) || groups.allYatras[0];

  const filteredPublicEvents = useMemo(() => {
    const list = groups.publicEvents || [];
    const day = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(d));
    if (selectedFilter === 'Free Entry') return list.filter((e) => !e.ticketPrice);
    if (selectedFilter === 'Aartis & Rituals') return list.filter((e) => e.category === 'SPIRITUAL');
    if (selectedFilter === 'Today & Weekend') {
      // today up to and including the coming Sunday (India time)
      const today = todayIST();
      const dow = new Date(`${today}T12:00:00+05:30`).getUTCDay(); // 0 = Sunday
      const sunday = addDaysIST(today, (7 - dow) % 7);
      return list.filter((e) => day(e.startDate) >= today && day(e.startDate) <= sunday);
    }
    if (selectedFilter === 'Flagship Mela') {
      // events in the flagship's towns (e.g. "Nashik - Trimbakeshwar")
      const towns = String(groups.flagship?.city || '').toLowerCase().split(/[-&,]/).map((t) => t.trim()).filter(Boolean);
      return list.filter((e) => towns.some((t) => String(e.city || '').toLowerCase().includes(t)));
    }
    return list;
  }, [groups.publicEvents, groups.flagship, selectedFilter]);

  return (
    <div className="space-y-8 sm:space-y-12 pb-16">
      {/* Auspicious Welcome Namaste Entrance Transition */}
      <NamasteIntro />
      {/* Marigold & mango-leaf garland: the one festive touch at the top */}
      <FullWidthGarland />

      {/* 3. Main Center Content Container */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {!canBook(user) && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-[#fbf5ee] p-4 text-ink">
            <p className="text-sm">
              Signed in as <b>{ROLE_LABELS[user.role]}</b>. Staff accounts manage the yatras; booking is for pilgrims.
            </p>
            <Link to={homeFor(user.role)} className="btn-ink min-h-10 px-4 text-sm">Open my dashboard</Link>
          </div>
        )}

        {/* Where are you going? Every yatra as an equal ticket, then search inside the chosen one */}
        <div className="space-y-5 pt-6 sm:pt-10">
          <YatraChooser yatras={groups.allYatras} selected={current} onSelect={(e) => setPicked(e._id)} />
          {canBook(user) && current && <HeroSearch key={current._id} event={current} />}
        </div>

        {/* First-time visitors: a clear way to learn the site */}
        {!user && <NewHereStrip />}

        {/* Jharokha Window Service Alcoves */}
        <JharokhaConcourse flagshipSlug={current?.slug} />

        {/* How it Works Stepper: right after the services, so new users see it early */}
        <HowItWorks />

        {/* Browsing Bar & Quick Filters */}
        {groups.publicEvents.length > 0 && (
          <BrowsingFilterBar
            selectedFilter={selectedFilter}
            onSelectFilter={setSelectedFilter}
            place={selectedFilter === 'Flagship Mela' ? groups.flagship?.city || 'All yatras' : 'All yatras'}
          />
        )}

        {/* Curated Public Events Grid */}
        {groups.publicEvents.length > 0 && (
          <section aria-labelledby="public">
            <div className="flex items-end justify-between gap-3 mb-6">
              <div>
                <span className="font-display text-sm font-bold tracking-wider text-[#832014]">
                  ॥ दर्शन एवं कार्यक्रम ॥
                </span>
                <h2 id="public" className="font-display text-2xl sm:text-4xl font-extrabold text-ink">
                  Events and entry passes
                </h2>
                <p className="mt-1 text-base text-ink-soft">Aartis, kirtans and heritage walks. Up to 5 tickets per account.</p>
              </div>
              <Link to="/events?tab=public" className="hidden sm:inline-flex text-sm font-bold text-[#832014] hover:underline">
                View all public events →
              </Link>
            </div>
            <PublicEventList events={filteredPublicEvents.slice(0, 6)} emptyMessage={`No ${selectedFilter.toLowerCase()} events right now. Try another filter.`} from="/" />
            {filteredPublicEvents.length > 6 && (
              <div className="mt-6 text-center">
                <Link to="/events?tab=public" className="btn-ghost">See all {filteredPublicEvents.length} events <ArrowRight size={16} aria-hidden /></Link>
              </div>
            )}
          </section>
        )}

        {/* Campus & Corporate Invitation Code Box */}
        <InvitationCodeBox from="/" />

        {/* Grand Eternal Sacred Flame Diya: a small closing blessing, not a full section */}
        <GrandSacredDiya compact />


        {canBook(user) && <FloatingCta />}
      </div>
    </div>
  );
}
