import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Briefcase, Flag, Ticket } from 'lucide-react';
import API, { errorMessage } from '../lib/api';
import { EVENT_CATEGORIES, fmtDate } from '../lib/format';
import Notice from '../components/Notice';
import { InvitationCodeBox, PublicEventList, YatraCard } from '../components/EventCards';
import { DEFAULT_EVENTS } from '../data/defaultEvents';
import SnanDates from '../components/SnanDates';

const TABS = [
  { id: 'yatras', label: 'Yatras & melas', icon: Flag, blurb: 'Large pilgrimages with lodging, food, transport and seva.' },
  { id: 'public', label: 'Public events', icon: Ticket, blurb: 'Open to everyone. Register, pay at checkout and get your entry pass.' },
  { id: 'corporate', label: 'Campus & Corporate', icon: Briefcase, blurb: 'Invite-only events for students and professionals: college fests, seminars, workshops, conferences and company summits. Enter the code from your invitation.' },
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
    <div className="shell space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold">Events</h1>
        <p className="text-ink-soft">Choose the kind of event you are looking for.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Event types">
        {TABS.map((t) => {
          const selected = t.id === active.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setParams(withQ({ tab: t.id }))}
              className={`flex min-h-12 shrink-0 items-center gap-2 rounded-xl px-4 font-semibold ${selected ? 'bg-blue text-white' : 'border border-line bg-white text-ink-soft hover:text-ink'}`}
            >
              <t.icon size={18} aria-hidden /> {t.label}
              {counts[t.id] !== undefined && events && (
                <span className={`rounded-full px-2 text-sm ${selected ? 'bg-white/20' : 'bg-mist'}`}>{counts[t.id]}</span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-ink-soft" role="note">{active.blurb}</p>
      {rawQ && (
        <p className="flex flex-wrap items-center gap-2 text-ink-soft">
          Results for <b className="text-ink">“{rawQ}”</b>
          <button type="button" className="font-bold text-ink underline" onClick={() => setParams(tabParam ? { tab: tabParam } : {})}>Clear search</button>
        </p>
      )}

      {error && (
        <div className="rounded-xl bg-marigold-wash p-3 text-xs sm:text-sm text-marigold-deep">
          Can't reach the server right now (it may be waking up). Showing the published schedule; booking works once it connects. Retrying…
        </div>
      )}

      {active.id === 'yatras' ? (
        yatras.length ? (
          <>
            {yatras[0]?.isFlagship && (
              <Link to={`/yatra/${yatras[0].slug}`} className="cg-band block overflow-hidden rounded-3xl p-6 hover:bg-blue-deep">
                <p className="cg-kicker text-saffron-light">Flagship</p>
                <p className="font-display text-3xl">{yatras[0].title}</p>
                <p className="text-blue-mist">{yatras[0].tagline || yatras[0].city} · {fmtDate(yatras[0].startDate)} to {fmtDate(yatras[0].endDate)}</p>
                <SnanDates event={yatras[0]} />
                <p className="mt-2 text-sm text-blue-mist">Book lodging, food and transport</p>
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
                className={category === k ? 'btn-ink min-h-10 px-3' : 'btn-ghost min-h-10 px-3'}
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
  );
}
