import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Briefcase, Flag, Ticket } from 'lucide-react';
import API, { errorMessage } from '../lib/api';
import { EVENT_CATEGORIES, fmtDate } from '../lib/format';
import Notice, { Loading } from '../components/Notice';
import { InvitationCodeBox, PublicEventList, YatraCard } from '../components/EventCards';

const TABS = [
  { id: 'yatras', label: 'Yatras & melas', icon: Flag, blurb: 'Large pilgrimages with lodging, food, transit and seva.' },
  { id: 'public', label: 'Public events', icon: Ticket, blurb: 'Open to everyone. Register, pay at checkout and get your entry pass.' },
  { id: 'corporate', label: 'Campus & Corporate', icon: Briefcase, blurb: 'Invite-only events for students and professionals: college fests, seminars, workshops, conferences and company summits. Enter the code from your invitation.' },
];

/** All events, one tab per type (yatras, public, invite-only). */
export default function Events() {
  const [params, setParams] = useSearchParams();
  const active = TABS.find((t) => t.id === params.get('tab')) || TABS[0];
  const [events, setEvents] = useState(null);
  const [error, setError] = useState('');

  const load = () =>
    API.get('/events')
      .then(({ data }) => setEvents(data))
      .catch((e) => setError(errorMessage(e)));
  useEffect(() => {
    load();
  }, []);

  const yatras = useMemo(() => (events || []).filter((e) => e.kind === 'YATRA').sort((a, b) => (b.isFlagship ? 1 : 0) - (a.isFlagship ? 1 : 0)), [events]);
  const category = params.get('category') || '';
  const publicEvents = useMemo(() => (events || []).filter((e) => e.kind === 'PUBLIC' && (!category || e.category === category)), [events, category]);
  const counts = { yatras: yatras.length, public: publicEvents.length };

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
              onClick={() => setParams({ tab: t.id })}
              className={`flex min-h-12 shrink-0 items-center gap-2 rounded-xl px-4 font-semibold ${selected ? 'bg-ink text-white' : 'border border-line bg-white text-ink-soft hover:text-ink'}`}
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

      <Notice tone="error">{error}</Notice>
      {!events && !error ? (
        <Loading label="Loading events" />
      ) : active.id === 'yatras' ? (
        yatras.length ? (
          <>
            {yatras[0]?.isFlagship && (
              <Link to={`/yatra/${yatras[0].slug}`} className="block overflow-hidden rounded-2xl bg-ink p-6 text-white hover:bg-dusk">
                <p className="text-sm uppercase tracking-wide text-marigold">Flagship</p>
                <p className="font-display text-3xl">{yatras[0].title}</p>
                <p className="text-[#c9d6ee]">{fmtDate(yatras[0].startDate)} to {fmtDate(yatras[0].endDate)} · Book lodging, food and transit</p>
              </Link>
            )}
            <ul className="grid gap-4 sm:grid-cols-2">
              {yatras.filter((e) => !e.isFlagship).map((e) => <YatraCard key={e._id} event={e} />)}
            </ul>
          </>
        ) : (
          <Notice>No yatras are open right now.</Notice>
        )
      ) : active.id === 'public' ? (
        <>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Category">
            {[['', 'All'], ...Object.entries(EVENT_CATEGORIES)].map(([k, v]) => (
              <button
                key={k || 'all'}
                type="button"
                aria-pressed={category === k}
                onClick={() => setParams(k ? { tab: 'public', category: k } : { tab: 'public' })}
                className={category === k ? 'btn-ink min-h-10 px-3' : 'btn-ghost min-h-10 px-3'}
              >
                {v}
              </button>
            ))}
          </div>
          {publicEvents.length ? <PublicEventList events={publicEvents} from="/events?tab=public" /> : <Notice>No {category ? EVENT_CATEGORIES[category].toLowerCase() + ' ' : ''}events are open right now.</Notice>}
        </>
      ) : (
        <InvitationCodeBox from="/events?tab=corporate" />
      )}
    </div>
  );
}
