import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, X } from 'lucide-react';
import API, { errorMessage } from '../../lib/api';
import { rupees } from '../../lib/cart';
import { addDaysIST, EVENT_CATEGORIES, fmtDateTime, todayIST } from '../../lib/format';
import Notice, { Loading } from '../../components/Notice';
import LocationPicker from '../../components/LocationPicker';
import DateTimeRange, { toIsoRange, windowError } from '../../components/DateTimeRange';
import { NumberField, PinField, TextField } from '../../components/Fields';
import PhoneField from '../../components/PhoneField';
import { cleanText, firstError, intError, optionalPhoneError, pinError, textError } from '../../lib/validate';

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
    capacity: '100',
    ticketPrice: '99',
    minAge: '',
    contactCountryCode: '91',
    contactPhone: '',
  });
  const [tried, setTried] = useState(false);
  const [when, setWhen] = useState({ date: addDaysIST(todayIST(), 3), start: '18:00', end: '20:00' });
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const put = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const onPick = (p) => {
    if (p.location) setLocation(p.location);
    // Map results can contain characters our fields do not accept, so clean them the same way as typing
    setForm((f) => ({
      ...f,
      address: p.address ? cleanText(p.address, 'address') : f.address,
      city: p.city ? cleanText(p.city, 'city') : f.city,
      pincode: p.pincode ? String(p.pincode).replace(/\D/g, '').slice(0, 6) : f.pincode,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setTried(true);
    const n = letters(form.description);
    const problem = firstError(
      textError(form.title, 'Event title', 'title', { required: true }),
      n < DESC_MIN || n > DESC_MAX ? `Description must have ${DESC_MIN} to ${DESC_MAX} characters (spaces not counted); it has ${n}` : '',
      windowError(when),
      textError(form.venue, 'Venue name', 'venue', { required: true }),
      textError(form.address, 'Street / landmark', 'address', { required: true }),
      textError(form.city, 'City', 'city', { required: true }),
      pinError(form.pincode),
      intError(form.ticketPrice, 'Ticket price', { min: 0, max: 100000, required: true }),
      intError(form.capacity, 'Capacity', { min: 1, max: 100000, required: true }),
      intError(form.minAge, 'Minimum age', { min: 0, max: 100 }),
      optionalPhoneError(form.contactCountryCode, form.contactPhone) && `Contact number: ${optionalPhoneError(form.contactCountryCode, form.contactPhone)}`,
    );
    if (problem) {
      setError(`Please fix the highlighted fields. ${problem}`);
      return;
    }
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
      if (form.contactPhone) {
        body.contactCountryCode = form.contactCountryCode;
        body.contactPhone = form.contactPhone;
      }
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
    <form onSubmit={submit} noValidate className="panel space-y-5 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Host a public event</h2>
        <button type="button" className="btn-ghost min-h-10 px-3" onClick={onCancel} aria-label="Close form"><X size={18} aria-hidden /></button>
      </div>
      <Notice tone="error">{error}</Notice>

      <fieldset className="grid gap-3 sm:grid-cols-[2fr_1fr]">
        <legend className="mb-2 text-lg font-bold">1. What</legend>
        <TextField id="h-title" label="Event title" rule="title" required value={form.title} onChange={put('title')} showErrors={tried} placeholder="e.g. Bhajan Sandhya at Kalidas Kala Mandir" />
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
          <p className={`mt-1 text-right text-sm tabular-nums ${letters(form.description) < DESC_MIN || letters(form.description) > DESC_MAX ? 'font-semibold text-kumkum' : 'text-tulsi'}`}>
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
          <TextField id="h-venue" label="Venue name" rule="venue" required value={form.venue} onChange={put('venue')} showErrors={tried} placeholder="e.g. Ramkund Ghat, Gate 2" />
          <TextField id="h-address" label="Street / landmark" rule="address" required value={form.address} onChange={put('address')} showErrors={tried} placeholder="e.g. Near Kapaleshwar Mandir, Panchavati" />
          <TextField id="h-city" label="City" rule="city" required value={form.city} onChange={put('city')} showErrors={tried} autoComplete="address-level2" />
          <PinField id="h-pin" value={form.pincode} onChange={put('pincode')} showErrors={tried} />
        </div>
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-3">
        <legend className="mb-2 text-lg font-bold">4. Tickets</legend>
        <NumberField id="h-price" label="Ticket price" prefix="₹" min={0} max={100000} required value={form.ticketPrice} onChange={put('ticketPrice')} showErrors={tried} hint={form.ticketPrice === '0' ? 'Free entry' : '0 = free, up to ₹1,00,000'} />
        <NumberField id="h-cap" label="Capacity (people)" min={1} max={100000} required value={form.capacity} onChange={put('capacity')} showErrors={tried} />
        <NumberField id="h-age" label="Minimum age" min={0} max={100} value={form.minAge} onChange={put('minAge')} showErrors={tried} hint="Leave empty for all ages" />
        <PhoneField
          id="h-phone"
          className="sm:col-span-3"
          label="Contact number for attendees"
          required={false}
          showErrors={tried}
          countryCode={form.contactCountryCode}
          phone={form.contactPhone}
          onChange={({ countryCode, phone }) => setForm((f) => ({ ...f, contactCountryCode: countryCode, contactPhone: phone }))}
        />
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
