import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BedDouble,
  Briefcase,
  BusFront,
  CalendarCheck,
  CalendarDays,
  Clock,
  CreditCard,
  Flame,
  HandHeart,
  MapPin,
  QrCode,
  ScanLine,
  ShieldCheck,
  Siren,
  Sparkles,
  Ticket,
  UtensilsCrossed,
  Users,
} from 'lucide-react';
import { SITE } from '../lib/site';
import { canBook, homeFor, ROLE_LABELS, useAuth } from '../lib/auth';
import HeroSearch from '../components/HeroSearch';
import API, { errorMessage } from '../lib/api';
import { compactNumber, fmtDate } from '../lib/format';
import Notice, { Loading } from '../components/Notice';
import { InvitationCodeBox, PublicEventList, YatraCard } from '../components/EventCards';
import { DEFAULT_EVENTS } from '../data/defaultEvents';

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

/**
 * Full-Width Edge-to-Edge Marigold & Mango Leaf Festive Garland (Genda Phool Toran):
 * Seamlessly spans 100% of the viewport from edge to edge without any gaps.
 */
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
 * Full-Width Edge-to-Edge Sacred Running Ticker:
 * Spans 100% of the screen from edge to edge without any margins.
 */
function FullWidthTicker() {
  const items = [
    '🚩 ॥ महाकुंभ २०२७ ॥',
    '✦ SIMHASTHA KUMBH MELA 2027',
    '✦ WHERE MILLIONS GATHER AS ONE',
    '✦ 10,000,000+ REGISTERED PILGRIMS',
    '✦ FREE SEVA & ANNADANAM TOKENS LIVE',
    '✦ REAL-TIME GPS GHAT SHUTTLES',
    '✦ OFFLINE DIGITAL PASSBOOK QR',
    '✦ 24/7 PILGRIM COMMAND & SOS',
  ];

  return (
    <div className="w-full overflow-hidden border-y-2 border-[#c99436] bg-[#7c1d13] py-2.5 text-xs sm:text-sm font-bold uppercase tracking-widest text-[#fcedd7] shadow-sm">
      <div className="animate-marquee flex gap-8 items-center whitespace-nowrap">
        {[...items, ...items, ...items, ...items].map((text, i) => (
          <span key={i} className="flex items-center gap-2">
            <span>{text}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Wide Horizontal Jharokha Bracket / Cartouche Frame:
 * Symmetrical 4-point cusped ogee bracket cartouche path matching Image 2,
 * arranged in a wide horizontal orientation (desktop split: titles on left, timer on right).
 */
function HorizontalJharokhaHero({ event, withSearch = false }) {
  const c = useCountdown(event.startDate);
  const nextDates = (event.keyDates || []).slice(0, 3);

  // Wide Horizontal Jharokha Cartouche Path matching Image 2 geometry
  const pathD =
    'M 600,15 C 680,60 760,70 860,70 C 980,70 1025,70 1095,120 C 1150,160 1135,225 1105,260 C 1130,295 1160,310 1185,325 C 1160,340 1130,355 1105,390 C 1135,425 1150,490 1095,530 C 1025,580 980,580 860,580 C 760,580 680,590 600,635 C 520,590 440,580 340,580 C 220,580 175,580 105,530 C 50,490 65,425 95,390 C 70,355 40,340 15,325 C 40,310 70,295 95,260 C 65,225 50,160 105,120 C 175,70 220,70 340,70 C 440,70 520,60 600,15 Z';

  return (
    <div className="relative mx-auto w-full max-w-6xl xl:max-w-7xl pt-2 sm:pt-4">
      {/* SVG Jharokha Cartouche Frame Background & Borders */}
      <svg
        className="absolute inset-0 h-full w-full pointer-events-none drop-shadow-[0_20px_45px_rgba(131,32,20,0.45)]"
        viewBox="0 0 1200 650"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          {/* Authentic Bandhani Tie-Dye Pattern */}
          <pattern id="jharokha-bandhani-wide" width="28" height="28" patternUnits="userSpaceOnUse">
            <rect width="28" height="28" fill="#832014" />
            <circle cx="14" cy="14" r="2.2" fill="#ffd27d" opacity="0.8" />
            <circle cx="14" cy="6" r="1.3" fill="#ffd27d" opacity="0.5" />
            <circle cx="14" cy="22" r="1.3" fill="#ffd27d" opacity="0.5" />
            <circle cx="6" cy="14" r="1.3" fill="#ffd27d" opacity="0.5" />
            <circle cx="22" cy="14" r="1.3" fill="#ffd27d" opacity="0.5" />
            <circle cx="0" cy="0" r="1.8" fill="#ffd27d" opacity="0.6" />
            <circle cx="28" cy="0" r="1.8" fill="#ffd27d" opacity="0.6" />
            <circle cx="0" cy="28" r="1.8" fill="#ffd27d" opacity="0.6" />
            <circle cx="28" cy="28" r="1.8" fill="#ffd27d" opacity="0.6" />
          </pattern>

          {/* Regal Gold Stroke Gradient */}
          <linearGradient id="jharokha-gold-stroke-wide" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="20%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="80%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>

        {/* Outer Jharokha Shape filled with Bandhani & Golden Outline */}
        <path
          d={pathD}
          fill="url(#jharokha-bandhani-wide)"
          stroke="url(#jharokha-gold-stroke-wide)"
          strokeWidth="9"
          strokeLinejoin="round"
        />

        {/* Inner Golden Dotted Filigree Outline */}
        <path
          d={pathD}
          fill="none"
          stroke="#fef08a"
          strokeWidth="2.5"
          strokeDasharray="7 4"
          opacity="0.85"
          transform="scale(0.97) translate(18, 10)"
        />
      </svg>

      {/* Content Framed Safely Inside in Symmetrical Centered Composition */}
      <section
        className="relative z-10 px-6 sm:px-12 md:px-16 lg:px-24 py-12 sm:py-16 md:py-20 text-white flex flex-col items-center text-center"
        aria-labelledby="hero-title"
      >
        {/* Sacred Sanskrit Invocation */}
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-black/40 px-5 py-1.5 text-xs sm:text-sm font-bold tracking-widest text-amber-200 backdrop-blur mb-3 shadow-md">
          <span>॥ ॐ नमः शिवाय · तीर्थराज सिंहस्थ महाकुंभ २०२६ ॥</span>
        </div>

        {/* Crown Title */}
        <h1
          id="hero-title"
          className="font-display text-4xl sm:text-6xl md:text-7xl font-black tracking-wider text-[#fff4d6] drop-shadow-[0_4px_14px_rgba(0,0,0,0.9)] uppercase leading-tight"
        >
          MAHA KUMBH 2026
        </h1>

        {/* Subtitle Line */}
        <p className="font-display text-xl sm:text-2xl md:text-3xl font-medium tracking-wide text-amber-300 italic mt-2 drop-shadow-md">
          Where Millions Gather As One
        </p>

        {/* Descriptive overview */}
        <p className="mt-3 max-w-2xl text-xs sm:text-sm md:text-base leading-relaxed text-[#fde8d0] font-sans">
          {event.description || 'The Simhastha Kumbh on the banks of the Godavari at Nashik and Trimbakeshwar: Find verified shelter, langar, shuttles and help in one place.'}
        </p>

        {/* Auspicious Badges */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 text-xs font-bold">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-300/40 px-3.5 py-1 text-amber-200 backdrop-blur">
            <Users size={14} /> 1,500,000+ Expected Pilgrims
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-300/40 px-3.5 py-1 text-amber-200 backdrop-blur">
            <MapPin size={14} /> Godavari Ghats & Ramkund
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-300/40 px-3.5 py-1 text-amber-200 backdrop-blur">
            <ShieldCheck size={14} /> One Verified QR Pass
          </span>
        </div>

        {/* Temple Bell Countdown & Snan Schedule */}
        <div className="mt-6 w-full max-w-xl mx-auto rounded-2xl border-2 border-amber-300/40 bg-black/45 p-4 sm:p-5 backdrop-blur shadow-2xl">
          <div className="flex items-center justify-between border-b border-amber-300/20 pb-2 mb-3 text-xs sm:text-sm">
            <span className="font-display font-bold uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
              <Flame size={15} className="text-amber-400" />
              {c.done ? 'महोत्सव प्रारंभ' : 'DHWAJAROHAN COUNTDOWN'}
            </span>
            <span className="font-semibold text-amber-200">
              {fmtDate(event.startDate, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          {!c.done ? (
            <div className="grid grid-cols-4 gap-2 text-center" aria-live="off">
              <div className="rounded-xl border border-amber-300/30 bg-amber-950/60 p-2">
                <span className="block font-display text-2xl sm:text-3xl font-extrabold text-amber-300">{c.days}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200/80">Days</span>
              </div>
              <div className="rounded-xl border border-amber-300/30 bg-amber-950/60 p-2">
                <span className="block font-display text-2xl sm:text-3xl font-extrabold text-white">{String(c.hours).padStart(2, '0')}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200/80">Hours</span>
              </div>
              <div className="rounded-xl border border-amber-300/30 bg-amber-950/60 p-2">
                <span className="block font-display text-2xl sm:text-3xl font-extrabold text-white">{String(c.minutes).padStart(2, '0')}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200/80">Mins</span>
              </div>
              <div className="rounded-xl border border-amber-300/30 bg-amber-950/60 p-2">
                <span className="block font-display text-2xl sm:text-3xl font-extrabold text-white">{String(c.seconds).padStart(2, '0')}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200/80">Secs</span>
              </div>
            </div>
          ) : (
            <p className="font-display text-xl font-bold text-amber-300">Shahi Snan Days in Progress</p>
          )}

          {nextDates.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-amber-300/20 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-200">
              <span className="font-bold uppercase tracking-wider">UPCOMING SACRED SNAN:</span>
              <span className="font-display text-xs sm:text-sm font-bold text-amber-300">
                {nextDates[0].label} ({fmtDate(nextDates[0].date, { month: 'short', day: 'numeric' })})
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3.5">
          <Link
            to={`/yatra/${event.slug}`}
            className="btn-primary min-h-11 rounded-full bg-gradient-to-r from-amber-500 via-[#bd5338] to-[#9b2c16] px-6 py-2.5 text-sm sm:text-base font-bold text-white shadow-xl shadow-amber-950/40 hover:scale-105 border-2 border-amber-300 transition-all flex items-center gap-2"
          >
            Enter Pilgrim Portal <ArrowRight size={16} aria-hidden />
          </Link>
          <Link
            to="/events?tab=public"
            className="btn-ghost min-h-11 rounded-full border-2 border-amber-300/60 bg-black/45 px-5 text-xs sm:text-sm font-bold text-amber-100 backdrop-blur hover:bg-black/60 transition flex items-center gap-2"
          >
            <Ticket size={16} className="text-amber-300" aria-hidden /> Browse Sacred Passes
          </Link>
          <Link
            to="/passbook"
            className="btn-ghost min-h-11 rounded-full border-2 border-amber-300/60 bg-black/45 px-4 text-xs sm:text-sm font-bold text-amber-100 backdrop-blur hover:bg-black/60 transition flex items-center gap-2"
          >
            <QrCode size={16} className="text-amber-300" aria-hidden /> My Offline QR
          </Link>
        </div>
      </section>
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
      title: 'Stays & Tents',
      desc: 'Verified dharamshalas, family tents & clean bedding with confirmed bed number.',
      pill: 'Verified Stays',
      highlight: false,
    },
    {
      to: `${base}?tab=food`,
      icon: UtensilsCrossed,
      hindi: 'अन्नदानम्',
      title: 'Annadanam & Prasad',
      desc: 'Daily kitchen timings & family meal tokens for all registered pilgrims.',
      pill: 'Free Prasad',
      highlight: false,
    },
    {
      to: `${base}?tab=transit`,
      icon: BusFront,
      hindi: 'घाट शटल सेवा',
      title: 'Ghat Shuttles',
      desc: 'Feeder buses, e-rickshaws & live navigation to sacred bathing ghats.',
      pill: 'Live Transit',
      highlight: false,
    },
    {
      to: `${base}?tab=seva`,
      icon: HandHeart,
      hindi: 'सेवा एवं स्वयंसेवक',
      title: 'Seva & Volunteering',
      desc: 'Serve with registered ashrams & trusts and receive your official volunteer pass.',
      pill: 'Volunteer ID',
      highlight: false,
    },
    {
      to: '/events?tab=public',
      icon: Ticket,
      hindi: 'आरती एवं दर्शन',
      title: 'Aartis & Passes',
      desc: 'Maha Aartis, heritage walks, and bhajan evenings with digital entry passes.',
      pill: 'Entry Passes',
      highlight: false,
    },
    {
      to: `${base}?tab=sos`,
      icon: Siren,
      hindi: 'आपातकालीन सहायता',
      title: 'Emergency SOS',
      desc: 'One-tap medical dispatch, police post navigation & lost family reunion assistance.',
      pill: '24/7 Helpline',
      highlight: true,
    },
  ];

  return (
    <section aria-labelledby="concourse-title" className="space-y-6 pt-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b-2 border-[#c99436]/40 pb-4">
        <div>
          <span className="font-display text-sm font-bold uppercase tracking-widest text-[#832014]">
            ॥ तीर्थ यात्री सेवा द्वार ॥
          </span>
          <h2 id="concourse-title" className="font-display text-2xl sm:text-4xl font-extrabold text-ink">
            PILGRIM SERVICES CONCOURSE
          </h2>
        </div>
        <p className="text-sm font-medium text-ink-soft max-w-sm">
          Select any temple window to reserve lodging, tokens, shuttles or seva slots.
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
              <p className="mt-2 text-xs sm:text-sm text-ink-soft leading-relaxed">
                {s.desc}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#832014] group-hover:underline pt-3 border-t border-line/60">
              <span>Open Window</span> <ArrowRight size={13} />
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
function BrowsingFilterBar({ selectedFilter, onSelectFilter }) {
  const chips = ['All', 'Free Entry', 'Today & Weekend', 'Aartis & Rituals', 'Flagship Mela'];

  return (
    <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between border-b-2 border-[#c99436]/40 pb-5 pt-3">
      <div className="flex items-center gap-2">
        <span className="font-display text-sm font-bold uppercase tracking-wider text-ink-faint">Viewing</span>
        <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#c99436] bg-[#fbf5ec] px-4 py-1.5 text-sm font-bold text-ink shadow-2xs">
          <MapPin size={14} className="text-[#832014] shrink-0" aria-hidden />
          <span>Nashik & Godavari Ghats</span>
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
              className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
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
  { icon: CalendarCheck, title: '1. Select Service', text: 'Pick a camp shelter, free meal token, bus shuttle or seva slot.' },
  { icon: CreditCard, title: '2. Instant Confirmation', text: 'Free seva & passes confirmed immediately; paid camps via UPI.' },
  { icon: QrCode, title: '3. Digital QR Passbook', text: 'All booked passes stored in one QR code that works completely offline.' },
  { icon: ScanLine, title: '4. Gate Entry Scan', text: 'Present your screen once at the ghat or camp gate for fast entry.' },
];

function HowItWorks() {
  return (
    <section aria-labelledby="how" className="rounded-3xl border-2 border-[#c99436]/40 bg-[#fdfbf8] p-7 sm:p-10 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b border-line pb-4">
        <div>
          <span className="font-display text-xs font-bold uppercase tracking-wider text-[#832014]">
            ॥ चार सरल चरण ॥
          </span>
          <h2 id="how" className="font-display text-2xl sm:text-3xl font-extrabold text-ink">
            HOW CROWDGRID WORKS
          </h2>
        </div>
        <p className="text-sm text-ink-soft max-w-sm">No paper slips or separate lines. Everything syncs to your phone.</p>
      </div>
      <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s) => (
          <li key={s.title} className="flex flex-col justify-between rounded-2xl border border-line bg-white p-5 shadow-2xs">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5ede2] text-[#832014] border border-[#c99436]/40 mb-4">
              <s.icon size={22} aria-hidden strokeWidth={2} />
            </span>
            <div>
              <p className="font-display text-lg font-bold text-ink">{s.title}</p>
              <p className="mt-1 text-xs text-ink-soft leading-relaxed">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

const flag = `/yatra/${SITE.flagshipSlug}`;
const TILES = [
  { to: `${flag}?tab=lodging`, icon: BedDouble, title: 'Stays & Tents', text: 'Verified camps & tents with bed number.', tint: '#302621' },
  { to: `${flag}?tab=food`, icon: UtensilsCrossed, title: 'Annadanam', text: "Today's kitchen menu & family token.", tint: '#42251a' },
  { to: `${flag}?tab=transit`, icon: BusFront, title: 'Shuttles & Buses', text: 'Feeder buses with water points & day pass.', tint: '#1f3325' },
  { to: `${flag}?tab=seva`, icon: HandHeart, title: 'Seva Volunteering', text: 'Serve with a trust and get volunteer ID.', tint: '#332338' },
  { to: '/events?tab=public', icon: Ticket, title: 'Public Events', text: 'Aartis, heritage walks and bhajan evenings.', tint: '#202f3a' },
  { to: '/events?tab=corporate', icon: Briefcase, title: 'Campus & Corporate', text: 'Invite-only summits with digital badges.', tint: '#3b221d' },
  { to: `${flag}?tab=sos`, icon: Siren, title: 'SOS & Lost/Found', text: 'One-tap emergency alert & family help.', tint: '#42161b' },
  { to: '/passbook', icon: QrCode, title: 'My Passbook', text: 'All passes in one QR, works offline.', tint: '#292e1e' },
];

function PlanTiles() {
  return (
    <section aria-labelledby="plan" className="rounded-3xl bg-[#26211e] p-7 sm:p-10 text-white shadow-xl border-2 border-[#c99436]">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-display text-xs font-bold uppercase tracking-widest text-amber-300">॥ समग्र सेवा दर्शन ॥</p>
          <h2 id="plan" className="font-display text-2xl sm:text-4xl font-extrabold text-[#fff4d6]">
            EXPLORE THE FULL DIRECTORY
          </h2>
        </div>
        <Link to={flag} className="text-sm font-bold text-amber-300 hover:underline flex items-center gap-1.5">
          Open Full Portal <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
      <ul className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {TILES.map((t, i) => (
          <li key={t.title}>
            <Link
              to={t.to}
              className="group relative flex h-full min-h-52 flex-col justify-end overflow-hidden rounded-2xl p-5 text-white outline-offset-2 transition-all hover:brightness-110 hover:-translate-y-0.5 border border-amber-900/40"
              style={{ background: `linear-gradient(180deg, ${t.tint} 0%, #1a1614 100%)` }}
            >
              <t.icon aria-hidden className="absolute right-3 top-4 h-20 w-20 text-white/10 transition group-hover:text-white/20" strokeWidth={1.2} />
              <span className="mb-2 w-fit rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-black tracking-widest text-[#26211e]">{String(i + 1).padStart(2, '0')}</span>
              <span className="font-display text-lg font-bold leading-tight">{t.title}</span>
              <span className="mt-1 text-xs leading-snug text-[#e0d6cb]">{t.text}</span>
              <span className="mt-3 flex items-center gap-1 text-xs font-bold text-amber-300 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                Open <ArrowRight size={13} aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
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

  const groups = useMemo(() => {
    const list = Array.isArray(events) ? events : DEFAULT_EVENTS;
    return {
      flagship: list.find((e) => e.kind === 'YATRA' && e.isFlagship) || DEFAULT_EVENTS[0],
      yatras: list.filter((e) => e.kind === 'YATRA' && !e.isFlagship),
      publicEvents: list.filter((e) => e.kind === 'PUBLIC'),
    };
  }, [events]);

  const filteredPublicEvents = useMemo(() => {
    const list = groups.publicEvents || [];
    if (selectedFilter === 'Free Entry') return list.filter((e) => !e.ticketPrice || e.ticketPrice === 0);
    if (selectedFilter === 'Aartis & Rituals') return list.filter((e) => e.category === 'AARTI' || e.category === 'SPIRITUAL');
    return list;
  }, [groups.publicEvents, selectedFilter]);

  return (
    <div className="space-y-8 sm:space-y-12 pb-16">
      {/* 1. Full-Width Edge-to-Edge Sacred Running Ticker */}
      <FullWidthTicker />

      {/* 2. Full-Width Edge-to-Edge Marigold & Mango Leaf Garland */}
      <FullWidthGarland />

      {/* 3. Main Center Content Container */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {!canBook(user) && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-[#fbf5ee] p-4 text-ink">
            <p className="text-sm">
              Signed in as <b>{ROLE_LABELS[user.role]}</b>. Staff accounts manage the mela; booking is for pilgrims.
            </p>
            <Link to={homeFor(user.role)} className="btn-ink min-h-10 px-4 text-sm">Open my dashboard</Link>
          </div>
        )}

        {/* Horizontal Jharokha Hero + Floating Travel Search Bar */}
        {groups.flagship && (
          <div className="space-y-4">
            <HorizontalJharokhaHero event={groups.flagship} withSearch={canBook(user)} />
            {canBook(user) && <HeroSearch event={groups.flagship} />}
          </div>
        )}

        {/* Jharokha Window Service Alcoves */}
        <JharokhaConcourse flagshipSlug={groups.flagship?.slug} />

        {/* Browsing Bar & Quick Filters */}
        <BrowsingFilterBar selectedFilter={selectedFilter} onSelectFilter={setSelectedFilter} />

        {/* Curated Public Events Grid */}
        {groups.publicEvents.length > 0 && (
          <section aria-labelledby="public">
            <div className="flex items-end justify-between gap-3 mb-6">
              <div>
                <span className="font-display text-xs font-bold uppercase tracking-wider text-[#832014]">
                  ॥ दर्शन एवं कार्यक्रम ॥
                </span>
                <h2 id="public" className="font-display text-2xl sm:text-4xl font-extrabold text-ink">
                  PUBLIC EVENTS & ENTRY PASSES
                </h2>
              </div>
              <Link to="/events?tab=public" className="hidden sm:inline-flex text-sm font-bold text-[#832014] hover:underline">
                View all public events →
              </Link>
            </div>
            <PublicEventList events={filteredPublicEvents.length > 0 ? filteredPublicEvents : groups.publicEvents} onChange={load} from="/" />
          </section>
        )}

        {/* More Yatras Section */}
        {groups.yatras.length > 0 && (
          <section aria-labelledby="yatras">
            <div className="flex items-end justify-between gap-3 mb-6">
              <div>
                <span className="font-display text-xs font-bold uppercase tracking-wider text-[#832014]">
                  ॥ अन्य तीर्थ यात्राएं ॥
                </span>
                <h2 id="yatras" className="font-display text-2xl sm:text-4xl font-extrabold text-ink">
                  MORE SACRED YATRAS
                </h2>
              </div>
              <Link to="/events?tab=yatras" className="font-bold text-sm text-[#832014] hover:underline">All yatras →</Link>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {groups.yatras.map((e) => <YatraCard key={e._id} event={e} />)}
            </ul>
          </section>
        )}

        {/* Campus & Corporate Invitation Code Box */}
        <InvitationCodeBox from="/" />

        {/* How it Works Stepper */}
        <HowItWorks />

        {/* Plan your Yatra dark menu tiles */}
        <PlanTiles />

        {canBook(user) && <FloatingCta />}
      </div>
    </div>
  );
}
