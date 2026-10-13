import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, X } from 'lucide-react';
import API, { errorMessage } from '../../lib/api';
import { rupees } from '../../lib/cart';
import { addDaysIST, EVENT_CATEGORIES, fmtDateTime, todayIST } from '../../lib/format';
import Notice, { Loading } from '../../components/Notice';
import LocationPicker from '../../components/LocationPicker';
import DateTimeRange, { toIsoRange, windowError } from '../../components/DateTimeRange';

// Description length is counted without spaces (same rule as the server)
const DESC_MIN = 150;
const DESC_MAX = 200;
const letters = (t) => t.replace(/\s/g, '').length;

function HostForm({ onCreated, onCancel }) {
  const [form, setForm] = useState({
    title: '',
    category: 'SPIRITUAL',
    description: '',
    venue: '',
    address: '',
    city: 'Nashik',
    pincode: '',
    capacity: 100,
    ticketPrice: 99,
    minAge: '',
    contactPhone: '',
  });
  const [when, setWhen] = useState({ date: addDaysIST(todayIST(), 3), start: '18:00', end: '20:00' });
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onPick = (p) => {
    if (p.location) setLocation(p.location);
    setForm((f) => ({ ...f, address: p.address || f.address, city: p.city || f.city, pincode: p.pincode || f.pincode }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const wErr = windowError(when);
    if (wErr) return setError(wErr);
    const n = letters(form.description);
    if (n < DESC_MIN || n > DESC_MAX) return setError(`Description must have ${DESC_MIN} to ${DESC_MAX} characters (spaces not counted); it has ${n}`);
    setBusy(true);
    try {
      const body = {
        kind: 'PUBLIC',
        title: form.title,
        category: form.category,
        description: form.description,
        venue: form.venue,
        address: form.address,
        city: form.city,
        ...toIsoRange(when),
        capacity: Number(form.capacity),
        ticketPrice: Number(form.ticketPrice),
      };
      // Optional fields are only sent when filled in, so nothing empty is stored
      if (form.pincode) body.pincode = form.pincode;
      if (form.minAge) body.minAge = Number(form.minAge);
      if (form.contactPhone) body.contactPhone = form.contactPhone;
      if (location) body.location = location;
      const { data } = await API.post('/events', body);
      onCreated(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="panel space-y-5 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Host a public event</h2>
        <button type="button" className="btn-ghost min-h-10 px-3" onClick={onCancel} aria-label="Close form"><X size={18} aria-hidden /></button>
      </div>
      <Notice tone="error">{error}</Notice>

      <fieldset className="grid gap-3 sm:grid-cols-[2fr_1fr]">
        <legend className="mb-2 text-lg font-bold">1. What</legend>
        <div>
          <label className="field-label" htmlFor="h-title">Event title</label>
          <input id="h-title" className="field" maxLength={100} value={form.title} onChange={set('title')} required />
        </div>
        <div>
          <label className="field-label" htmlFor="h-cat">Category</label>
          <select id="h-cat" className="field" value={form.category} onChange={set('category')}>
            {Object.entries(EVENT_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="h-desc">Description</label>
          <textarea
            id="h-desc"
            rows={4}
            className="field py-3"
            value={form.description}
            onChange={(e) => {
              const v = e.target.value;
              // Stop typing once 200 letters are reached; spaces are still allowed
              if (letters(v) <= DESC_MAX || v.length < form.description.length) setForm({ ...form, description: v });
            }}
            required
          />
          <p className={`mt-1 text-right text-sm ${letters(form.description) < DESC_MIN || letters(form.description) > DESC_MAX ? 'font-semibold text-kumkum' : 'text-tulsi'}`}>
            {letters(form.description)}/{DESC_MAX} characters (spaces not counted, minimum {DESC_MIN})
          </p>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-lg font-bold">2. When</legend>
        <DateTimeRange idPrefix="h" value={when} onChange={setWhen} />
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-2 text-lg font-bold">3. Where</legend>
        <LocationPicker value={location} onPick={onPick} />
        <p className="text-sm text-ink-soft">Or type the address yourself:</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="h-venue">Venue name</label>
            <input id="h-venue" className="field" maxLength={120} placeholder="e.g. Ramkund Ghat, Gate 2" value={form.venue} onChange={set('venue')} required />
          </div>
          <div>
            <label className="field-label" htmlFor="h-address">Street / landmark</label>
            <input id="h-address" className="field" maxLength={200} value={form.address} onChange={set('address')} required />
          </div>
          <div>
            <label className="field-label" htmlFor="h-city">City</label>
            <input id="h-city" className="field" maxLength={60} value={form.city} onChange={set('city')} required />
          </div>
          <div>
            <label className="field-label" htmlFor="h-pin">PIN code (optional)</label>
            <input id="h-pin" className="field" inputMode="numeric" maxLength={6} value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '') })} />
          </div>
        </div>
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-4">
        <legend className="mb-2 text-lg font-bold">4. Tickets</legend>
        <div>
          <label className="field-label" htmlFor="h-price">Ticket price (₹, 0 = free)</label>
          <input id="h-price" type="number" min={0} max={100000} className="field" value={form.ticketPrice} onChange={set('ticketPrice')} required />
        </div>
        <div>
          <label className="field-label" htmlFor="h-cap">Capacity</label>
          <input id="h-cap" type="number" min={1} max={100000} className="field" value={form.capacity} onChange={set('capacity')} required />
        </div>
        <div>
          <label className="field-label" htmlFor="h-age">Minimum age (optional)</label>
          <input id="h-age" type="number" min={0} max={100} className="field" value={form.minAge} onChange={set('minAge')} />
        </div>
        <div>
          <label className="field-label" htmlFor="h-phone">Contact (optional)</label>
          <input id="h-phone" className="field" inputMode="tel" maxLength={10} placeholder="10-digit mobile" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value.replace(/\D/g, '') })} />
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Publishing…' : 'Publish event'}</button>
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

/** Authority / Super Admin: host paid public events and see ticket sales. */
export default function HostEvents() {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(() => {
    API.get('/events/hosted/mine')
      .then(({ data }) => setEvents(data))
      .catch((e) => setError(errorMessage(e)));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const now = new Date();
  return (
    <div className="shell space-y-6 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Hosted events</h1>
          <p className="text-ink-soft">Pilgrims register for your events; paid tickets go through checkout, free ones are confirmed instantly.</p>
        </div>
        {!creating && (
          <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
            <CalendarPlus size={20} aria-hidden /> Host an event
          </button>
        )}
      </div>
      <Notice tone="error">{error}</Notice>
      {notice && <Notice tone="success">{notice}</Notice>}
      {creating && (
        <HostForm
          onCancel={() => setCreating(false)}
          onCreated={(ev) => {
            setCreating(false);
            setNotice(`"${ev.title}" is live on the Events page.`);
            load();
          }}
        />
      )}

      {!events ? (
        <Loading label="Loading your events" />
      ) : events.length === 0 ? (
        <Notice>You have not hosted any events yet.</Notice>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead className="bg-mist text-sm text-ink-soft">
              <tr>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Sold</th>
                <th className="px-4 py-3 text-right">Checked in</th>
                <th className="px-4 py-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {events.map((e) => (
                <tr key={e._id} className={new Date(e.endDate) < now ? 'text-ink-soft' : ''}>
                  <td className="px-4 py-3">
                    <Link to={`/event/${e.slug}`} className="font-semibold underline">{e.title}</Link>
                    <span className="block text-sm text-ink-soft">{EVENT_CATEGORIES[e.category]} · {e.venue}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">{fmtDateTime(e.startDate)}{new Date(e.endDate) < now ? ' (over)' : ''}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{rupees(e.ticketPrice)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{e.ticketsSold} / {e.capacity}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{e.checkedIn}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{rupees(e.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
