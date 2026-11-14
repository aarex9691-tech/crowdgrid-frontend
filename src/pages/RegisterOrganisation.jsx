import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarPlus, HandHeart } from 'lucide-react';
import API, { errorMessage } from '../lib/api';
import { homeFor, ROLE_LABELS, useAuth } from '../lib/auth';
import PageTitle from '../components/PageTitle';
import Notice, { Loading } from '../components/Notice';
import RegisterOrganisationForm, { PROVIDER_STATUS } from '../components/RegisterOrganisationForm';

/*
 * One door for organisations. Two kinds of work, two verifiers:
 *   - serving pilgrims at a yatra (camps, kitchens, seva): the District Control Room verifies
 *   - hosting their own public or campus events: the Super Admin verifies (Host with CrowdGrid)
 */

function MyOrganisations({ orgs }) {
  if (!orgs.length) return null;
  return (
    <section aria-labelledby="my-orgs" className="panel p-5" data-no-translate>
      <h2 id="my-orgs" className="text-xl font-bold">Your organisations</h2>
      <ul className="mt-3 divide-y divide-line">
        {orgs.map((o) => {
          const [cls, text] = PROVIDER_STATUS[o.verificationStatus] || ['pill-quiet', o.verificationStatus];
          return (
            <li key={o._id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold">{o.name}</span>
                <span className={cls}>{text}</span>
              </div>
              <p className="text-sm text-ink-soft">{o.eventId?.title}</p>
              {o.rejectionReason && <p className="mt-1 text-[15px]"><b>Reason:</b> {o.rejectionReason}</p>}
              {o.verificationStatus === 'VERIFIED' && <p className="mt-1 text-[15px]">Log out and in again to open your camp manager.</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function RegisterOrganisation() {
  const { user } = useAuth();
  const location = useLocation();
  const [orgs, setOrgs] = useState(null);
  const [error, setError] = useState('');
  const isPilgrim = user?.role === 'USER';

  const load = () => {
    setError('');
    return API.get('/providers/mine')
      .then(({ data }) => setOrgs(data))
      .catch((e) => setError(errorMessage(e)));
  };
  useEffect(() => {
    if (isPilgrim) load();
  }, [isPilgrim]);

  const open = orgs?.some((o) => o.verificationStatus !== 'REJECTED');
  let side;
  if (!user) {
    side = (
      <div className="panel p-5 sm:p-6">
        <h2 className="text-2xl font-bold">Register your NGO or seva trust</h2>
        <p className="mt-2 text-ink-soft">Log in, or create a free account with your mobile number, then fill in your organisation's details here.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/login" state={{ from: location.pathname }} className="btn-primary">Log in</Link>
          <Link to="/register" state={{ from: location.pathname }} className="btn-ghost">Create an account</Link>
        </div>
      </div>
    );
  } else if (!isPilgrim) {
    side = (
      <div className="panel p-5 sm:p-6">
        <h2 className="text-2xl font-bold">You have a {ROLE_LABELS[user.role] || 'staff'} account</h2>
        <p className="mt-2 text-ink-soft">Staff accounts cannot register an organisation. Apply from the organisation's own account.</p>
        <Link to={homeFor(user.role)} className="btn-primary mt-4">Open my dashboard</Link>
      </div>
    );
  } else if (!orgs) {
    side = error ? (
      <div className="space-y-3">
        <Notice tone="error">{error}</Notice>
        <button type="button" className="btn-ghost" onClick={load}>Try again</button>
      </div>
    ) : (
      <Loading />
    );
  } else {
    side = (
      <div className="space-y-4">
        <MyOrganisations orgs={orgs} />
        {open ? <Notice>Your organisation is registered. You can register another once this one has been reviewed.</Notice> : <RegisterOrganisationForm onDone={load} />}
      </div>
    );
  }

  return (
    <div className="shell space-y-6 py-8">
      <PageTitle
        kicker="For organisations"
        tone="green"
        title="Register your organisation"
        lead="Every organisation on CrowdGrid is verified before it goes live. Choose what you want to do."
      />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-12">
        <div className="space-y-4">
          <div className="panel border-tulsi p-5">
            <HandHeart className="text-tulsi" size={28} aria-hidden />
            <h2 className="mt-2 text-xl font-bold">Serve pilgrims at a yatra</h2>
            <p className="mt-1 text-ink-soft">NGOs, seva trusts and ashrams running camps, langar kitchens or seva at the Kumbh and other yatras.</p>
            <p className="mt-2 text-[15px]"><b>Verified by</b> the District Control Room. Register with the form on this page.</p>
          </div>
          <div className="panel p-5">
            <CalendarPlus className="text-blue" size={28} aria-hidden />
            <h2 className="mt-2 text-xl font-bold">Host your own events</h2>
            <p className="mt-1 text-ink-soft">Colleges, charities, cultural groups and companies running public events or invite-only campus events.</p>
            <p className="mt-2 text-[15px]"><b>Verified by</b> the CrowdGrid team (Super Admin).</p>
            <Link to="/host-with-us" className="btn-ghost mt-3">Apply to host events</Link>
          </div>
        </div>
        <div>{side}</div>
      </div>
    </div>
  );
}
