import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, CalendarDays, MapPin, Users } from 'lucide-react';
import API, { errorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { fmtDate } from '../../lib/format';
import Notice, { Loading } from '../../components/Notice';
import { useCelebrate } from '../../components/SuccessSplash';
import useLoginGate from './useLoginGate';

/*
 * Programmes for pilgrims at this yatra: bhandaras, satsangs, free health camps... held by
 * recognised kitchen services and organisations, each approved by the District Control Room.
 * A pilgrim reserves free places (1 to 5) and gets a QR pass in the passbook.
 */

export const PROGRAMME_TYPES = {
  BHANDARA: 'Bhandara (free feast)',
  SATSANG: 'Satsang',
  HEALTH_CAMP: 'Free health camp',
  BHAJAN: 'Bhajan and kirtan',
  CULTURAL: 'Cultural programme',
  OTHER: 'Programme',
};

const dayOf = (d) => fmtDate(`${d}T12:00:00+05:30`, { weekday: 'short', year: undefined });

function Programme({ p, onBooked }) {
  const { user } = useAuth();
  const gate = useLoginGate();
  const celebrate = useCelebrate();
  const [people, setPeople] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const full = p.placesLeft <= 0;
  const canBook = !user || user.role === 'USER';

  const reserve = async () => {
    if (!gate()) return;
    setBusy(true);
    setError('');
    try {
      await API.post(`/programmes/${p._id}/register`, { people });
      celebrate({ title: 'Place reserved', line: 'Your free pass with its QR is in your passbook. Show it at the entrance.' });
      onBooked();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="panel p-5">
      <p className="text-sm font-semibold text-terracotta-dark">{PROGRAMME_TYPES[p.type] || 'Programme'}</p>
      <h3 className="mt-1 text-xl font-bold">{p.title}</h3>
      <p className="mt-1 inline-flex items-center gap-1.5 text-[15px] font-semibold text-blue" data-no-translate>
        <BadgeCheck size={18} aria-hidden /> Organised by {p.organiserName}
      </p>
      <dl className="mt-3 space-y-1 text-[15px]">
        <div className="flex items-start gap-2">
          <dt><CalendarDays size={18} aria-hidden /><span className="sr-only">When</span></dt>
          <dd>{dayOf(p.date)}, {p.startTime} to {p.endTime}</dd>
        </div>
        <div className="flex items-start gap-2">
          <dt><MapPin size={18} aria-hidden /><span className="sr-only">Where</span></dt>
          <dd>{p.venue}{p.sector ? `, ${p.sector}` : ''}</dd>
        </div>
        <div className="flex items-start gap-2">
          <dt><Users size={18} aria-hidden /><span className="sr-only">Places</span></dt>
          <dd>{full ? 'Full' : `${p.placesLeft} of ${p.capacity} free places left`}</dd>
        </div>
      </dl>
      {p.description && <p className="mt-2 text-ink-soft">{p.description}</p>}
      {canBook && !full && (
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <div>
            <label className="field-label" htmlFor={`pp-${p._id}`}>People</label>
            <select id={`pp-${p._id}`} className="field w-24" value={people} onChange={(e) => setPeople(Number(e.target.value))}>
              {[1, 2, 3, 4, 5].filter((n) => n <= p.placesLeft).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <button type="button" className="btn-primary" disabled={busy} onClick={reserve}>
            {busy ? 'Reserving…' : 'Reserve free place'}<span className="sr-only"> at {p.title}</span>
          </button>
        </div>
      )}
      <Notice tone="error" className="mt-3">{error}</Notice>
    </li>
  );
}

export default function ProgrammesTab({ event }) {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    API.get(`/programmes/yatra/${event.slug || event._id}`)
      .then(({ data }) => setList(data))
      .catch((e) => setError(errorMessage(e)));
  }, [event.slug, event._id, tick]);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!list) return <Loading label="Finding programmes" />;
  return (
    <div className="space-y-4">
      <p className="max-w-prose text-ink-soft">
        Held by recognised kitchens and organisations, and approved by the District Control Room. Places are free; your pass appears in <Link to="/passbook" className="font-semibold underline">your passbook</Link>.
      </p>
      {list.length === 0 ? (
        <Notice>No programmes announced yet for the coming days. Check again later.</Notice>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">{list.map((p) => <Programme key={p._id} p={p} onBooked={() => setTick((n) => n + 1)} />)}</ul>
      )}
    </div>
  );
}
