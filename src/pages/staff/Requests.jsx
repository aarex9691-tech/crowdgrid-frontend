import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import API, { errorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { formatPhone } from '../../lib/phone';
import { fmtDate } from '../../lib/format';
import PageTitle from '../../components/PageTitle';
import Notice, { Loading } from '../../components/Notice';
import VolunteerReview from './VolunteerReview';
import HostRequests from './HostRequests';

/*
 * Everything waiting for a decision, in one place:
 *   Volunteers       seva applications (photo ID) and the in-person ID check  -> District Control Room
 *   NGOs and trusts  organisations that will run camps and kitchens at a yatra -> District Control Room
 *   Event hosts      organisations that will run their own events               -> Super Admin only
 */

const TYPE = { NGO: 'NGO', TRUST: 'Seva trust', ASHRAM: 'Ashram', GOVT: 'Government' };

function Organisation({ p, onDone }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const decide = async (decision) => {
    setBusy(true);
    setError('');
    try {
      await API.post(`/providers/${p._id}/decision`, { decision, reason: decision === 'REJECTED' ? reason.trim() : undefined });
      onDone();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <li className="panel p-4 sm:p-5" data-no-translate>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-bold">{p.name}</p>
          <p className="text-ink-soft">{TYPE[p.type] || p.type} at {p.eventId?.title}</p>
        </div>
        <p className="text-sm text-ink-soft">Sent {fmtDate(p.createdAt)}</p>
      </div>
      <dl className="mt-3 grid grid-cols-[9rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-[15px]">
        <dt className="text-ink-soft">Registration no.</dt>
        <dd className="font-mono font-semibold">{p.registrationNumber || 'Not given: ask for it'}</dd>
        <dt className="text-ink-soft">Applied by</dt>
        <dd>{p.adminUserId?.name}, {formatPhone(p.adminUserId?.countryCode, p.adminUserId?.phone)}</dd>
        {p.description && (<><dt className="text-ink-soft">Will provide</dt><dd>{p.description}</dd></>)}
      </dl>
      <div className="mt-4 border-t border-line pt-3">
        {!rejecting ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary" disabled={busy} onClick={() => decide('VERIFIED')}>Verify organisation</button>
            <button type="button" className="btn-ghost" disabled={busy} onClick={() => setRejecting(true)}>Reject…</button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="field-label" htmlFor={`pr-${p._id}`}>Reason (the organisation sees this)</label>
              <input id={`pr-${p._id}`} className="field" maxLength={120} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. The registration number does not match the trust's name" />
            </div>
            <button type="button" className="btn-primary bg-kumkum" disabled={busy || reason.trim().length < 5} onClick={() => decide('REJECTED')}>Reject</button>
            <button type="button" className="btn-ghost" disabled={busy} onClick={() => setRejecting(false)}>Back</button>
          </div>
        )}
      </div>
      <Notice tone="error" className="mt-3">{error}</Notice>
    </li>
  );
}

function OrganisationQueue() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const latest = useRef(0);
  const load = useCallback(() => {
    const ticket = ++latest.current;
    setError('');
    API.get('/providers', { params: { status: 'PENDING' } })
      .then(({ data }) => {
        if (ticket === latest.current) setItems(data);
      })
      .catch((e) => {
        if (ticket === latest.current) setError(errorMessage(e));
      });
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  return (
    <section aria-labelledby="org-q" className="space-y-4">
      <div>
        <h2 id="org-q" className="text-2xl font-bold">NGOs and seva trusts</h2>
        <p className="text-ink-soft">Organisations that will run camps and kitchens at a yatra. Once verified they can list beds and meals for pilgrims.</p>
      </div>
      <Notice tone="error">{error}</Notice>
      {!items && !error && <Loading />}
      {items && !items.length && <p className="text-ink-soft">No organisations waiting for verification.</p>}
      {items?.length > 0 && <ul className="space-y-3">{items.map((p) => <Organisation key={p._id} p={p} onDone={load} />)}</ul>}
    </section>
  );
}

export default function Requests() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tabs = [
    ['volunteers', 'Volunteers'],
    ['organisations', 'NGOs and trusts'],
    ...(user?.role === 'SUPER_ADMIN' ? [['hosts', 'Event hosts']] : []),
  ];
  const wanted = params.get('tab');
  const tab = tabs.some(([id]) => id === wanted) ? wanted : 'volunteers';

  return (
    <div className="shell space-y-6 py-6">
      <PageTitle kicker={user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'District Control Room'} tone="blue" title="Requests" lead="Volunteers and organisations waiting for a decision. Nothing goes live until it is checked here." />
      <div role="group" aria-label="Show requests for" className="flex flex-wrap gap-2 border-b border-line pb-3">
        {tabs.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={tab === id} className={tab === id ? 'btn-ink' : 'btn-ghost'} onClick={() => setParams({ tab: id }, { replace: true })}>
            {label}
          </button>
        ))}
      </div>
      <div>
        {tab === 'volunteers' && <VolunteerReview />}
        {tab === 'organisations' && <OrganisationQueue />}
        {tab === 'hosts' && <HostRequests embedded />}
      </div>
    </div>
  );
}
