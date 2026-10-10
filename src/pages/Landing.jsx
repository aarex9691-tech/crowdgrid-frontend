import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BedDouble, BusFront, HandHeart, KeyRound, MapPin, Siren, UtensilsCrossed, Users } from 'lucide-react';
import API, { errorMessage } from '../lib/api';
import { useAuth } from '../lib/auth';
import { cachePass } from '../lib/passCache';
import { compactNumber, fmtDate, fmtDateTime } from '../lib/format';
import Notice, { Loading } from '../components/Notice';

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

function PublicEventRow({ event, onRsvp, busy }) {
  const left = Math.max(0, (event.capacity || 0) - (event.attendeesCount || 0));
  return (
    <li className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="flex-1">
        <h3 className="text-lg font-bold">{event.title}</h3>
        <p className="text-ink-soft">
          {event.venue}, {event.city} · {fmtDateTime(event.startDate)}
        </p>
        <p className="mt-1 text-[15px] text-ink-soft">{event.description}</p>
      </div>
      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
        <span className={left === 0 ? 'pill-out' : left <= 5 ? 'pill-low' : 'pill-ok'}>{left === 0 ? 'Full' : `${left} places left`}</span>
        <button type="button" className="btn-ink" disabled={busy || left === 0} onClick={() => onRsvp(event)}>
          {busy ? 'Registering…' : 'RSVP now'}
        </button>
      </div>
    </li>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);

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
      corporate: list.filter((e) => e.kind === 'CORPORATE'),
    };
  }, [events]);

  const rsvp = async (event) => {
    if (!user) return navigate('/login', { state: { from: '/' } });
    setBusyId(event._id);
    setNotice(null);
    try {
      const { data } = await API.post(`/events/${event._id}/rsvp`);
      cachePass(data.pass);
      setNotice({ tone: 'success', text: `You're registered for ${event.title}. Your entry pass is in your passbook.` });
      load();
    } catch (e) {
      setNotice({ tone: 'error', text: errorMessage(e) });
    } finally {
      setBusyId(null);
    }
  };

  if (error) return <div className="shell py-10"><Notice tone="error">{error}</Notice></div>;
  if (!events) return <Loading label="Loading yatras" />;

  return (
    <div className="shell space-y-12 py-6">
      {groups.flagship && <Hero event={groups.flagship} />}

      {groups.yatras.length > 0 && (
        <section aria-labelledby="yatras">
          <h2 id="yatras" className="text-2xl font-bold">More yatras</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {groups.yatras.map((e) => (
              <li key={e._id} className="panel flex flex-col p-5">
                <h3 className="text-xl font-bold">{e.title}</h3>
                <p className="text-ink-soft">{e.tagline}</p>
                <p className="mt-2 text-[15px]">
                  {fmtDate(e.startDate, { year: undefined })} to {fmtDate(e.endDate)}
                </p>
                <p className="text-[15px] text-ink-soft">
                  {e.stats?.verifiedProviders ? `${e.stats.verifiedProviders} verified seva camps` : 'Seva camps open closer to the date'}
                </p>
                <Link to={`/yatra/${e.slug}`} className="btn-ghost mt-4 self-start">
                  Explore services
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {groups.publicEvents.length > 0 && (
        <section aria-labelledby="public">
          <h2 id="public" className="text-2xl font-bold">Public events near the mela</h2>
          <p className="text-ink-soft">Open to everyone. RSVP to get an entry pass.</p>
          {notice && <Notice tone={notice.tone} className="mt-4">{notice.text}</Notice>}
          <ul className="mt-4 space-y-3">
            {groups.publicEvents.map((e) => (
              <PublicEventRow key={e._id} event={e} onRsvp={rsvp} busy={busyId === e._id} />
            ))}
          </ul>
        </section>
      )}

      {groups.corporate.length > 0 && (
        <section aria-labelledby="corporate">
          <h2 id="corporate" className="text-2xl font-bold">Invitations</h2>
          <p className="text-ink-soft">Corporate and partner events. You need the access code from your invitation.</p>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {groups.corporate.map((e) => (
              <li key={e._id} className="panel p-5">
                <p className="text-ink-soft">{e.companyName}</p>
                <h3 className="text-lg font-bold">{e.title}</h3>
                <p className="text-[15px] text-ink-soft">
                  {e.venue} · {fmtDateTime(e.startDate)}
                </p>
                <Link to={`/corporate/${e.slug}`} className="btn-ghost mt-4">
                  <KeyRound size={18} aria-hidden /> Enter access code
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
