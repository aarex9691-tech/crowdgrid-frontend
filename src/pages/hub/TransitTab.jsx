import { useT } from '../../lib/i18n';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ambulance, Droplets, Footprints, MapPin, Toilet, Waves } from 'lucide-react';
import API, { errorMessage } from '../../lib/api';
import { cachePass } from '../../lib/passCache';
import { rupees, useCart } from '../../lib/cart';
import { fmtDate, todayIST } from '../../lib/format';
import Notice, { Loading } from '../../components/Notice';
import PassCard from '../../components/PassCard';
import PeopleStepper from '../../components/PeopleStepper';
import useLoginGate from './useLoginGate';
import { canBook, useAuth } from '../../lib/auth';

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
  const t = useT();
  const { user } = useAuth();
  const staff = !canBook(user);
  const [loaded, setLoaded] = useState({ day: null, routes: null }); // routes and the day they were read for
  const routes = loaded.routes;
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const [issued, setIssued] = useState(null);
  const [added, setAdded] = useState(null);
  const cart = useCart();
  // Travel day: any day of the yatra from today; before the yatra starts this is a pre-booking
  const ist = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(d));
  const today = todayIST();
  const start = ist(event.startDate);
  const end = ist(event.endDate);
  const firstDay = start > today ? start : today;
  const [day, setDay] = useState(firstDay);
  const prebooking = !!routes?.some((r) => r.prebooking);
  const stale = loaded.day !== day; // seats on screen are for another day until the new answer arrives

  useEffect(() => {
    // Only the answer for the day still chosen is shown (quick day changes can answer out of order)
    let live = true;
    setError('');
    API.get('/transit', { params: { eventId: event._id, date: day } })
      .then(({ data }) => live && setLoaded({ day, routes: data }))
      .catch((e) => live && setError(errorMessage(e)));
    return () => {
      live = false;
    };
  }, [event._id, day]);

  const [people, setPeople] = useState({}); // route id -> how many travel on the pass
  const peopleFor = (id) => people[id] || 1;

  const getPass = async (route) => {
    if (!gate()) return;
    const n = peopleFor(route._id);
    if (route.fare > 0) {
      cart.add({
        key: `TRANSIT:${route._id}:${day}`,
        kind: 'TRANSIT',
        refId: route._id,
        label: route.name,
        detail: `${prebooking ? 'Pre-booked day pass' : 'Day pass'} for ${fmtDate(`${day}T12:00:00+05:30`)}${n > 1 ? ` for ${n} people` : ''} · ${route.origin} to ${route.destination}`,
        estimate: route.fare * n,
        input: { people: n, date: day },
      });
      setAdded(route);
      return;
    }
    setBusy(route._id);
    setError('');
    try {
      const { data } = await API.post(`/transit/${route._id}/pass`, { people: n, date: day });
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
        <Notice tone="success">
          {issued.details?.prebooked ? 'Pre-booked' : 'Boarding pass ready'} for {issued.details?.date ? fmtDate(`${issued.details.date}T12:00:00+05:30`) : 'today'}
          {issued.details?.people > 1 ? ` for ${issued.details.people} people` : ''}. It opens for scanning on that day.
        </Notice>
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
  const closed = shuttles.find((r) => r.closed)?.closed;

  return (
    <div className="space-y-8">
      <Notice tone="error">{error}</Notice>
      {added && (
        <Notice tone="success">
          {added.name} day pass is in your cart. <Link to="/checkout" className="font-bold underline">Go to checkout</Link> to pay.
        </Notice>
      )}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-2xl font-bold">{t('transit.schedule')}</h2>
          {!staff && !closed && shuttles.length > 0 && (
            <div>
              <label className="field-label" htmlFor="travel-day">
                Travel day {prebooking && <span className="pill-quiet ml-1">Pre-booking</span>}
              </label>
              <input id="travel-day" type="date" className="field" min={firstDay} max={end} value={day} onChange={(e) => e.target.value && setDay(e.target.value)} required />
            </div>
          )}
        </div>
        {closed && <Notice className="mt-3">{closed}</Notice>}
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {shuttles.map((r) => (
            <li key={r._id} className="panel flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xl font-bold">{r.name}</h3>
                <span className={r.fare ? 'pill-quiet' : 'pill-ok'}>{r.fare ? `₹${r.fare}` : t('transit.freeSeva')}</span>
              </div>
              <p className="text-lg">
                {r.origin} to <strong>{r.destination}</strong>
              </p>
              <p className="text-ink-soft">
                {r.vehicleType} · every {r.frequencyMins} min · {r.firstDeparture} to {r.lastDeparture}
              </p>
              <p className="text-ink-soft">{t('transit.boardAt', { gate: r.boardingGate })}</p>
              {stale ? (
                <p className="mt-1 text-ink-soft">Checking seats for this day…</p>
              ) : typeof r.seatsLeft === 'number' && (
                <p className="mt-1">
                  {r.seatsLeft === 0 ? (
                    <span className="pill-out">{t('transit.full', { day: r.travelDay })}</span>
                  ) : r.seatsLeft <= 20 ? (
                    <span className="pill-low">{t('transit.onlySeats', { n: r.seatsLeft, day: r.travelDay })}</span>
                  ) : (
                    <span className="pill-ok">{t('transit.seatsLeft', { n: r.seatsLeft.toLocaleString('en-IN'), day: r.travelDay })}</span>
                  )}
                </p>
              )}
              <Checkpoints points={r.checkpoints} />
              {!staff && (
                <div className="mt-5 flex flex-wrap items-end gap-4">
                  <PeopleStepper id={`tp-${r._id}`} label={t('transit.travelling')} value={peopleFor(r._id)} onChange={(v) => setPeople((p) => ({ ...p, [r._id]: v }))} hint="One pass for up to 5 people" />
                  <button type="button" className="btn-primary" disabled={stale || busy === r._id || r.seatsLeft === 0 || (typeof r.seatsLeft === 'number' && peopleFor(r._id) > r.seatsLeft)} onClick={() => getPass(r)}>
                    {busy === r._id ? t('transit.preparing') : r.fare > 0 ? t('lodging.addToCart', { amount: rupees(r.fare * peopleFor(r._id)) }) : t('transit.getPass')}
                  </button>
                </div>
              )}
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
