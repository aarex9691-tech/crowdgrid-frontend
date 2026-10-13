import { useEffect, useState } from 'react';
import API, { errorMessage } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useConfirm } from '../lib/confirm';
import { CATEGORY_LABELS } from '../lib/format';
import Notice from '../components/Notice';
import ProfilePanel from '../components/ProfilePanel';

const PROVIDER_STATUS = { PENDING: 'pill-low', VERIFIED: 'pill-ok', REJECTED: 'pill-out' };

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const confirm = useConfirm();
  const load = () => API.get('/lodgings/bookings/mine').then(({ data }) => setBookings(data)).catch((e) => setError(errorMessage(e)));
  useEffect(() => {
    load();
  }, []);

  const cancel = async (id) => {
    const ok = await confirm({ title: 'Cancel this booking?', message: 'Your beds go back to other pilgrims and the lodging pass stops working.', confirmLabel: 'Cancel booking', cancelLabel: 'Keep booking', tone: 'danger' });
    if (!ok) return;
    try {
      await API.post(`/lodgings/bookings/${id}/cancel`);
      load();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  if (!bookings.length) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-bold">My lodging bookings</h2>
      <Notice tone="error">{error}</Notice>
      <ul className="space-y-3">
        {bookings.map((b) => (
          <li key={b._id} className="panel flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <p className="font-bold">{b.lodgingId?.name}</p>
              <p className="text-ink-soft">
                {CATEGORY_LABELS[b.lodgingId?.category]} · {b.beds} bed{b.beds > 1 ? 's' : ''} · {b.checkIn} to {b.checkOut}
              </p>
              {b.status === 'CONFIRMED' && b.bedLabel && <p className="font-semibold text-tulsi">{b.bedLabel}</p>}
            </div>
            {b.status === 'CONFIRMED' ? (
              <button type="button" className="btn-ghost" onClick={() => cancel(b._id)}>Cancel booking</button>
            ) : (
              <span className="pill-quiet">Cancelled</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function RegisterOrganisation({ onDone }) {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ name: '', type: 'NGO', eventId: '', registrationNumber: '', description: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    API.get('/events', { params: { kind: 'YATRA' } }).then(({ data }) => {
      setEvents(data);
      setForm((f) => ({ ...f, eventId: data[0]?._id || '' }));
    });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await API.post('/providers/apply', form);
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <form onSubmit={submit} className="panel space-y-4 p-5">
      <h2 className="text-2xl font-bold">Register your NGO or seva trust</h2>
      <p className="text-ink-soft">The district authority verifies your organisation. Once verified, you can list camps and kitchens.</p>
      <Notice tone="error">{error}</Notice>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="o-name">Organisation name</label>
          <input id="o-name" className="field" value={form.name} onChange={set('name')} required />
        </div>
        <div>
          <label className="field-label" htmlFor="o-type">Type</label>
          <select id="o-type" className="field" value={form.type} onChange={set('type')}>
            <option value="NGO">NGO</option>
            <option value="TRUST">Seva trust</option>
            <option value="ASHRAM">Ashram</option>
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="o-event">Yatra you will serve at</label>
          <select id="o-event" className="field" value={form.eventId} onChange={set('eventId')}>
            {events.map((e) => <option key={e._id} value={e._id}>{e.title}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="o-reg">Registration number</label>
          <input id="o-reg" className="field" value={form.registrationNumber} onChange={set('registrationNumber')} />
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="o-desc">What you'll provide</label>
        <textarea id="o-desc" rows={2} className="field py-3" value={form.description} onChange={set('description')} />
      </div>
      <button type="submit" className="btn-primary">Send for verification</button>
    </form>
  );
}

function SecurityPanel() {
  const { logout } = useAuth();
  const confirm = useConfirm();
  const [state, setState] = useState({ busy: false, error: '' });
  const logoutAll = async () => {
    const ok = await confirm({ title: 'Log out of every device?', message: 'This signs you out on all phones and computers, including this one.', confirmLabel: 'Log out everywhere', cancelLabel: 'Cancel', icon: 'logout', tone: 'danger' });
    if (!ok) return;
    setState({ busy: true, error: '' });
    try {
      await API.post('/auth/logout-all');
      logout();
      window.location.assign('/login');
    } catch (e) {
      setState({ busy: false, error: errorMessage(e) });
    }
  };
  return (
    <section className="panel space-y-3 p-5">
      <h2 className="text-2xl font-bold">Security</h2>
      <p className="text-ink-soft">Lost your phone, or logged in on someone else's? This signs you out everywhere at once.</p>
      <Notice tone="error">{state.error}</Notice>
      <button type="button" className="btn-ghost" onClick={logoutAll} disabled={state.busy}>
        {state.busy ? 'Logging out…' : 'Log out of all devices'}
      </button>
    </section>
  );
}

export default function Account() {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const loadOrgs = () => API.get('/providers/mine').then(({ data }) => setOrgs(data)).catch(() => {});
  useEffect(() => {
    loadOrgs();
  }, []);

  return (
    <div className="shell max-w-3xl space-y-8 py-6">
      <ProfilePanel />

      <MyBookings />

      {orgs.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-2xl font-bold">My organisations</h2>
          {orgs.map((o) => (
            <div key={o._id} className="panel flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-bold">{o.name}</p>
                <p className="text-ink-soft">{o.eventId?.title}</p>
                {o.rejectionReason && <p className="text-sm text-kumkum">{o.rejectionReason}</p>}
              </div>
              <span className={PROVIDER_STATUS[o.verificationStatus]}>{o.verificationStatus.toLowerCase()}</span>
            </div>
          ))}
          {orgs.some((o) => o.verificationStatus === 'VERIFIED') && user.role === 'USER' && <Notice>Verified. Log out and back in to open your camp manager.</Notice>}
        </section>
      )}

      {user.role === 'USER' && !orgs.some((o) => o.verificationStatus !== 'REJECTED') && (
        showForm ? <RegisterOrganisation onDone={() => { setShowForm(false); loadOrgs(); }} /> : (
          <button type="button" className="btn-ghost" onClick={() => setShowForm(true)}>Register an NGO or seva trust</button>
        )
      )}

      <SecurityPanel />
    </div>
  );
}
