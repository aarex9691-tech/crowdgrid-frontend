import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ambulance, Droplets, Footprints, MapPin, Toilet, Waves } from 'lucide-react';
import API, { errorMessage } from '../../lib/api';
import { cachePass } from '../../lib/passCache';
import Notice, { Loading } from '../../components/Notice';
import PassCard from '../../components/PassCard';
import useLoginGate from './useLoginGate';

const CHECKPOINT_ICON = { STOP: MapPin, WATER: Droplets, TOILET: Toilet, AMBULANCE: Ambulance, GHAT: Waves };
const CHECKPOINT_LABEL = { STOP: 'Stop', WATER: 'Drinking water', TOILET: 'Bio-toilets', AMBULANCE: 'Ambulance halt', GHAT: 'Ghat' };

function Checkpoints({ points }) {
  return (
    <ol className="relative mt-4 space-y-3 border-l-2 border-dashed border-line pl-5">
      {points.map((p) => {
        const Icon = CHECKPOINT_ICON[p.type] || MapPin;
        return (
          <li key={p.name} className="relative">
            <span className="absolute -left-[31px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-line bg-white">
              <Icon size={14} aria-hidden />
            </span>
            <span className="font-medium">{p.name}</span>
            <span className="text-sm text-ink-soft"> · {CHECKPOINT_LABEL[p.type]}</span>
            {p.lat && (
              <a className="ml-2 text-sm font-semibold underline" href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`} target="_blank" rel="noreferrer">
                Map
              </a>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default function TransitTab({ event }) {
  const gate = useLoginGate();
  const [routes, setRoutes] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const [issued, setIssued] = useState(null);

  useEffect(() => {
    API.get('/transit', { params: { eventId: event._id } })
      .then(({ data }) => setRoutes(data))
      .catch((e) => setError(errorMessage(e)));
  }, [event._id]);

  const getPass = async (route) => {
    if (!gate()) return;
    setBusy(route._id);
    setError('');
    try {
      const { data } = await API.post(`/transit/${route._id}/pass`);
      cachePass(data.pass);
      setIssued(data.pass);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  if (issued) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <Notice tone="success">Boarding pass ready for today.</Notice>
        <PassCard pass={issued} />
        <div className="flex flex-wrap gap-3">
          <Link to="/passbook" className="btn-ink">Open my passbook</Link>
          <button type="button" className="btn-ghost" onClick={() => setIssued(null)}>Back to routes</button>
        </div>
      </div>
    );
  }

  if (!routes) return error ? <Notice tone="error">{error}</Notice> : <Loading label="Loading shuttle schedule" />;
  const shuttles = routes.filter((r) => r.kind === 'SHUTTLE');
  const processions = routes.filter((r) => r.kind === 'PROCESSION');

  return (
    <div className="space-y-8">
      <Notice tone="error">{error}</Notice>
      <section>
        <h2 className="text-2xl font-bold">Shuttle schedule</h2>
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {shuttles.map((r) => (
            <li key={r._id} className="panel flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xl font-bold">{r.name}</h3>
                <span className={r.fare ? 'pill-quiet' : 'pill-ok'}>{r.fare ? `₹${r.fare}` : 'Free seva'}</span>
              </div>
              <p className="text-lg">
                {r.origin} to <strong>{r.destination}</strong>
              </p>
              <p className="text-ink-soft">
                {r.vehicleType} · every {r.frequencyMins} min · {r.firstDeparture} to {r.lastDeparture}
              </p>
              <p className="text-ink-soft">Board at {r.boardingGate}</p>
              <Checkpoints points={r.checkpoints} />
              <button type="button" className="btn-primary mt-5 self-start" disabled={busy === r._id} onClick={() => getPass(r)}>
                {busy === r._id ? 'Preparing…' : 'Get boarding pass'}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {processions.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Footprints aria-hidden /> Walking procession routes
          </h2>
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {processions.map((r) => (
              <li key={r._id} className="panel p-5">
                <h3 className="text-xl font-bold">{r.name}</h3>
                <p className="text-ink-soft">{r.origin} to {r.destination}</p>
                <Checkpoints points={r.checkpoints} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
