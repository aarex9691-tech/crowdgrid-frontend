import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import API, { errorMessage } from '../../lib/api';
import { cachePass } from '../../lib/passCache';
import { addDaysIST, fmtDate, MEAL_LABELS, todayIST } from '../../lib/format';
import Notice, { Loading } from '../../components/Notice';
import PassCard from '../../components/PassCard';
import useLoginGate from './useLoginGate';
import { canBook, useAuth } from '../../lib/auth';

const MEAL_TIMES = { BREAKFAST: '7 – 9 am', LUNCH: '12 – 3 pm', DINNER: '7 – 10 pm' };

/** Pick the meal that is on now, or the next one today. */
const currentMeal = () => {
  const h = Number(new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false }).format(new Date()));
  if (h < 9) return 'BREAKFAST';
  if (h < 15) return 'LUNCH';
  return 'DINNER';
};

export default function FoodTab({ event }) {
  const gate = useLoginGate();
  const { user } = useAuth();
  const staff = !canBook(user);
  const today = todayIST();
  const [params] = useSearchParams();
  const [date, setDate] = useState(() => (params.get('date') >= today ? params.get('date') : today));
  const [meal, setMeal] = useState(() => (['BREAKFAST', 'LUNCH', 'DINNER'].includes(params.get('meal')) ? params.get('meal') : currentMeal()));
  const [sector, setSector] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busySlot, setBusySlot] = useState(null);
  const [claimed, setClaimed] = useState(null);
  const [people, setPeople] = useState(1);
  const [names, setNames] = useState('');

  const load = useCallback(() => {
    setError('');
    API.get('/food', { params: { eventId: event._id, date, sector: sector || undefined } })
      .then(({ data: d }) => setData(d))
      .catch((e) => setError(errorMessage(e)));
  }, [event._id, date, sector]);

  useEffect(() => {
    load();
  }, [load]);

  const claim = async (slot) => {
    if (!gate()) return;
    setBusySlot(slot._id);
    setError('');
    try {
      const { data: res } = await API.post(`/food/slots/${slot._id}/claim`, { people, names });
      cachePass(res.pass);
      setClaimed(res);
    } catch (e) {
      setError(errorMessage(e));
      load();
    } finally {
      setBusySlot(null);
    }
  };

  if (claimed) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <Notice tone="success">Meal token ready. It works only during its meal window.</Notice>
        <PassCard pass={claimed.pass} />
        <div className="flex flex-wrap gap-3">
          <Link to="/passbook" className="btn-ink">Open my passbook</Link>
          <button type="button" className="btn-ghost" onClick={() => { setClaimed(null); load(); }}>Back to kitchens</button>
        </div>
      </div>
    );
  }

  const days = Array.from({ length: 4 }, (_, i) => addDaysIST(today, i));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Day">
        {days.map((d, i) => (
          <button key={d} type="button" aria-pressed={d === date} onClick={() => setDate(d)} className={d === date ? 'btn-ink' : 'btn-ghost'}>
            {i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : fmtDate(d, { year: undefined, weekday: 'short' })}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Meal window">
        {Object.keys(MEAL_LABELS).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={m === meal}
            onClick={() => setMeal(m)}
            className={`flex min-h-16 flex-col items-center justify-center rounded-xl border px-2 font-semibold ${
              m === meal ? 'border-marigold bg-marigold-wash text-ink' : 'border-line bg-white text-ink-soft hover:text-ink'
            }`}
          >
            {MEAL_LABELS[m]}
            <span className="text-sm font-normal">{MEAL_TIMES[m]}</span>
          </button>
        ))}
      </div>

      <div className="max-w-sm">
        <label htmlFor="food-sector" className="field-label">Sector</label>
        <select id="food-sector" className="field" value={sector} onChange={(e) => setSector(e.target.value)}>
          <option value="">All sectors</option>
          {(event.sectors || []).map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <Notice tone="error">{error}</Notice>
      {!staff && <div className="panel flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
        <div>
          <p id="people-label" className="field-label">Token for how many people?</p>
          <div className="flex items-center gap-2" role="group" aria-labelledby="people-label">
            <button type="button" className="btn-ghost h-12 w-12 px-0 text-xl" aria-label="Fewer people" disabled={people <= 1} onClick={() => setPeople((n) => n - 1)}>−</button>
            <output className="w-10 text-center text-2xl font-bold tabular-nums" aria-live="polite">{people}</output>
            <button type="button" className="btn-ghost h-12 w-12 px-0 text-xl" aria-label="More people" disabled={people >= 6} onClick={() => setPeople((n) => n + 1)}>+</button>
          </div>
        </div>
        {people > 1 && (
          <div className="flex-1">
            <label htmlFor="meal-names" className="field-label">Names (optional)</label>
            <input id="meal-names" className="field" placeholder="e.g. Ramesh, Lata, Aai, Baba" value={names} onChange={(e) => setNames(e.target.value)} maxLength={300} />
          </div>
        )}
      </div>}
      <p className="text-ink-soft">One token per account for each meal, covering up to 6 family members. Show it at the counter during the meal window.</p>

      {!data ? (
        <Loading label="Finding community kitchens" />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {data.centers.map((c) => {
            const slot = c.slots.find((s) => s.meal === meal);
            const pct = slot ? Math.round((slot.remaining / slot.capacity) * 100) : 0;
            return (
              <li key={c._id} className="panel flex flex-col p-5">
                <h3 className="text-xl font-bold">{c.name}</h3>
                <p className="text-ink-soft">{c.sector} · {c.provider?.name}</p>
                {(slot?.menu?.length || c.menu?.length) > 0 && (
                  <div className="mt-3 rounded-xl bg-marigold-wash p-3">
                    <p className="text-sm font-semibold">{MEAL_LABELS[meal]} menu{c.diet ? ` · ${c.diet}` : ''}</p>
                    <ul className="mt-1 flex flex-wrap gap-1.5">
                      {(slot?.menu?.length ? slot.menu : c.menu).map((d) => (
                        <li key={d} className="rounded-full bg-white px-3 py-1 text-[15px] font-medium">{d}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {slot ? (
                  <>
                    <div className="mt-4 flex items-baseline justify-between">
                      <span className="font-semibold">Remaining passes</span>
                      <span className="tabular-nums">
                        <strong className="text-lg">{slot.remaining}</strong> / {slot.capacity}
                      </span>
                    </div>
                    <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-mist" aria-hidden>
                      <div className={`h-full rounded-full ${pct === 0 ? 'bg-kumkum' : pct < 20 ? 'bg-marigold' : 'bg-tulsi'}`} style={{ width: `${pct}%` }} />
                    </div>
                    {!staff && <button type="button" className="btn-primary mt-4" disabled={slot.remaining < people || busySlot === slot._id} onClick={() => claim(slot)}>
                      {slot.remaining === 0 ? 'All tokens taken' : busySlot === slot._id ? 'Claiming…' : people > 1 ? `Claim token for ${people}` : 'Claim meal token'}
                    </button>}
                  </>
                ) : (
                  <p className="mt-4 text-ink-soft">Not serving {MEAL_LABELS[meal].toLowerCase()} on this day.</p>
                )}
              </li>
            );
          })}
          {data.centers.length === 0 && <Notice>No kitchens listed for this sector yet.</Notice>}
        </ul>
      )}
    </div>
  );
}
