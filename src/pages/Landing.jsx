import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  BusFront,
  CalendarDays,
  Compass,
  Gauge,
  HandHeart,
  KeyRound,
  Languages,
  QrCode,
  Siren,
  Smartphone,
  UtensilsCrossed,
  WifiOff,
} from 'lucide-react';
import { canBook, homeFor, ROLE_LABELS, useAuth } from '../lib/auth';
import API, { errorMessage } from '../lib/api';
import { useT } from '../lib/i18n';
import { fmtDate } from '../lib/format';
import { InvitationCodeBox, PublicEventList, YatraCard } from '../components/EventCards';
import { DEFAULT_EVENTS } from '../data/defaultEvents';
import { isVideo, LANDING_MEDIA } from '../data/landingMedia';
import { SCENES } from '../components/landing/Scenes';
import RoleDashboards from '../components/landing/RoleDashboards';
import { openTour } from '../components/GuidedTour';
import '../styles/landing.css';

/*
 * Each kind of gathering has a bright colour (panels, dots, illustrations) and a deep one
 * for anything carrying white text, so labels and buttons pass WCAG AA contrast.
 */
const KINDS = [
  { id: 'pilgrimage', tab: 'yatras', color: '#E36F1E', deep: '#B4530F' },
  { id: 'public', tab: 'public', color: '#1F3F8F', deep: '#1F3F8F' },
  { id: 'corporate', tab: 'corporate', color: '#138A43', deep: '#0D6331' },
];
const KIND_BY_TAB = Object.fromEntries(KINDS.map((k) => [k.tab, k]));

/** A photo or clip when one is set in landingMedia.js, otherwise the drawn scene. */
function Media({ slot }) {
  const src = LANDING_MEDIA[slot];
  const Scene = SCENES[slot];
  if (src && isVideo(src)) return <video src={src} autoPlay muted loop playsInline aria-hidden="true" />;
  if (src) return <img src={src} alt="" decoding="async" />;
  return Scene ? <Scene /> : null;
}

