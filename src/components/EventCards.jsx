import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import API, { errorMessage } from '../lib/api';
import { useAuth } from '../lib/auth';
import { cachePass } from '../lib/passCache';
import { fmtDate, fmtDateTime } from '../lib/format';
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

/** Public events with RSVP (entry pass). `onChange` reloads the list after an RSVP. */
export function PublicEventList({ events, onChange, from = '/' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const rsvp = async (event) => {
    if (!user) return navigate('/login', { state: { from } });
    setBusyId(event._id);
    setNotice(null);
    try {
      const { data } = await API.post(`/events/${event._id}/rsvp`);
      cachePass(data.pass);
      setNotice({ tone: 'success', text: `You're registered for ${event.title}. Your entry pass is in your passbook.` });
      onChange?.();
    } catch (e) {
      setNotice({ tone: 'error', text: errorMessage(e) });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      {notice && <Notice tone={notice.tone} className="mt-4">{notice.text}</Notice>}
      <ul className="mt-4 space-y-3">
        {events.map((e) => (
          <PublicEventRow key={e._id} event={e} onRsvp={rsvp} busy={busyId === e._id} />
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
        <p className="text-ink-soft">Corporate and partner events are invite-only. Enter the 6-digit code from your invitation to claim your badge.</p>
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
