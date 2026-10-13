import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BedDouble, BusFront, HandHeart, MapPin, Siren, UtensilsCrossed, Users } from 'lucide-react';
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

function Hero({ event }) {
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
            <p className="text-[#c9d6ee]">{c.done ? 'The mela has begun' : `Dhwajarohan in`}</p>
            {!c.done && (
              <div className="mt-1 flex items-end gap-4" aria-live="off">
                <span className="text-7xl font-extrabold leading-none tabular-nums text-marigold sm:text-8xl">{c.days}</span>
                <span className="pb-2 text-xl font-semibold">days</span>
                <span className="pb-2 text-xl tabular-nums text-[#c9d6ee]">
                  {String(c.hours).padStart(2, '0')}:{String(c.minutes).padStart(2, '0')}:{String(c.seconds).padStart(2, '0')}
                </span>
              </div>
            )}
            <p className="mt-1 text-[#c9d6ee]">{fmtDate(event.startDate)}</p>
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
    </section>
  );
}

export default function Landing() {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState('');

  const load = () =>
    API.get('/events')
      .then(({ data }) => setEvents(data))
      .catch((e) => setError(errorMessage(e)));
  useEffect(() => {
    load();
  }, []);

  const groups = useMemo(() => {
    const list = events || [];
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
      {groups.flagship && <Hero event={groups.flagship} />}

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
          <p className="text-ink-soft">Open to everyone. RSVP to get an entry pass.</p>
          <PublicEventList events={groups.publicEvents} onChange={load} from="/" />
        </section>
      )}

      <InvitationCodeBox from="/" />
    </div>
  );
}
