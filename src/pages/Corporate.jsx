import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Coffee, Presentation } from 'lucide-react';
import API, { errorMessage } from '../lib/api';
import { cachePass } from '../lib/passCache';
import { fmtDateTime } from '../lib/format';
import Notice, { Loading } from '../components/Notice';
import PassCard from '../components/PassCard';
import useLoginGate from './hub/useLoginGate';

/** Corporate path: access code -> session checklist -> digital badge. */
export default function Corporate() {
  const { slug } = useParams();
  const gate = useLoginGate();
  const [event, setEvent] = useState(null);
  const [params] = useSearchParams();
  const invitedCode = (params.get('code') || '').replace(/\D/g, '').slice(0, 6);
  const [code, setCode] = useState(invitedCode);
  const [sessions, setSessions] = useState(null);
  const [chosen, setChosen] = useState([]);
  const [badge, setBadge] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    API.get(`/events/${slug}`).then(({ data }) => setEvent(data)).catch((e) => setError(errorMessage(e)));
  }, [slug]);

  const verify = async (e) => {
    e.preventDefault();
    if (!gate()) return;
    setBusy(true);
    setError('');
    try {
      const { data } = await API.post(`/events/${event._id}/corporate/verify`, { code });
      setSessions(data.sessions);
      setChosen(data.sessions.map((s) => s.code));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const claim = async () => {
    setBusy(true);
    setError('');
    try {
      const { data } = await API.post(`/events/${event._id}/corporate/badge`, { code, sessions: chosen });
      cachePass(data.pass);
      setBadge(data.pass);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!event) return error ? <div className="shell py-10"><Notice tone="error">{error}</Notice></div> : <Loading />;

  return (
    <div className="shell max-w-xl space-y-5 py-8">
      <div>
        <p className="text-ink-soft">{event.companyName}</p>
        <h1 className="text-3xl font-bold">{event.title}</h1>
        <p className="text-ink-soft">{event.venue}, {event.city} · {fmtDateTime(event.startDate)}</p>
      </div>
      <Notice tone="error">{error}</Notice>

      {badge ? (
        <>
          <Notice tone="success">Your delegate badge is ready. Show it at the registration desk.</Notice>
          <PassCard pass={badge} />
          <Link to="/passbook" className="btn-ink">Open my passbook</Link>
        </>
      ) : !sessions ? (
        <form onSubmit={verify} className="panel space-y-4 p-6">
          <label htmlFor="code" className="field-label">6-digit access code from your invitation</label>
          {invitedCode && <p className="text-sm text-tulsi">Filled in from your invitation link. Tap Verify code to continue.</p>}
          <input
            id="code"
            className="field text-center text-2xl tracking-[0.4em]"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            pattern="\d{6}"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            required
          />
          <button type="submit" className="btn-primary w-full" disabled={busy || code.length !== 6}>
            {busy ? 'Checking…' : 'Verify code'}
          </button>
        </form>
      ) : (
        <div className="panel space-y-4 p-6">
          <h2 className="text-xl font-bold">Choose your sessions</h2>
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li key={s.code}>
                <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-line p-3">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-ink"
                    checked={chosen.includes(s.code)}
                    onChange={() => setChosen((c) => (c.includes(s.code) ? c.filter((x) => x !== s.code) : [...c, s.code]))}
                  />
                  {s.kind === 'MEAL' ? <Coffee size={20} aria-hidden /> : <Presentation size={20} aria-hidden />}
                  <span className="flex-1 font-medium">{s.title}</span>
                  <span className="text-ink-soft">{s.time}</span>
                </label>
              </li>
            ))}
          </ul>
          <button type="button" className="btn-primary w-full" disabled={busy || chosen.length === 0} onClick={claim}>
            {busy ? 'Issuing…' : 'Claim digital badge'}
          </button>
        </div>
      )}
    </div>
  );
}