function Hero({ onInvite }) {
  const t = useT();
  return (
    <section className="cg-shell grid items-center gap-10 pt-8 pb-4 sm:pt-12 lg:grid-cols-[1fr_1.2fr] lg:gap-14">
      <div className="cg-rise">
        <div className="cg-tricolour" aria-hidden>
          <span style={{ background: '#E36F1E' }} />
          <span style={{ background: '#FFFDF8', boxShadow: 'inset 0 0 0 1px #E7E1D7' }} />
          <span style={{ background: '#138A43' }} />
        </div>
        <h1 className="cg-h1 mt-5">{t('home.title1')}<br />{t('home.title2')}</h1>
        <p className="mt-5 max-w-md text-lg text-[#4A4F5E]">{t('home.lead')}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link to="/events" className="cg-btn cg-btn-saffron">
            {t('home.find')} <ArrowRight size={18} aria-hidden />
          </Link>
          <button type="button" className="cg-btn cg-btn-line" onClick={onInvite}>
            <KeyRound size={18} aria-hidden /> {t('home.haveCode')}
          </button>
        </div>
        <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-[#4A4F5E]">
          <li className="flex items-center gap-1.5"><QrCode size={16} className="text-[#B4530F]" aria-hidden /> {t('home.oneQr')}</li>
          <li className="flex items-center gap-1.5"><WifiOff size={16} className="text-[#1F3F8F]" aria-hidden /> {t('home.offline')}</li>
          <li className="flex items-center gap-1.5"><Languages size={16} className="text-[#0D6331]" aria-hidden /> English · हिन्दी · मराठी</li>
        </ul>
      </div>

      <nav aria-label={t('home.chooseKind')} className="cg-tri">
        {KINDS.map((k, i) => (
          <Link key={k.id} to={`/events?tab=${k.tab}`} className={`cg-panel cg-rise cg-rise-${i + 1}`} style={{ background: k.color }}>
            <span className="cg-panel-art"><Media slot={k.id} /></span>
            <span className="cg-panel-label" style={{ background: k.deep }}>
              <b className="cg-long">{t(`kind.${k.id}`)}</b>
              <b className="cg-short">{t(`kind.${k.id}.short`)}</b>
              <small>{t(`kind.${k.id}.line`)}</small>
            </span>
          </Link>
        ))}
      </nav>
    </section>
  );
}

/** The soonest thing of each kind, straight from the event list. */
function NextUp({ yatras, publicEvents, onInvite }) {
  const t = useT();
  // Read the clock once when the strip appears, so every render compares against the same time
  const [now] = useState(() => Date.now());
  const soonest = (list) =>
    [...list]
      .filter((e) => new Date(e.endDate || e.startDate).getTime() >= now)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0];
  const yatra = soonest(yatras);
  const pub = soonest(publicEvents);
  const when = (e) =>
    new Date(e.startDate).getTime() <= now ? t('next.on') : fmtDate(e.startDate, { weekday: 'short', month: 'short', day: 'numeric' });

  const item = 'flex min-h-16 items-center gap-3 px-4 py-3 sm:px-5';
  return (
    <section aria-labelledby="next-title" className="cg-shell pt-6">
      <div className="grid overflow-hidden rounded-2xl bg-white ring-1 ring-[#E7E1D7] md:grid-cols-[auto_1fr_1fr_1fr]">
        <h2 id="next-title" className="cg-kicker flex items-center gap-2 whitespace-nowrap bg-[#F4F1EA] px-5 py-3 text-[#4A4F5E]">
          <CalendarDays size={16} aria-hidden /> {t('next.title')}
        </h2>
        {[['pilgrimage', yatra, (e) => `/yatra/${e.slug}`], ['public', pub, (e) => `/event/${e.slug}`]].map(([id, e, href]) => {
          const k = KINDS.find((x) => x.id === id);
          const body = (
            <>
              <span className="cg-dot shrink-0" style={{ background: k.color }} />
              <span className="min-w-0">
                <span className="block truncate font-bold">{e ? e.title : t(`kind.${id}`)}</span>
                <span className="block text-sm text-[#4A4F5E]">{e ? when(e) : t('next.soon')}</span>
              </span>
            </>
          );
          return e
            ? <Link key={id} to={href(e)} className={`${item} border-t border-[#E7E1D7] hover:bg-[#FAF8F4] md:border-t-0 md:border-l`}>{body}</Link>
            : <div key={id} className={`${item} border-t border-[#E7E1D7] md:border-t-0 md:border-l`}>{body}</div>;
        })}
        <button type="button" onClick={onInvite} className={`${item} border-t border-[#E7E1D7] text-left hover:bg-[#FAF8F4] md:border-t-0 md:border-l`}>
          <span className="cg-dot shrink-0" style={{ background: '#138A43' }} />
          <span className="min-w-0">
            <span className="block truncate font-bold">{t('kind.corporate')} · {t('next.inviteOnly')}</span>
            <span className="block text-sm text-[#4A4F5E]">{t('next.enterCode')}</span>
          </span>
        </button>
      </div>
    </section>
  );
}

const SERVICES = [
  { id: 'passes', icon: QrCode, kinds: [0, 1, 2] },
  { id: 'stays', icon: BedDouble, kinds: [0] },
  { id: 'meals', icon: UtensilsCrossed, kinds: [0, 2] },
  { id: 'transport', icon: BusFront, kinds: [0, 1] },
  { id: 'badges', icon: BadgeCheck, kinds: [2] },
  { id: 'volunteers', icon: HandHeart, kinds: [0, 1] },
  { id: 'crowd', icon: Gauge, kinds: [0, 1, 2] },
  { id: 'sos', icon: Siren, kinds: [0, 1, 2], sos: true },
];

