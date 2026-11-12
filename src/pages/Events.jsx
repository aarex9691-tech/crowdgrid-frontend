import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Briefcase, Flag, Ticket } from 'lucide-react';
import API, { errorMessage } from '../lib/api';
import { categoryLabel, EVENT_CATEGORIES, fmtDate } from '../lib/format';
import EventCategoryIcon from '../components/EventCategoryIcon';
import Notice from '../components/Notice';
import { InvitationCodeBox, PublicEventList, YatraCard } from '../components/EventCards';
import { DEFAULT_EVENTS } from '../data/defaultEvents';
import { LANDING_MEDIA } from '../data/landingMedia';
import SnanDates from '../components/SnanDates';
import { useT } from '../lib/i18n';
import PageTitle from '../components/PageTitle';

const TAB_PREVIEWS = {
  yatras: {
    src: LANDING_MEDIA.pilgrimage.src,
    badge: 'Flagship Pilgrimage',
    title: 'Simhastha Kumbh Mela',
    subtitle: 'Nashik · Trimbakeshwar 2026',
    to: '/yatra/simhastha-kumbh-mela-2026',
  },
  public: {
    src: LANDING_MEDIA.public.src,
    badge: 'Public Gatherings',
    title: 'Concerts & Cultural Fests',
    subtitle: 'Tickets, Entry Passes & Wristbands',
    to: '/events?tab=public',
  },
  corporate: {
    src: LANDING_MEDIA.corporate.src,
    badge: 'Campus & Summits',
    title: 'Conferences & Keynotes',
    subtitle: 'Digital Badges & Session Passes',
    to: '/events?tab=corporate',
  },
};

const TABS = [
  { id: 'yatras', label: 'Yatras & melas', icon: Flag, blurb: 'Large pilgrimages with lodging, food, transport and seva.', kind: 'pilgrimage', tone: 'border-marigold' },
  { id: 'public', label: 'Public events', icon: Ticket, blurb: 'Open to everyone. Register, pay at checkout and get your entry pass.', kind: 'public', tone: 'border-blue' },
  { id: 'corporate', label: 'Campus & Corporate', icon: Briefcase, blurb: 'Invite-only events for students and professionals. Enter the 6-digit code from your host.', kind: 'corporate', tone: 'border-leaf' },
];

