import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import API, { errorMessage } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useConfirm } from '../lib/confirm';
import { useCelebrate } from '../components/SuccessSplash';
import { CATEGORY_LABELS } from '../lib/format';
import Notice from '../components/Notice';
import ProfilePanel from '../components/ProfilePanel';

import { PROVIDER_STATUS } from '../components/RegisterOrganisationForm';

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const load = () => API.get('/lodgings/bookings/mine').then(({ data }) => setBookings(data)).catch((e) => setError(errorMessage(e)));
  useEffect(() => {
    load();
  }, []);

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
              <Link to="/passbook" className="btn-ghost">Cancel in My Passbook</Link>
            ) : (
              <span className="pill-quiet">Cancelled</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function SecurityPanel() {
  const { logout } = useAuth();
  const confirm = useConfirm();
  const celebrate = useCelebrate();
  const [state, setState] = useState({ busy: false, error: '' });
  const logoutAll = async () => {
    const ok = await confirm({ title: 'Log out of every device?', message: 'This signs you out on all phones and computers, including this one.', confirmLabel: 'Log out everywhere', cancelLabel: 'Cancel', icon: 'logout', tone: 'danger' });
    if (!ok) return;
    setState({ busy: true, error: '' });
    try {
      await API.post('/auth/logout-all');
      celebrate({
        tone: 'leave',
        title: 'Logged out everywhere',
        line: 'Every phone and computer is signed out.',
        then: () => { logout(); window.location.assign('/login'); },
      });
    } catch (e) {
      setState({ busy: false, error: errorMessage(e) });
    }
  };
  return (
    <section className="panel space-y-3 p-5">
      <h2 className="text-2xl font-bold">Security</h2>
      <p className="text-ink-soft">Lost your phone, or logged in on someone else's? This signs you out everywhere at once.</p>
      <Notice tone="error">{state.error}</Notice>
      <div className="flex flex-wrap gap-2">
        <Link to="/set-password" className="btn-ghost">Change password</Link>
        <button type="button" className="btn-ghost" onClick={logoutAll} disabled={state.busy}>
          {state.busy ? 'Logging out…' : 'Log out of all devices'}
        </button>
      </div>
    </section>
  );
}

export default function Account() {
  const { user } = useAuth();
  const saved = useLocation().state?.saved;
  const [orgs, setOrgs] = useState([]);
  const loadOrgs = () => API.get('/providers/mine').then(({ data }) => setOrgs(data)).catch(() => {});
  useEffect(() => {
    loadOrgs();
  }, []);

  return (
    <div className="shell max-w-3xl space-y-8 py-6">
      {saved && <Notice tone="success">{saved}</Notice>}
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
              <span className={PROVIDER_STATUS[o.verificationStatus]?.[0]}>{PROVIDER_STATUS[o.verificationStatus]?.[1]}</span>
            </div>
          ))}
          {orgs.some((o) => o.verificationStatus === 'VERIFIED') && user.role === 'USER' && <Notice>Verified. Log out and back in to open your camp manager.</Notice>}
        </section>
      )}

      {user.role === 'USER' && !orgs.some((o) => o.verificationStatus !== 'REJECTED') && (
        <Link to="/register-organisation" className="btn-ghost">Register your organisation</Link>
      )}

      <SecurityPanel />
    </div>
  );
}