function Services() {
  const t = useT();
  return (
    <section aria-labelledby="services-title" className="cg-shell cg-section">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-xl">
          <p className="cg-kicker text-[#B4530F]">{t('svc.kicker')}</p>
          <h2 id="services-title" className="cg-h2">{t('svc.title')}</h2>
        </div>
        <ul className="flex flex-wrap gap-4 text-sm font-semibold text-[#4A4F5E]" aria-label={t('svc.key')}>
          {KINDS.map((k) => (
            <li key={k.id} className="flex items-center gap-2"><span className="cg-dot" style={{ background: k.color }} /> {t(`kind.${k.id}`)}</li>
          ))}
        </ul>
      </div>

      <ul className="cg-rows mt-8 grid gap-x-12 md:grid-cols-2">
        {SERVICES.map((s) => (
          <li key={s.id} className="flex gap-4 py-5">
            <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${s.sos ? 'bg-[#FBEAEA] text-[#C8102E]' : 'bg-[#F4F1EA] text-[#1B1E28]'}`}>
              <s.icon size={22} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-bold">{t(`svc.${s.id}`)}</h3>
                <span className="flex gap-1.5" role="img" aria-label={t('svc.for', { list: s.kinds.map((i) => t(`kind.${KINDS[i].id}`)).join(', ') })}>
                  {s.kinds.map((i) => <span key={i} className="cg-dot" style={{ background: KINDS[i].color }} />)}
                </span>
              </div>
              <p className="mt-0.5 text-[#4A4F5E]">{t(`svc.${s.id}.text`)}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function HowItWorks() {
  const t = useT();
  return (
    <section aria-labelledby="how-title" className="bg-[#FDEEDF]">
      <div className="cg-shell cg-section">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="cg-kicker text-[#8A3F0B]">{t('how.kicker')}</p>
            <h2 id="how-title" className="cg-h2">{t('how.title')}</h2>
          </div>
          <button type="button" className="cg-btn cg-btn-line self-start md:self-auto" onClick={openTour}>
            <Compass size={18} aria-hidden /> {t('how.tour')}
          </button>
        </div>
        <ol className="cg-steps relative mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <span className="absolute top-5 right-8 left-8 hidden h-0.5 bg-[#E36F1E]/35 lg:block" aria-hidden />
          {[1, 2, 3, 4].map((n) => (
            <li key={n}>
              <h3 className="mt-4 text-lg font-bold">{t(`how.${n}`)}</h3>
              <p className="mt-1 text-[#4A4F5E]">{t(`how.${n}.text`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const EVENT_TABS = ['public', 'yatras', 'corporate'];

function Upcoming({ yatras, publicEvents, tab, setTab, sectionRef }) {
  const t = useT();
  const kindName = (tb) => t(`kind.${KIND_BY_TAB[tb].id}`);
  return (
    <section ref={sectionRef} aria-labelledby="upcoming-title" className="cg-shell cg-section scroll-mt-20">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="cg-kicker text-[#0D6331]">{t('up.kicker')}</p>
          <h2 id="upcoming-title" className="cg-h2">{t('up.title')}</h2>
        </div>
        <Link to={`/events?tab=${tab}`} className="font-bold text-[#1F3F8F] underline-offset-4 hover:underline">
          {t('up.seeAll')}: {kindName(tab)} →
        </Link>
      </div>

      <div role="tablist" aria-label={t('up.type')} className="no-scrollbar mt-6 flex gap-2 overflow-x-auto">
        {EVENT_TABS.map((tb) => {
          const k = KIND_BY_TAB[tb];
          const on = tab === tb;
          return (
            <button
              key={tb}
              type="button"
              role="tab"
              id={`ev-tab-${tb}`}
              aria-selected={on}
              aria-controls="ev-panel"
              onClick={() => setTab(tb)}
              className="flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 font-semibold transition-colors"
              style={on ? { background: k.deep, color: '#fff' } : { background: '#fff', boxShadow: 'inset 0 0 0 1.5px #E7E1D7' }}
            >
              {!on && <span className="cg-dot" style={{ background: k.color }} />}
              {kindName(tb)}
            </button>
          );
        })}
      </div>

      <div id="ev-panel" role="tabpanel" aria-labelledby={`ev-tab-${tab}`} className="mt-6">
        {tab === 'public' && <PublicEventList events={publicEvents.slice(0, 6)} emptyMessage={t('up.noPublic')} from="/" />}
        {tab === 'yatras' && (
          yatras.length > 0
            ? <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{yatras.slice(0, 6).map((e) => <YatraCard key={e._id} event={e} />)}</ul>
            : <p className="text-[#4A4F5E]">{t('up.noYatras')}</p>
        )}
        {tab === 'corporate' && (
          <div className="space-y-4">
            <p className="max-w-xl text-[#4A4F5E]">{t('up.corporateNote')}</p>
            <InvitationCodeBox from="/" />
          </div>
        )}
      </div>
    </section>
  );
}

const ACCESS = [
  { id: 'lang', icon: Languages },
  { id: 'offline', icon: WifiOff },
  { id: 'phone', icon: Smartphone },
  { id: 'help', icon: Siren },
];

function ForEveryone() {
  const t = useT();
  return (
    <section aria-labelledby="access-title" className="cg-dots text-white">
      <div className="cg-shell grid gap-8 py-14 sm:py-16 lg:grid-cols-[1fr_1.4fr] lg:items-center">
        <div>
          <p className="cg-kicker text-[#FFD9B8]">{t('access.kicker')}</p>
          <h2 id="access-title" className="cg-h2" style={{ color: '#fff' }}>{t('access.title')}</h2>
          <p className="mt-2 max-w-sm text-white/90">{t('access.lead')}</p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {ACCESS.map((a) => (
            <li key={a.id} className="flex items-center gap-3 rounded-2xl bg-[#142B66] px-4 py-4 font-semibold">
              <a.icon size={22} className="shrink-0 text-[#FFD9B8]" aria-hidden /> {t(`access.${a.id}`)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function HostCta() {
  const t = useT();
  const together = LANDING_MEDIA.together;
  return (
    <section aria-labelledby="host-title" className="cg-shell py-14 sm:py-16">
      <div className="grid overflow-hidden rounded-3xl bg-[#E5F3EA] md:grid-cols-[1.3fr_1fr]">
        <div className="p-6 sm:p-10">
          <p className="cg-kicker text-[#0D6331]">{t('host.kicker')}</p>
          <h2 id="host-title" className="cg-h2">{t('host.title')}</h2>
          <p className="mt-3 max-w-md text-[#4A4F5E]">{t('host.text')}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/help" className="cg-btn cg-btn-blue">{t('host.talk')} <ArrowRight size={18} aria-hidden /></Link>
            <Link to="/about" className="cg-btn cg-btn-line">{t('host.about')}</Link>
          </div>
        </div>
        <div className="relative hidden min-h-64 md:block" aria-hidden>
          {together ? (
            isVideo(together)
              ? <video src={together} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
              : <img src={together} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
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
  const t = useT();
  const [events, setEvents] = useState(DEFAULT_EVENTS);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('public');
  const upcomingRef = useRef(null);

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
    const timer = setTimeout(load, 15000);
    return () => clearTimeout(timer);
  }, [error]);

  const { yatras, publicEvents } = useMemo(() => {
    const list = Array.isArray(events) ? events : DEFAULT_EVENTS;
    return {
      yatras: list.filter((e) => e.kind === 'YATRA'),
      publicEvents: list.filter((e) => e.kind === 'PUBLIC'),
    };
  }, [events]);

  // "I have an invite code": open the corporate tab and put the cursor in the code box
  const openInvite = () => {
    setTab('corporate');
    requestAnimationFrame(() => {
      upcomingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => document.getElementById('invite-code')?.focus({ preventScroll: true }), 450);
    });
  };

  return (
    <div className="cg-home relative">
      {!canBook(user) && (
        <div className="cg-shell pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#E7EDF9] p-4">
            <p className="text-sm">{t('home.staffNote', { role: ROLE_LABELS[user.role] })}</p>
            <Link to={homeFor(user.role)} className="cg-btn cg-btn-blue text-sm">{t('home.openDashboard')}</Link>
          </div>
        </div>
      )}

      <Hero onInvite={openInvite} />
      <NextUp yatras={yatras} publicEvents={publicEvents} onInvite={openInvite} />
      <Services />
      <HowItWorks />
      <Upcoming yatras={yatras} publicEvents={publicEvents} tab={tab} setTab={setTab} sectionRef={upcomingRef} />
      <div className="bg-[#F4F1EA]/70">
        <div className="cg-shell"><RoleDashboards /></div>
      </div>
      <ForEveryone />
      <HostCta />
    </div>
  );
}
