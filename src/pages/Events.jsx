import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Briefcase, Flag, Ticket } from 'lucide-react';
import API, { errorMessage } from '../lib/api';
import { EVENT_CATEGORIES, fmtDate } from '../lib/format';
import Notice from '../components/Notice';
import { InvitationCodeBox, PublicEventList, YatraCard } from '../components/EventCards';
import { DEFAULT_EVENTS } from '../data/defaultEvents';
import SnanDates from '../components/SnanDates';
import PageHero from '../components/PageHero';

const TABS = [
  { id: 'yatras', label: 'Yatras & melas', icon: Flag, blurb: 'Large pilgrimages with lodging, food, transport and seva.', kind: 'pilgrimage', tone: 'border-marigold' },
  { id: 'public', label: 'Public events', icon: Ticket, blurb: 'Open to everyone. Register, pay at checkout and get your entry pass.', kind: 'public', tone: 'border-blue' },
  { id: 'corporate', label: 'Campus & Corporate', icon: Briefcase, blurb: 'Invite-only events for students and professionals. Enter the 6-digit code from your host.', kind: 'corporate', tone: 'border-leaf' },
];

/** All events, one tab per type (yatras, public, invite-only). */
export default function Events() {
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
  // A search without a chosen tab opens the tab that has results
  const tabParam = params.get('tab');
  const active =
    TABS.find((t) => t.id === tabParam) ||
    (q ? (publicEvents.length || !yatras.length ? TABS[1] : TABS[0]) : TABS[0]);
  const withQ = (p) => (rawQ ? { ...p, q: rawQ } : p);

  return (
    <div>
      {/* The photo follows the chosen kind of event */}
      <PageHero kind={active.kind} size="sm" title="Events" lead={active.blurb} />
      <div className="shell space-y-6 py-8">
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
              className={`-mb-px flex min-h-12 shrink-0 items-center gap-2 border-b-[3px] px-3 font-semibold transition-colors sm:px-4 ${selected ? `${t.tone} text-ink` : 'border-transparent text-ink-soft hover:text-ink'}`}
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
              <Link to={`/yatra/${yatras[0].slug}`} className="cg-band block rounded-2xl border-l-4 border-l-marigold p-6 sm:p-7">
                <p className="cg-kicker text-saffron-light">Flagship</p>
                <p className="mt-1 font-display text-3xl sm:text-4xl">{yatras[0].title}</p>
                <p className="mt-1 text-blue-mist">{yatras[0].tagline || yatras[0].city}</p>
                <p className="text-blue-mist">{fmtDate(yatras[0].startDate)} to {fmtDate(yatras[0].endDate)}</p>
                <SnanDates event={yatras[0]} />
                <span className="cg-btn cg-btn-white mt-5">Book lodging, food and transport</span>
              </Link>
            )}
            <ul className="grid gap-4 sm:grid-cols-2">
              {yatras.filter((e) => !e.isFlagship).map((e) => <YatraCard key={e._id} event={e} />)}
            </ul>
          </>
        ) : (
          <Notice>{q ? `No yatras found matching "${rawQ}".` : 'No yatras are open right now.'}</Notice>
        )
      ) : active.id === 'public' ? (
        <>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Category">
            {[['', 'All'], ...Object.entries(EVENT_CATEGORIES)].map(([k, v]) => (
              <button
                key={k || 'all'}
                type="button"
                aria-pressed={category === k}
                onClick={() => setParams(withQ(k ? { tab: 'public', category: k } : { tab: 'public' }))}
                className={`pill min-h-11 px-4 transition-colors ${category === k ? 'bg-blue text-white' : 'bg-sand text-ink-soft hover:text-ink'}`}
              >
                {v}
              </button>
            ))}
          </div>
          {publicEvents.length ? (
            <PublicEventList events={publicEvents} from="/events?tab=public" />
          ) : (
            <Notice>
              {q
                ? `No events found matching "${rawQ}".`
                : `No ${category ? EVENT_CATEGORIES[category].toLowerCase() + ' ' : ''}events are open right now.`}
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
