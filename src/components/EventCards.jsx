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
    <li className="panel flex flex-col p-5">
      <h3 className="text-xl font-bold">{event.title}</h3>
      <p className="text-ink-soft">{event.tagline}</p>
      <p className="mt-2 text-[15px]">
        {fmtDate(event.startDate, { year: undefined })} to {fmtDate(event.endDate)}
      </p>
      <p className="text-[15px] text-ink-soft">
        {event.stats?.verifiedProviders ? `${event.stats.verifiedProviders} verified seva camps` : 'Seva camps open closer to the date'}
      </p>
      <Link to={`/yatra/${event.slug}`} className="btn-ghost mt-4 self-start">
        Explore services
      </Link>
    </li>
  );
}

/** Add one ticket for a paid public event to the cart. */
export const addTicketToCart = (cart, event) =>
  cart.add({
    key: `EVENT:${event._id}`,
    kind: 'EVENT',
    refId: event._id,
    label: event.title,
    detail: `1 ticket · ${fmtDateTime(event.startDate)} · ${event.venue}`,
    estimate: event.ticketPrice || 0,
    input: {},
  });

export const placesLeft = (e) => Math.max(0, (e.capacity || 0) - (e.attendeesCount || 0));

function PublicEventCard({ event, onRegister, showRegister }) {
  const left = placesLeft(event);
  return (
    <li className="panel flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 bg-ink px-4 py-2 text-white">
        <span className="text-sm font-semibold uppercase tracking-wide text-marigold">{EVENT_CATEGORIES[event.category] || 'Event'}</span>
        <span className="text-sm">{fmtDate(event.startDate, { weekday: 'short', year: undefined })}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-lg font-bold leading-snug">{event.title}</h3>
        <p className="flex items-start gap-1.5 text-[15px] text-ink-soft">
          <CalendarDays size={16} className="mt-1 shrink-0" aria-hidden /> {fmtTime(event.startDate)} to {fmtTime(event.endDate)}
        </p>
        <p className="flex items-start gap-1.5 text-[15px] text-ink-soft">
          <MapPin size={16} className="mt-1 shrink-0" aria-hidden /> {event.venue}, {event.city}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
          {event.ticketPrice > 0 ? (
            <span className="text-2xl font-extrabold">{rupees(event.ticketPrice)}<span className="text-sm font-normal text-ink-soft"> / person</span></span>
          ) : (
            <span className="text-2xl font-extrabold text-tulsi">Free</span>
          )}
          <span className={left === 0 ? 'pill-out' : left <= 5 ? 'pill-low' : 'pill-ok'}>{left === 0 ? 'Sold out' : `${left} places left`}</span>
        </div>
        <div className="flex gap-2">
          <Link to={`/event/${event.slug}`} className="btn-ghost flex-1">Details</Link>
          {showRegister && (
            <button type="button" className="btn-primary flex-1" disabled={left === 0} onClick={() => onRegister(event)}>
              Register
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

/** Paid public events. Register adds a ticket to the cart; payment at checkout. */
export function PublicEventList({ events, from = '/' }) {
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
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((e) => (
          <PublicEventCard key={e._id} event={e} onRegister={register} showRegister={canBook(user)} />
        ))}
      </ul>
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
    <section aria-labelledby="invite" className="panel flex flex-col gap-4 p-5 md:flex-row md:items-center">
      <div className="flex-1">
        <h2 id="invite" className="flex items-center gap-2 text-xl font-bold">
          <KeyRound size={20} aria-hidden /> Have an invitation code?
        </h2>
        <p className="text-ink-soft">Campus and corporate events (college fests, seminars, company summits) are invite-only. Enter the 6-digit code from your invitation to claim your badge.</p>
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
