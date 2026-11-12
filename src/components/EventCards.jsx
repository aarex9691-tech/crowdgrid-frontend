import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, KeyRound, MapPin } from 'lucide-react';
import API, { errorMessage } from '../lib/api';
import { canBook, useAuth } from '../lib/auth';
import { cachePass } from '../lib/passCache';
import { rupees, useCart } from '../lib/cart';
import { EVENT_CATEGORIES, fmtDate, fmtDateTime, fmtTime } from '../lib/format';
import Notice from './Notice';

export function YatraCard({ event }) {
  return (
    <li>
      <Link
        to={`/yatra/${event.slug}`}
        className="group panel flex flex-col border-l-[6px] border-l-marigold p-6 sm:p-7 md:p-8 shadow-xs transition-all duration-200 hover:shadow-lg hover:border-l-terracotta hover:-translate-y-0.5 block focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta h-full"
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-marigold-wash px-3.5 py-1 text-xs sm:text-sm font-bold text-marigold-deep border border-marigold/20">
            <CalendarDays size={14} className="text-marigold-deep" aria-hidden />
            {fmtDate(event.startDate, { year: undefined })} to {fmtDate(event.endDate)}
          </span>
        </div>
        <h3 className="font-display mt-3 text-2xl sm:text-[1.75rem] font-bold leading-snug tracking-tight text-ink group-hover:text-terracotta transition-colors">
          {event.title}
        </h3>
        <p className="mt-2 text-base sm:text-lg leading-relaxed text-ink-soft">
          {event.tagline}
        </p>
        <p className="mt-4 flex items-center gap-2 text-sm sm:text-base text-ink-soft font-medium">
          <MapPin size={18} className="shrink-0 text-terracotta" aria-hidden />
          {event.stats?.verifiedProviders ? `${event.stats.verifiedProviders} verified seva camps` : 'Seva camps open closer to the date'}
        </p>
      </Link>
    </li>
  );
}

/** Add tickets (1 to 5 people, one pass) for a paid public event to the cart. */
export const addTicketToCart = (cart, event, people = 1) =>
  cart.add({
    key: `EVENT:${event._id}`,
    kind: 'EVENT',
    refId: event._id,
    label: event.title,
    detail: `${people} ${people === 1 ? 'ticket' : 'tickets'} · ${fmtDateTime(event.startDate)} · ${event.venue}`,
    estimate: (event.ticketPrice || 0) * people,
    input: { people },
  });

export const placesLeft = (e) => Math.max(0, (e.capacity || 0) - (e.attendeesCount || 0));

// One part of a date, in IST: the day number, the short month, or the short weekday
const datePart = (d, part) =>
  fmtDate(d, { day: undefined, month: undefined, year: undefined, ...part });