/** All events, one tab per type (yatras, public, invite-only). */
export default function Events() {
  const t = useT();
  const [params, setParams] = useSearchParams();
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

  const category = params.get('category') || '';
  const rawQ = (params.get('q') || '').trim();
  const q = rawQ.toLowerCase();
  // The header search covers yatras and public events alike
  const matches = (e) => !q || [e.title, e.tagline, e.venue, e.city, e.description].some((f) => (f || '').toLowerCase().includes(q));
  const yatras = useMemo(
    () => (events || []).filter((e) => e.kind === 'YATRA' && matches(e)).sort((a, b) => (b.isFlagship ? 1 : 0) - (a.isFlagship ? 1 : 0)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events, q]
  );
  const publicEvents = useMemo(
    () => (events || []).filter((e) => e.kind === 'PUBLIC' && (!category || e.category === category) && matches(e)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events, category, q]
  );
  const counts = { yatras: yatras.length, public: publicEvents.length };
  // Category chips: only categories that have events on (plus the one in the link), in the usual order
  const chips = useMemo(() => {
    const n = {};
    for (const e of events || []) if (e.kind === 'PUBLIC' && e.category) n[e.category] = (n[e.category] || 0) + 1;
    const order = [...Object.keys(EVENT_CATEGORIES), ...Object.keys(n).filter((k) => !EVENT_CATEGORIES[k])];
    return order.filter((k) => n[k] || k === category).map((k) => ({ k, label: categoryLabel(k), n: n[k] || 0 }));
  }, [events, category]);
  // A search without a chosen tab opens the tab that has results
  const tabParam = params.get('tab');
  const active =
    TABS.find((t) => t.id === tabParam) ||
    (q ? (publicEvents.length || !yatras.length ? TABS[1] : TABS[0]) : TABS[0]);
  const withQ = (p) => (rawQ ? { ...p, q: rawQ } : p);
  const preview = TAB_PREVIEWS[active.id] || TAB_PREVIEWS.yatras;

  return (
    <div>
      {/* The photo follows the chosen kind of event */}
      {/* Compact Header with Side Feature Card (Yatra, Public & Corporate respectively) */}
      <div className="border-b border-line bg-mist/60 py-5 sm:py-6">
        <div className="shell flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <PageTitle
            className="flex-1"
            kicker={`CrowdGrid · ${t('nav.events')}`}
            tone="saffron"
            title={t('nav.events')}
            lead={active.blurb}
          />

          {/* Side Image Banner (Decorative feature card, non-clickable) */}
          <div className="w-full lg:w-80 xl:w-96 shrink-0">
            <div
              className="relative block h-24 sm:h-28 w-full overflow-hidden rounded-2xl border border-line shadow-xs cursor-default select-none"
              aria-hidden="true"
            >
              <img
                src={preview.src}
                alt=""
                className="size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/35 to-transparent" />
              <div className="absolute top-2 right-2.5">
                <span className="rounded-md bg-white/20 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-2xs">
                  {preview.badge}
                </span>
              </div>
              <div className="absolute bottom-2 left-3 right-3 text-white">
                <p className="font-display text-sm font-bold leading-tight text-white drop-shadow-sm">
                  {preview.title}
                </p>
                <p className="text-[11px] text-blue-mist truncate">
                  {preview.subtitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="shell space-y-6 py-5 sm:py-6">
        <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line" role="tablist" aria-label="Event types">
          {TABS.map((t) => {
            const selected = t.id === active.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setParams(withQ({ tab: t.id }))}
                className={`-mb-px flex min-h-14 sm:min-h-16 shrink-0 items-center gap-2.5 border-b-[3.5px] px-5 sm:px-6 text-base sm:text-lg font-bold transition-all ${selected ? `${t.tone} text-ink bg-mist/60` : 'border-transparent text-ink-soft hover:text-ink hover:bg-mist/30'}`}
              >
                <t.icon size={18} aria-hidden /> {t.label}
                {counts[t.id] !== undefined && events && <span className="pill-quiet">{counts[t.id]}</span>}
              </button>
            );
          })}
        </div>
        {rawQ && (
          <p className="flex flex-wrap items-center gap-2 text-ink-soft">
            Results for <b className="text-ink">“{rawQ}”</b>
            <button type="button" className="font-bold text-ink underline" onClick={() => setParams(tabParam ? { tab: tabParam } : {})}>Clear search</button>
          </p>
        )}

        {error && (
          <div className="rounded-xl bg-marigold-wash p-3 text-sm text-marigold-deep" role="status">
            Can't reach the server right now (it may be waking up). Showing the published schedule; booking works once it connects. Retrying…
          </div>
        )}

        {active.id === 'yatras' ? (
          yatras.length ? (
            <>
              {yatras[0]?.isFlagship && (
                <Link to={`/yatra/${yatras[0].slug}`} className="cg-maroon-band block rounded-2xl border-l-4 border-l-marigold p-6 sm:p-7 shadow-sm transition-all hover:shadow-md">
                  <p className="cg-kicker text-saffron-light">Flagship</p>
                  <p className="mt-1 font-display text-3xl sm:text-4xl">{yatras[0].title}</p>
                  <p className="mt-1 text-blue-mist">{yatras[0].tagline || yatras[0].city}</p>
                  <p className="text-blue-mist">{fmtDate(yatras[0].startDate)} to {fmtDate(yatras[0].endDate)}</p>
                  <SnanDates event={yatras[0]} />
                  <span className="cg-btn cg-btn-white mt-5">Book lodging, food and transport</span>
                </Link>
              )}
              <ul className="grid gap-6 sm:grid-cols-2">
                {yatras.filter((e) => !e.isFlagship).map((e) => <YatraCard key={e._id} event={e} />)}
              </ul>
            </>
          ) : (
            <Notice>{q ? `No yatras found matching "${rawQ}".` : 'No yatras are open right now.'}</Notice>
          )
        ) : active.id === 'public' ? (
          <>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Category">
              {[{ k: '', label: 'All' }, ...chips].map(({ k, label, n }) => (
                <button
                  key={k || 'all'}
                  type="button"
                  aria-pressed={category === k}
                  onClick={() => setParams(withQ(k ? { tab: 'public', category: k } : { tab: 'public' }))}
                  className={`pill min-h-11 gap-1.5 px-4 transition-colors ${category === k ? 'bg-blue text-white' : 'bg-sand text-ink-soft hover:text-ink'}`}
                >
                  {k && <EventCategoryIcon category={k} size={16} />}
                  {label}
                  {k && <span className={`tabular-nums text-sm ${category === k ? 'text-white/80' : 'text-ink-faint'}`}>{n}</span>}
                </button>
              ))}
            </div>
            {publicEvents.length ? (
              <PublicEventList events={publicEvents} from="/events?tab=public" />
            ) : (
              <Notice>
                {q
                  ? `No events found matching "${rawQ}".`
                  : `No ${category ? categoryLabel(category).toLowerCase() + ' ' : ''}events are open right now.`}
              </Notice>
            )}
          </>
        ) : (
          <InvitationCodeBox from="/events?tab=corporate" />
        )}
      </div>
    </div>
  );
}
