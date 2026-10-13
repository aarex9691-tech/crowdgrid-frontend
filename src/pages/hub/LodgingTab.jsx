import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Minus, Plus } from 'lucide-react';
import API, { errorMessage } from '../../lib/api';
import { cachePass } from '../../lib/passCache';
import { CATEGORY_LABELS, todayIST } from '../../lib/format';
import Notice, { Loading } from '../../components/Notice';
import PassCard from '../../components/PassCard';
import useLoginGate from './useLoginGate';

const MAX_BEDS = 4;

const availability = (n) =>
  n === 0 ? <span className="pill-out">Sold out</span> : n <= 5 ? <span className="pill-low">Only {n} beds left</span> : <span className="pill-ok">{n} beds available</span>;

function BookingForm({ lodging, event, onDone, onCancel }) {
  const today = todayIST();
  const eventEnd = new Date(event.endDate).toISOString().slice(0, 10);
  const [beds, setBeds] = useState(1);
  const [guests, setGuests] = useState(['']);
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(today);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const maxBeds = Math.min(MAX_BEDS, lodging.availableBeds);

  const changeBeds = (n) => {
    const next = Math.max(1, Math.min(maxBeds, n));
    setBeds(next);
    setGuests((g) => Array.from({ length: next }, (_, i) => g[i] || ''));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { data } = await API.post(`/lodgings/${lodging._id}/book`, { beds, guestNames: guests, checkIn, checkOut });
      cachePass(data.pass);
      onDone(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-4 border-t border-line pt-4">
      <Notice tone="error">{error}</Notice>
      <div>
        <span className="field-label" id={`beds-${lodging._id}`}>Number of beds</span>
        <div className="flex items-center gap-3" role="group" aria-labelledby={`beds-${lodging._id}`}>
          <button type="button" className="btn-ghost w-12 px-0" onClick={() => changeBeds(beds - 1)} aria-label="One bed fewer" disabled={beds <= 1}>
            <Minus size={20} />
          </button>
          <span className="w-10 text-center text-2xl font-bold tabular-nums" aria-live="polite">{beds}</span>
          <button type="button" className="btn-ghost w-12 px-0" onClick={() => changeBeds(beds + 1)} aria-label="One bed more" disabled={beds >= maxBeds}>
            <Plus size={20} />
          </button>
          <span className="text-sm text-ink-soft">Maximum {MAX_BEDS} per person</span>
        </div>
      </div>
      <fieldset className="space-y-2">
        <legend className="field-label">Guest names</legend>
        {guests.map((g, i) => (
          <input
            key={i}
            className="field"
            placeholder={`Guest ${i + 1} full name`}
            aria-label={`Guest ${i + 1} full name`}
            value={g}
            onChange={(e) => setGuests(guests.map((x, j) => (j === i ? e.target.value : x)))}
            required
          />
        ))}
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor={`in-${lodging._id}`}>Check-in</label>
          <input id={`in-${lodging._id}`} type="date" className="field" min={today} max={eventEnd} value={checkIn} onChange={(e) => { setCheckIn(e.target.value); if (checkOut < e.target.value) setCheckOut(e.target.value); }} required />
        </div>
        <div>
          <label className="field-label" htmlFor={`out-${lodging._id}`}>Check-out</label>
          <input id={`out-${lodging._id}`} type="date" className="field" min={checkIn} max={eventEnd} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Booking…' : `Book ${beds} bed${beds > 1 ? 's' : ''}`}
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function LodgingTab({ event }) {
  const gate = useLoginGate();
  const [filters, setFilters] = useState({ sector: '', category: '' });
  const [lodgings, setLodgings] = useState(null);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);
  const [confirmed, setConfirmed] = useState(null);

  const load = useCallback(() => {
    setError('');
    API.get('/lodgings', { params: { eventId: event._id, ...filters } })
      .then(({ data }) => setLodgings(data))
      .catch((e) => setError(errorMessage(e)));
  }, [event._id, filters]);

  useEffect(() => {
    load();
  }, [load]);

  if (confirmed) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <Notice tone="success">
          Booking confirmed{confirmed.pass?.details?.location ? <>: <b>{confirmed.pass.details.location}</b></> : ''}. Show this QR at the camp gate when you arrive.
        </Notice>
        <PassCard pass={confirmed.pass} />
        <div className="flex flex-wrap gap-3">
          <Link to="/passbook" className="btn-ink">Open my passbook</Link>
          <button type="button" className="btn-ghost" onClick={() => { setConfirmed(null); load(); }}>Back to camps</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <label htmlFor="sector" className="field-label">Sector / zone</label>
          <select id="sector" className="field" value={filters.sector} onChange={(e) => setFilters({ ...filters, sector: e.target.value })}>
            <option value="">All sectors</option>
            {(event.sectors || []).map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="category" className="field-label">Type of stay</label>
          <select id="category" className="field" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            <option value="">All types</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      <Notice tone="error">{error}</Notice>
      {!lodgings ? (
        <Loading label="Finding camps" />
      ) : lodgings.length === 0 ? (
        <Notice>No camps match these filters. Try another sector or type.</Notice>
      ) : (
        <ul className="space-y-4">
          {lodgings.map((l) => (
            <li key={l._id} className="panel p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{l.name}</h3>
                  <p className="flex items-center gap-1 text-[15px] text-tulsi">
                    <BadgeCheck size={18} aria-hidden /> Verified · {l.provider?.name}
                  </p>
                  <p className="mt-1 text-ink-soft">
                    {CATEGORY_LABELS[l.category]} · {l.sector} · {l.distanceToGhatKm} km to ghat ·{' '}
                    {l.pricePerNight ? `₹${l.pricePerNight} per night` : 'Free'}
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {l.amenities.map((a) => <li key={a} className="pill-quiet">{a}</li>)}
                  </ul>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                  {availability(l.availableBeds)}
                  {openId !== l._id && (
                    <button type="button" className="btn-primary" disabled={l.availableBeds === 0} onClick={() => gate() && setOpenId(l._id)}>
                      Book beds
                    </button>
                  )}
                </div>
              </div>
              {openId === l._id && (
                <BookingForm lodging={l} event={event} onCancel={() => setOpenId(null)} onDone={(data) => { setOpenId(null); setConfirmed(data); }} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
