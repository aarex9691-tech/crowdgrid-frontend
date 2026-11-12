import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BadgeCheck, Minus, Plus } from 'lucide-react';
import API, { errorMessage } from '../../lib/api';
import { cachePass } from '../../lib/passCache';
import { rupees, useCart } from '../../lib/cart';
import { CATEGORY_LABELS, addDaysIST, todayIST } from '../../lib/format';
import Notice, { Loading } from '../../components/Notice';
import PassCard from '../../components/PassCard';
import useLoginGate from './useLoginGate';
import { canBook, useAuth } from '../../lib/auth';
import { useLive } from '../../lib/realtime';
import { MAX_PER_ACCOUNT } from '../../lib/limits';
import { useT } from '../../lib/i18n';

const MAX_BEDS = MAX_PER_ACCOUNT; // 5 beds per account on any one night
const MAX_NIGHTS = 5; // same limit as the server: the longest stay

// Bed counts are per night: the number shown is free on EVERY night of the chosen stay
const availability = (n, t) =>
  n === 0 ? <span className="pill-out">{t('lodging.soldOut')}</span> : n <= 5 ? <span className="pill-low">{t('lodging.onlyLeft', { n })}</span> : <span className="pill-ok">{t('lodging.bedsFree', { n })}</span>;

const nightsBetween = (a, b) => Math.max(1, Math.round((new Date(`${b}T12:00:00+05:30`) - new Date(`${a}T12:00:00+05:30`)) / 86400000));
const istDay = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(d));
const showDate = (s) => new Date(`${s}T12:00:00+05:30`).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short' });

/**
 * Tent and bed picker: the pilgrim taps free beds (like cinema seats). A bed is free only if it
 * is free on every night of the chosen stay. The server checks again when booking.
 */
function BedPicker({ lodging, stay, selected, onChange, max }) {
  const t = useT();
  const [map, setMap] = useState(null);
  const [error, setError] = useState('');
  const [shown, setShown] = useState(24);

  const load = useCallback(() => {
    setError('');
    API.get(`/lodgings/${lodging._id}/stay-map`, { params: stay })
      .then(({ data }) => setMap(data))
      .catch((e) => setError(errorMessage(e)));
  }, [lodging._id, stay]);
  useEffect(() => {
    load();
  }, [load]);
  useLive('beds', load, { wait: 3000 }); // beds others just booked turn grey

  // a bed someone else took meanwhile leaves the selection
  useEffect(() => {
    if (!map) return;
    const free = new Set(map.units.flatMap((u) => u.beds.filter((b) => b.free).map((b) => b.bedNo)));
    if (selected.some((s) => !free.has(s.bedNo))) onChange(selected.filter((s) => free.has(s.bedNo)));
  }, [map]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!map) return <Loading label={t('lodging.loadingMap')} />;

  const isOn = (n) => selected.some((s) => s.bedNo === n);
  const toggle = (unit, bed) => {
    if (isOn(bed.bedNo)) return onChange(selected.filter((s) => s.bedNo !== bed.bedNo));
    if (selected.length >= max) return;
    onChange([...selected, { bedNo: bed.bedNo, where: `${unit.label} · ${t('lodging.bed')} ${bed.bed}` }]);
  };
  const wholeTent = (unit) => {
    const others = selected.filter((s) => !unit.beds.some((b) => b.bedNo === s.bedNo));
    const room = Math.max(0, max - others.length);
    const add = unit.beds.filter((b) => b.free).slice(0, room).map((b) => ({ bedNo: b.bedNo, where: `${unit.label} · ${t('lodging.bed')} ${b.bed}` }));
    onChange([...others, ...add]);
  };
  const withRoom = map.units.filter((u) => u.free > 0);

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-soft">{t('lodging.tapBeds', { n: max, size: map.unit.size })}</p>
      <div className="flex flex-wrap gap-4 text-sm" aria-hidden>
        <span className="flex items-center gap-1"><span className="h-4 w-4 rounded bg-white ring-2 ring-tulsi" /> {t('lodging.legendFree')}</span>
        <span className="flex items-center gap-1"><span className="h-4 w-4 rounded bg-mist" /> {t('lodging.legendTaken')}</span>
        <span className="flex items-center gap-1"><span className="h-4 w-4 rounded bg-terracotta" /> {t('lodging.legendYours')}</span>
      </div>
      {withRoom.length === 0 && <Notice>{t('lodging.soldOut')}</Notice>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {withRoom.slice(0, shown).map((u) => (
          <div key={u.unitNo} className="rounded-2xl border border-line bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-bold">{u.label}</span>
              <span className="text-sm text-ink-soft">{t('lodging.freeIn', { n: u.free })}</span>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label={u.label}>
              {u.beds.map((b) => {
                const on = isOn(b.bedNo);
                return (
                  <button
                    key={b.bedNo}
                    type="button"
                    disabled={!b.free}
                    aria-pressed={on}
                    aria-label={`${u.label}, ${t('lodging.bed')} ${b.bed}: ${b.free ? (on ? t('lodging.legendYours') : t('lodging.legendFree')) : t('lodging.legendTaken')}`}
                    onClick={() => toggle(u, b)}
                    className={`h-11 w-11 rounded-b-md rounded-t-xl text-sm font-bold tabular-nums transition ${
                      !b.free ? 'cursor-not-allowed bg-mist text-ink-faint' : on ? 'bg-terracotta text-white' : 'bg-white text-ink ring-2 ring-tulsi hover:bg-tulsi/10'
                    }`}
                  >
                    {b.bed}
                  </button>
                );
              })}
            </div>
            {u.free > 1 && (
              <button type="button" className="mt-2 text-sm font-semibold text-dusk underline" onClick={() => wholeTent(u)}>
                {t('lodging.wholeTent')}
              </button>
            )}
          </div>
        ))}
      </div>
      {withRoom.length > shown && (
        <button type="button" className="btn-ghost" onClick={() => setShown((n) => n + 24)}>{t('lodging.showMore')}</button>
      )}
    </div>
  );
}

