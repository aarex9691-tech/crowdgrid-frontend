import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, Users, X } from 'lucide-react';
import API, { errorMessage } from '../../lib/api';
import { rupees } from '../../lib/cart';
import { addDaysIST, categoryLabel, EVENT_CATEGORIES, fmtDateTime, todayIST } from '../../lib/format';
import Notice, { Loading } from '../../components/Notice';
import LocationPicker from '../../components/LocationPicker';
import DateTimeRange, { toIsoRange, windowError } from '../../components/DateTimeRange';
import { NumberField, PinField, TextField } from '../../components/Fields';
import PhoneField from '../../components/PhoneField';
import { cleanText, firstError, intError, optionalPhoneError, pinError, textError } from '../../lib/validate';
import PageTitle from '../../components/PageTitle';
import { ROLE_LABELS, useAuth } from '../../lib/auth';

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
        <button type="button" className="btn-ghost min-h-11 px-3" onClick={onCancel} aria-label="Close form"><X size={18} aria-hidden /></button>
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
const STATUS_PILL = {
  BOOKED: ['pill-quiet', 'Booked'],
  CHECKED_IN: ['pill-ok', 'Checked in'],
  CANCELLED: ['pill-out', 'Cancelled'],
};

/** Who booked this event online: names, group size, status. Phone numbers are masked by the server. */
function Bookers({ event }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    API.get(`/events/${event._id}/attendees`)
      .then(({ data }) => setRows(data))
      .catch((e) => setError(errorMessage(e)));
  }, [event._id]);
  if (error) return <Notice tone="error">{error}</Notice>;
  if (!rows) return <Loading label="Loading bookings" />;
  if (!rows.length) return <Notice>No bookings yet. Tickets are booked online from the event page.</Notice>;
  const people = rows.filter((r) => r.status !== 'CANCELLED').reduce((n, r) => n + r.people, 0);
  return (
    <div className="space-y-2" data-no-translate>
      <p className="text-sm text-ink-soft">{rows.length} booking{rows.length === 1 ? '' : 's'}, {people} {people === 1 ? 'person' : 'people'}. Phone numbers are partly hidden to protect attendees.</p>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[520px] text-left text-[15px]">
          <thead className="bg-mist text-ink-soft">
            <tr>
              <th className="px-4 py-2 font-semibold">Name</th>
              <th className="px-4 py-2 font-semibold">Mobile</th>
              <th className="px-4 py-2 text-right font-semibold">People</th>
              <th className="px-4 py-2 font-semibold">Booked</th>
              <th className="px-4 py-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r._id} className={r.status === 'CANCELLED' ? 'text-ink-soft' : ''}>
                <td className="px-4 py-2 font-medium">{r.name}</td>
                <td className="px-4 py-2 tabular-nums">{r.phone}</td>
                <td className="px-4 py-2 text-right tabular-nums">{r.people}</td>
                <td className="px-4 py-2 text-ink-soft">{fmtDateTime(r.bookedAt)}</td>
                <td className="px-4 py-2"><span className={STATUS_PILL[r.status][0]}>{STATUS_PILL[r.status][1]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HostedEvent({ e, over }) {
  const [open, setOpen] = useState(false);
  const full = e.capacity > 0 && e.ticketsSold >= e.capacity;
  return (
    <li className={`panel space-y-3 p-4 sm:p-5 ${over ? 'opacity-80' : ''}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <Link to={`/event/${e.slug}`} className="text-lg font-bold underline-offset-4 hover:underline">{e.title}</Link>
          <p className="text-sm text-ink-soft">{categoryLabel(e.category)} · {e.venue}</p>
          <p className="text-sm">{fmtDateTime(e.startDate)}{over ? ' (over)' : ''}</p>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4 md:text-right">
          <div><dt className="text-ink-soft">Price</dt><dd className="font-semibold tabular-nums">{e.ticketPrice ? rupees(e.ticketPrice) : 'Free'}</dd></div>
          <div><dt className="text-ink-soft">Booked</dt><dd className="font-semibold tabular-nums">{e.ticketsSold} / {e.capacity}{full ? ' (full)' : ''}</dd></div>
          <div><dt className="text-ink-soft">Checked in</dt><dd className="font-semibold tabular-nums">{e.checkedIn}</dd></div>
          <div><dt className="text-ink-soft">Revenue</dt><dd className="font-semibold tabular-nums">{rupees(e.revenue)}</dd></div>
        </dl>
      </div>
      <button type="button" className={open ? 'btn-ink' : 'btn-ghost'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Users size={18} aria-hidden /> Who booked ({e.ticketsSold})
      </button>
      {open && <Bookers event={e} />}
    </li>
  );
}

export default function HostEvents() {
  const { user } = useAuth();
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

  const [now] = useState(() => Date.now());
  const upcoming = (events || []).filter((e) => new Date(e.endDate).getTime() >= now);
  const past = (events || []).filter((e) => new Date(e.endDate).getTime() < now);
  const totals = upcoming.reduce((t, e) => ({ booked: t.booked + e.ticketsSold, checkedIn: t.checkedIn + e.checkedIn, revenue: t.revenue + e.revenue }), { booked: 0, checkedIn: 0, revenue: 0 });
  return (
    <div className="shell space-y-6 py-6">
      <div className="cg-pagehead">
        <PageTitle
          kicker={user?.organisationName || ROLE_LABELS[user?.role] || 'Host'}
          tone="blue"
          title="Public events"
          lead="Tickets are booked online only. Free events confirm at once; paid ones go through checkout."
        />
        {!creating && (
          <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
            <CalendarPlus size={20} aria-hidden /> New event
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

      {events && events.length > 0 && (
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ['Upcoming events', upcoming.length],
            ['People booked', totals.booked],
            ['Checked in', totals.checkedIn],
            ['Revenue (upcoming)', rupees(totals.revenue)],
          ].map(([label, value]) => (
            <div key={label} className="panel p-4">
              <dt className="text-sm text-ink-soft">{label}</dt>
              <dd className="mt-1 text-2xl font-extrabold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {!events ? (
        <Loading label="Loading your events" />
      ) : events.length === 0 ? (
        <Notice>You have not hosted any events yet. Use “New event” to publish your first one.</Notice>
      ) : (
        <>
          <section aria-labelledby="upcoming-title" className="space-y-3">
            <h2 id="upcoming-title" className="text-xl font-bold">Upcoming</h2>
            {upcoming.length ? <ul className="space-y-3">{upcoming.map((e) => <HostedEvent key={e._id} e={e} />)}</ul> : <p className="text-ink-soft">Nothing coming up.</p>}
          </section>
          {past.length > 0 && (
            <section aria-labelledby="past-title" className="space-y-3">
              <h2 id="past-title" className="text-xl font-bold">Past events</h2>
              <ul className="space-y-3">{past.map((e) => <HostedEvent key={e._id} e={e} over />)}</ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