function PublicEventCard({ event, onRegister, showRegister, large = false }) {
  const left = placesLeft(event);
  return (
    <li className="panel flex flex-col overflow-hidden transition-colors hover:border-ink-faint">
      <div className={`flex flex-1 gap-4 p-4 ${large ? 'sm:gap-5 sm:p-7' : 'sm:p-5'}`}>
        {/* Calendar leaf: the date is the first thing people look for */}
        <p className="flex w-16 shrink-0 flex-col items-center self-start rounded-xl bg-blue-wash py-2 text-blue" aria-label={fmtDate(event.startDate, { weekday: 'long' })}>
          <span className="text-xs font-bold" aria-hidden>{datePart(event.startDate, { weekday: 'short' })}</span>
          <span className="font-display text-3xl leading-none" aria-hidden>{datePart(event.startDate, { day: 'numeric' })}</span>
          <span className="text-xs font-bold" aria-hidden>{datePart(event.startDate, { month: 'short' })}</span>
        </p>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <span className="text-sm font-semibold text-blue">{EVENT_CATEGORIES[event.category] || 'Event'}</span>
            <span className={left === 0 ? 'pill-out' : left <= 5 ? 'pill-low' : 'pill-ok'}>
              {left === 0 ? 'Sold out' : `${left} left`}
            </span>
          </div>
          <h3 className={`mt-1 line-clamp-2 font-bold leading-snug ${large ? 'text-xl sm:text-2xl' : 'text-lg'}`}>{event.title}</h3>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-soft">
            <MapPin size={15} className="shrink-0" aria-hidden />
            <span className="truncate">{event.venue}, {event.city}</span>
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-soft">
            <CalendarDays size={15} className="shrink-0" aria-hidden /> {fmtTime(event.startDate)}
          </p>
        </div>
      </div>

      <div className={`flex items-center justify-between gap-3 border-t border-line bg-mist px-4 ${large ? 'py-4 sm:px-7' : 'py-3 sm:px-5'}`}>
        {event.ticketPrice > 0 ? (
          <p className="text-xl font-extrabold">{rupees(event.ticketPrice)}</p>
        ) : (
          <p className="text-xl font-extrabold text-tulsi">Free</p>
        )}
        <div className="flex gap-2">
          <Link to={`/event/${event.slug}`} className="btn-ghost min-h-11 px-3 text-sm">
            Details
          </Link>
          {showRegister && (
            <button
              type="button"
              className="btn-primary min-h-11 px-4 text-sm"
              disabled={left === 0}
              onClick={() => onRegister(event)}
            >
              Register
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

/** Paid public events. Register adds a ticket to the cart; payment at checkout. */
export function PublicEventList({ events = [], from = '/', emptyMessage, large = false }) {
  const { user } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const [added, setAdded] = useState(null);
  const [freeMsg, setFreeMsg] = useState(null);

  const register = async (event) => {
    if (!user) return navigate('/login', { state: { from } });
    setFreeMsg(null);
    if (!(event.ticketPrice > 0)) {
      // Free entry: confirmed straight away, no cart or payment
      try {
        const { data } = await API.post(`/events/${event._id}/register`);
        cachePass(data.pass);
        setFreeMsg({ tone: 'success', text: `You're registered for ${event.title}. Your entry pass is in your passbook.` });
      } catch (e) {
        setFreeMsg({ tone: 'error', text: errorMessage(e) });
      }
      return;
    }
    addTicketToCart(cart, event);
    setAdded(event);
  };

  return (
    <>
      {freeMsg && <Notice tone={freeMsg.tone} className="mt-4">{freeMsg.text}</Notice>}
      {added && (
        <Notice tone="success" className="mt-4">
          Ticket for {added.title} is in your cart. <Link to="/checkout" className="font-bold underline">Go to checkout</Link> to pay and get your entry pass.
        </Notice>
      )}
      {events.length === 0 ? (
        <Notice className="mt-4">{emptyMessage || 'No events available right now.'}</Notice>
      ) : (
        <ul className={`mt-4 grid ${large ? 'gap-5 sm:grid-cols-2 xl:grid-cols-3' : 'gap-4 sm:grid-cols-2 lg:grid-cols-3'}`}>
          {events.map((e) => (
            <PublicEventCard key={e._id} event={e} onRegister={register} showRegister={canBook(user)} large={large} />
          ))}
        </ul>
      )}
    </>
  );
}

/** Invite-only corporate events are never listed; invitees enter their code here. */
export function InvitationCodeBox({ from = '/' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login', { state: { from } });
    setBusy(true);
    setError('');
    try {
      const { data } = await API.post('/events/corporate/redeem', { code });
      navigate(`/corporate/${data.slug}?code=${code}`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="invite" className="panel flex flex-col gap-4 border-l-4 border-l-leaf p-5 sm:p-6 md:flex-row md:items-center">
      <div className="flex-1">
        <h2 id="invite" className="flex items-center gap-2 text-xl font-bold">
          <KeyRound size={20} className="text-tulsi" aria-hidden /> Have an invitation code?
        </h2>
        <p className="mt-1 text-ink-soft">Campus and corporate events are invite-only. Enter the 6-digit code from your host to claim your badge.</p>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-2 md:w-80">
        <div className="flex gap-2">
          <label htmlFor="invite-code" className="sr-only">Invitation code</label>
          <input
            id="invite-code"
            className="field text-center text-xl tracking-[0.3em]"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
          <button type="submit" className="btn-ink shrink-0" disabled={busy || code.length !== 6}>
            {busy ? 'Checking…' : 'Continue'}
          </button>
        </div>
        {error && <p className="text-sm font-semibold text-kumkum" role="alert">{error}</p>}
      </form>
    </section>
  );
}