/** Where the pilgrim is in booking: the first step not done yet is the current one. */
function BookingSteps({ steps }) {
  const current = steps.findIndex((s) => !s.done);
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm" aria-label="Booking steps">
      {steps.map((s, i) => (
        <li key={s.label} className="flex items-center gap-2" aria-current={i === current ? 'step' : undefined}>
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              s.done ? 'bg-tulsi text-white' : i === current ? 'bg-ink text-white' : 'bg-line text-ink-soft'
            }`}
          >
            {s.done ? '✓' : i + 1}
          </span>
          <span className={i === current ? 'font-semibold' : 'text-ink-soft'}>{s.label}</span>
          {i < steps.length - 1 && <span className="h-px w-5 bg-line" aria-hidden />}
        </li>
      ))}
    </ol>
  );
}

function BookingForm({ lodging, onDone, onCancel, onAdded, stay, prefill = {} }) {
  const cart = useCart();
  const t = useT();
  const { checkIn, checkOut } = stay; // chosen once at the top of the tab
  const maxBeds = Math.min(MAX_BEDS, lodging.availableBeds);
  const [mode, setMode] = useState('pick'); // 'pick' = choose on the map, 'auto' = any free beds
  const [picked, setPicked] = useState([]); // [{ bedNo, where }]
  const startBeds = Math.max(1, Math.min(maxBeds, Number(prefill.beds) || 1));
  const [autoBeds, setAutoBeds] = useState(startBeds);
  const [names, setNames] = useState({}); // key -> name
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // One row per person: the chosen bed (pick) or bed 1..n (auto)
  const rows = mode === 'pick' ? [...picked].sort((a, b) => a.bedNo - b.bedNo).map((p) => ({ key: `b${p.bedNo}`, label: p.where })) : Array.from({ length: autoBeds }, (_, i) => ({ key: `a${i}`, label: t('lodging.guestN', { n: i + 1 }) }));
  const beds = rows.length;
  const guestNames = rows.map((r) => (names[r.key] || '').trim());

  const price = lodging.pricePerNight || 0;
  const nights = nightsBetween(checkIn, checkOut);
  const estimate = price * beds * nights;
  const stayParams = useMemo(() => ({ checkIn, checkOut }), [checkIn, checkOut]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (beds === 0) return setError(t('lodging.pickFirst'));
    if (guestNames.some((n) => n.length < 2)) return setError(t('lodging.namesNeeded'));
    const input = { beds, guestNames, checkIn, checkOut, ...(mode === 'pick' ? { bedNos: picked.map((p) => p.bedNo) } : {}) };
    const where = mode === 'pick' ? rows.map((r) => r.label).join(', ') : `${beds} bed${beds > 1 ? 's' : ''}`;
    if (price > 0) {
      cart.add({
        key: `LODGING:${lodging._id}`,
        kind: 'LODGING',
        refId: lodging._id,
        label: lodging.name,
        detail: `${where} · ${nights} night${nights > 1 ? 's' : ''} · ${checkIn === checkOut ? checkIn : `${checkIn} to ${checkOut}`}`,
        estimate,
        input,
      });
      onAdded(lodging);
      return;
    }
    setBusy(true);
    try {
      const { data } = await API.post(`/lodgings/${lodging._id}/book`, input);
      cachePass(data.pass);
      onDone(data);
    } catch (err) {
      setError(errorMessage(err));
      // a chosen bed was taken meanwhile: drop it so the pilgrim can pick another
      const takenBeds = err?.response?.data?.takenBeds;
      if (Array.isArray(takenBeds)) setPicked((p) => p.filter((x) => !takenBeds.includes(x.bedNo)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-4 border-t border-line pt-4">
      <BookingSteps
        steps={[
          { label: t('lodging.step.dates'), done: true },
          { label: t('lodging.step.beds'), done: beds > 0 },
          { label: t('lodging.step.names'), done: beds > 0 && guestNames.every((n) => n.length >= 2) },
          { label: t('lodging.step.confirm'), done: false },
        ]}
      />
      <Notice tone="error">{error}</Notice>
      <p className="text-ink-soft">
        {t('lodging.stay')}: <b>{showDate(checkIn)}</b>{checkOut !== checkIn && <> – <b>{showDate(checkOut)}</b></>} · {t('lodging.nights', { n: nights })}. {t('lodging.changeDates')}
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('lodging.howToChoose')}>
        <button type="button" aria-pressed={mode === 'pick'} className={mode === 'pick' ? 'btn-ink' : 'btn-ghost'} onClick={() => setMode('pick')}>{t('lodging.pickBeds')}</button>
        <button type="button" aria-pressed={mode === 'auto'} className={mode === 'auto' ? 'btn-ink' : 'btn-ghost'} onClick={() => setMode('auto')}>{t('lodging.anyBeds')}</button>
      </div>

      {mode === 'pick' ? (
        <BedPicker lodging={lodging} stay={stayParams} selected={picked} onChange={setPicked} max={maxBeds} />
      ) : (
        <div>
          <span className="field-label" id={`beds-${lodging._id}`}>{t('lodging.numberOfBeds')}</span>
          <div className="flex items-center gap-3" role="group" aria-labelledby={`beds-${lodging._id}`}>
            <button type="button" className="btn-ghost w-12 px-0" onClick={() => setAutoBeds((b) => Math.max(1, b - 1))} aria-label="One bed fewer" disabled={autoBeds <= 1}>
              <Minus size={20} />
            </button>
            <span className="w-10 text-center text-2xl font-bold tabular-nums" aria-live="polite">{autoBeds}</span>
            <button type="button" className="btn-ghost w-12 px-0" onClick={() => setAutoBeds((b) => Math.min(maxBeds, b + 1))} aria-label="One bed more" disabled={autoBeds >= maxBeds}>
              <Plus size={20} />
            </button>
            <span className="text-sm text-ink-soft">{t('lodging.maxPerPerson', { n: MAX_BEDS })}</span>
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="field-label">{t('lodging.guestNames')} <span className="font-normal text-ink-soft">({t('lodging.selected', { n: rows.length })})</span></legend>
          {rows.map((r) => (
            <label key={r.key} className="block">
              <span className="text-sm text-ink-soft">{r.label}</span>
              <input
                className="field"
                placeholder={t('lodging.fullName')}
                value={names[r.key] || ''}
                onChange={(e) => setNames((n) => ({ ...n, [r.key]: e.target.value }))}
                minLength={2}
                maxLength={60}
                required
              />
            </label>
          ))}
        </fieldset>
      )}

      {beds > 0 && (
        <div className="rounded-2xl border border-line bg-sand p-4">
          <p className="font-bold">{t('lodging.summary')}</p>
          <p>{lodging.name}</p>
          <p className="text-ink-soft">
            {showDate(checkIn)}{checkOut !== checkIn && <> – {showDate(checkOut)}</>} · {t('lodging.nights', { n: nights })}
          </p>
          <p className="text-ink-soft">{mode === 'pick' ? rows.map((r) => r.label).join(', ') : t('lodging.selected', { n: beds })}</p>
          <p className="mt-1 text-lg font-bold">{price > 0 ? `${t('lodging.total')}: ${rupees(estimate)}` : t('lodging.free')}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary" disabled={busy || beds === 0}>
          {beds === 0 ? t('lodging.pickFirst') : price > 0 ? t('lodging.addToCart', { amount: rupees(estimate) }) : busy ? t('lodging.booking') : t('lodging.bookFree', { n: beds })}
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel}>{t('common.cancel')}</button>
      </div>
    </form>
  );
}

export default function LodgingTab({ event }) {
  const gate = useLoginGate();
  const t = useT();
  const { user } = useAuth();
  const staff = !canBook(user);
  const [params] = useSearchParams();
  const today = todayIST();
  const firstDay = (() => { const s = istDay(event.startDate); return s > today ? s : today; })();
  const eventEnd = istDay(event.endDate);
  const prefillIn = params.get('checkIn');
  const startIn = prefillIn && prefillIn >= firstDay && prefillIn <= eventEnd ? prefillIn : firstDay;
  const [filters, setFilters] = useState(() => ({ sector: params.get('sector') || '', category: '', checkIn: startIn, checkOut: startIn }));
  const prefill = { beds: params.get('beds') || '' };
  const lastOut = (() => { const cap = addDaysIST(filters.checkIn, MAX_NIGHTS); return cap < eventEnd ? cap : eventEnd; })();
  const setCheckIn = (v) => setFilters((f) => ({ ...f, checkIn: v, checkOut: f.checkOut < v || f.checkOut > addDaysIST(v, MAX_NIGHTS) ? v : f.checkOut }));
  const [lodgings, setLodgings] = useState(null);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);
  const [confirmed, setConfirmed] = useState(null);
  const [added, setAdded] = useState(null);

  useEffect(() => {
    const s = params.get('sector');
    if (s !== null && s !== undefined) {
      setFilters((f) => (f.sector === s ? f : { ...f, sector: s }));
    }
  }, [params]);

  const load = useCallback(() => {
    setError('');
    API.get('/lodgings', { params: { eventId: event._id, ...filters } })
      .then(({ data }) => setLodgings(data))
      .catch((e) => setError(errorMessage(e)));
  }, [event._id, filters]);

  useEffect(() => {
    load();
  }, [load]);
  // Bed counts change as other pilgrims book or cancel; refresh quietly
  useLive('beds', () => {
    API.get('/lodgings', { params: { eventId: event._id, ...filters } }).then(({ data }) => setLodgings(data)).catch(() => {});
  });

  if (confirmed) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <Notice tone="success">
          Booking confirmed{confirmed.pass?.details?.location ? <>: <b>{confirmed.pass.details.location}</b></> : ''}. Show this QR at the camp gate when you arrive.
        </Notice>
        <PassCard pass={confirmed.pass} />
        <Notice>
          Need food and transport during your stay? Meal tokens can be booked up to 4 days ahead (today and the next 3 days) in the{' '}
          <Link className="font-bold underline" to={`/yatra/${event.slug}?tab=food`}>Food</Link> tab, and shuttle passes in the{' '}
          <Link className="font-bold underline" to={`/yatra/${event.slug}?tab=transit`}>Transport</Link> tab.
        </Notice>
        <div className="flex flex-wrap gap-3">
          <Link to="/passbook" className="btn-ink">Open my passbook</Link>
          <button type="button" className="btn-ghost" onClick={() => { setConfirmed(null); load(); }}>Back to camps</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="stay-in">{t('lodging.checkIn')}</label>
          <input id="stay-in" type="date" className="field" min={firstDay} max={eventEnd} value={filters.checkIn} onChange={(e) => e.target.value && setCheckIn(e.target.value)} required />
        </div>
        <div>
          <label className="field-label" htmlFor="stay-out">{t('lodging.checkOut')} <span className="font-normal text-ink-soft">{t('lodging.upToNights', { n: MAX_NIGHTS })}</span></label>
          <input id="stay-out" type="date" className="field" min={filters.checkIn} max={lastOut} value={filters.checkOut} onChange={(e) => e.target.value && setFilters({ ...filters, checkOut: e.target.value })} required />
        </div>
      </div>
      <p className="text-sm text-ink-soft">{t('lodging.perNightNote')}</p>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <label htmlFor="sector" className="field-label">{t('lodging.sector')}</label>
          <select id="sector" className="field" value={filters.sector} onChange={(e) => setFilters({ ...filters, sector: e.target.value })}>
            <option value="">{t('lodging.allSectors')}</option>
            {(event.sectors || []).map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="category" className="field-label">{t('lodging.type')}</label>
          <select id="category" className="field" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            <option value="">{t('lodging.allTypes')}</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      <Notice tone="error">{error}</Notice>
      {added && (
        <Notice tone="success">
          {added.name} is in your cart. <Link to="/checkout" className="font-bold underline">Go to checkout</Link> to pay and get your QR.
        </Notice>
      )}
      {!lodgings ? (
        <Loading label={t('lodging.finding')} />
      ) : lodgings.length === 0 ? (
        <Notice>{t('lodging.none')}</Notice>
      ) : (
        <ul className="space-y-4">
          {lodgings.map((l) => (
            <li key={l._id} className="panel p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{l.name}</h3>
                  <p className="flex items-center gap-1 text-[15px] text-tulsi">
                    <BadgeCheck size={18} aria-hidden /> {t('lodging.verified')} · {l.provider?.name}
                  </p>
                  <p className="mt-1 text-ink-soft">
                    {CATEGORY_LABELS[l.category]} · {l.sector} · {t('lodging.kmToGhat', { n: l.distanceToGhatKm })} ·{' '}
                    {l.pricePerNight ? t('lodging.perNight', { n: l.pricePerNight }) : t('lodging.free')}
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {l.amenities.map((a) => <li key={a} className="pill-quiet">{a}</li>)}
                  </ul>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                  {availability(l.availableBeds, t)}
                  {!staff && openId !== l._id && (
                    <button type="button" className="btn-primary" disabled={l.availableBeds === 0} onClick={() => gate() && setOpenId(l._id)}>
                      {l.pricePerNight ? t('lodging.chooseBeds') : t('lodging.bookBeds')}
                    </button>
                  )}
                </div>
              </div>
              {openId === l._id && (
                <BookingForm
                  prefill={prefill}
                  lodging={l}
                  stay={{ checkIn: filters.checkIn, checkOut: filters.checkOut }}
                  onCancel={() => setOpenId(null)}
                  onDone={(data) => { setOpenId(null); setConfirmed(data); }}
                  onAdded={(x) => { setOpenId(null); setAdded(x); }}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
