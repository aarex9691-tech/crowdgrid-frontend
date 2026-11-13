import { useCallback, useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import API, { errorMessage } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useLive } from '../lib/realtime';
import Notice from './Notice';
import { useCelebrate } from './SuccessSplash';

/*
 * Volunteer's own duty, on their home screen (the scanner): where and when, a check-in button
 * from 30 minutes before the shift, an end-duty button while on duty, and the latest messages
 * from the control room. Renders nothing for other roles.
 */
const time = (d) => new Date(d).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
const day = (d) => new Date(d).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short' });
const ago = (d) => {
  const m = Math.round((Date.now() - new Date(d)) / 60000);
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
};

export default function MyDutyCard() {
  const { user } = useAuth();
  const celebrate = useCelebrate();
  const isVolunteer = user?.role === 'VOLUNTEER';
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (!isVolunteer) return;
    API.get('/volunteer/my-duty')
      .then(({ data: d }) => {
        setData(d);
        setError('');
      })
      .catch((e) => setError(errorMessage(e)));
  }, [isVolunteer]);
  useEffect(() => {
    load();
    const t = setInterval(load, 60000); // check-in opens on the clock
    return () => clearInterval(t);
  }, [load]);
  useLive(['duty', 'volunteer-broadcast'], load, { wait: 400, enabled: isVolunteer });

  if (!isVolunteer) return null;
  // first load failed (weak signal): say so instead of showing nothing
  if (!data) return error ? <Notice tone="error">Could not load your duty: {error}</Notice> : null;
  const [duty, ...later] = data.duties || [];
  const broadcasts = data.broadcasts || [];

  const act = async (kind) => {
    setBusy(true);
    setError('');
    try {
      await API.post(`/volunteer/duties/${duty.id}/${kind}`);
      celebrate(kind === 'check-in'
        ? { title: 'You are on duty', line: `${duty.sector}${duty.post ? ` · ${duty.post}` : ''}` }
        : { tone: 'cancel', title: 'Duty ended', line: 'Thank you for your seva.' });
      load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="my-duty" className="panel overflow-hidden">
      <div className="p-4">
        <h2 id="my-duty" className="flex flex-wrap items-center justify-between gap-2 text-xl font-bold">
          My duty
          {duty && <span className={duty.status === 'ON_DUTY' ? 'pill-ok' : 'pill bg-blue-wash text-blue'}>{duty.status === 'ON_DUTY' ? 'On duty' : 'Upcoming'}</span>}
        </h2>
        <Notice tone="error" className="mt-2">{error}</Notice>
        {duty ? (
          <div className="mt-2">
            <p className="text-lg font-semibold">{duty.sector}{duty.post ? ` · ${duty.post}` : ''}</p>
            <p className="tabular-nums text-ink-soft">{day(duty.start)}, {time(duty.start)} to {time(duty.end)}{duty.event ? ` · ${duty.event}` : ''}</p>
            {duty.status === 'ON_DUTY' ? (
              <button type="button" className="btn-ghost mt-3 w-full" onClick={() => act('check-out')} disabled={busy}>End my duty</button>
            ) : duty.canCheckIn ? (
              <button type="button" className="btn-primary mt-3 w-full" onClick={() => act('check-in')} disabled={busy}>Check in at {duty.sector.split(' - ').pop()}</button>
            ) : (
              <p className="mt-3 rounded-xl bg-mist px-3 py-2 text-sm text-ink-soft">Check-in opens at {time(new Date(new Date(duty.start) - 30 * 60000))}, 30 minutes before your shift.</p>
            )}
            {later.length > 0 && <p className="mt-2 text-sm text-ink-soft">Next: {later.map((d) => `${day(d.start)} ${time(d.start)}, ${d.sector}`).join(' · ')}</p>}
          </div>
        ) : (
          <p className="mt-1 text-ink-soft">No shift assigned yet. The control room will put you on a post.</p>
        )}
      </div>
      {broadcasts.length > 0 && (
        <div className="border-t border-line bg-mist/60 p-4">
          <h3 className="flex items-center gap-2 font-bold"><Megaphone size={17} aria-hidden /> From the control room</h3>
          <ul className="mt-1.5 space-y-2">
            {broadcasts.map((b, i) => (
              <li key={b._id} className={i === 0 ? 'font-semibold' : 'text-ink-soft'}>
                {b.message} <span className="text-sm font-normal text-ink-soft">· {b.sector || 'everyone'} · {ago(b.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
