import { useCallback, useEffect, useRef, useState } from 'react';
import { CircleAlert, CircleCheck, CircleX, ExternalLink } from 'lucide-react';
import API, { errorMessage } from '../../lib/api';
import { formatPhone } from '../../lib/phone';
import { fmtDate } from '../../lib/format';
import PageTitle from '../../components/PageTitle';
import Notice, { Loading } from '../../components/Notice';
import { useCelebrate } from '../../components/SuccessSplash';

/*
 * Super Admin: organisations asking to host events. Each request shows a checklist worked out
 * by the server; the certificate opens in a new tab. Approve (the account becomes a host) or
 * reject with a reason the organisation will see.
 */

const KIND = { PUBLIC: 'Public events', CORPORATE: 'Campus & corporate events', BOTH: 'Public and campus events' };
const ROLE_AFTER = { PUBLIC: 'Event Host', CORPORATE: 'Corporate Admin', BOTH: 'Organisation Host' };
const ORG_TYPE = { EDUCATION: 'College / university / school', CHARITY: 'Charity / NGO / trust', CULTURAL: 'Cultural or religious group', COMPANY: 'Company / business', GOVT: 'Government body', OTHER: 'Other' };
const TABS = [
  ['PENDING', 'Waiting'],
  ['APPROVED', 'Approved'],
  ['REJECTED', 'Not approved'],
];

/** One line of the checklist: a tick, a cross, or a question mark (look yourself), with words. */
function Check({ state, children }) {
  const icon = state === true ? <CircleCheck size={18} className="text-tulsi" aria-hidden /> : state === false ? <CircleX size={18} className="text-kumkum" aria-hidden /> : <CircleAlert size={18} className="text-terracotta-dark" aria-hidden />;
  const word = state === true ? 'Passed' : state === false ? 'Failed' : 'Check yourself';
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 flex-none">{icon}</span>
      <span><span className="sr-only">{word}: </span>{children}</span>
    </li>
  );
}

function Request({ a, onDone }) {
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const celebrate = useCelebrate();
  const c = a.checks || {};

  const openCertificate = async () => {
    setError('');
    // fetched with the login token, then shown from memory (the file is never cached or linked)
    const tab = window.open('', '_blank');
    try {
      const { data } = await API.get(`/hosts/${a._id}/document`, { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      if (tab) tab.location.href = url;
      else window.location.assign(url);
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      tab?.close();
      // the reply was asked for as a file, so a server message arrives as a Blob of JSON
      const message = await e.response?.data?.text?.().then((t) => JSON.parse(t)?.message).catch(() => '');
      setError(message || errorMessage(e));
    }
  };

  const decide = async (decision) => {
    setError('');
    if (decision === 'REJECTED' && reason.trim().length < 5) return setError('Write a reason: the organisation will see it.');
    setBusy(true);
    try {
      await API.post(`/hosts/${a._id}/decision`, decision === 'APPROVED' ? { decision, note: note.trim() || undefined } : { decision, reason: reason.trim() });
      celebrate(decision === 'APPROVED'
        ? { title: 'Organisation approved', line: `${a.orgName} can now host ${KIND[a.kind].toLowerCase()}.` }
        : { tone: 'cancel', title: 'Request not approved', line: `${a.orgName} will see your reason.` });
      onDone();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    // organisation names, people and registration numbers are never sent to the translation service
    <li className="panel p-5" data-no-translate>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold">{a.orgName}</h2>
          <p className="text-ink-soft">{ORG_TYPE[a.orgType]}, {a.city}. Wants to host <b className="text-ink">{KIND[a.kind].toLowerCase()}</b>{a.expectedSize ? `, up to about ${a.expectedSize.toLocaleString('en-IN')} people` : ''}.</p>
        </div>
        <p className="text-sm text-ink-soft">Sent {fmtDate(a.createdAt)}</p>
      </div>

      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <dl className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[15px]">
          <dt className="text-ink-soft">{c.idLabel || a.idType}</dt>
          <dd className="font-mono font-semibold break-all">{a.idNumber}</dd>
          <dt className="text-ink-soft">Contact</dt>
          <dd>{a.contactName}, <a className="font-semibold text-blue underline" href={`tel:+${a.contactCountryCode}${a.contactPhone}`}>{formatPhone(a.contactCountryCode, a.contactPhone)}</a></dd>
          {a.contactEmail && (<><dt className="text-ink-soft">Email</dt><dd className="break-all">{a.contactEmail}</dd></>)}
          {a.website && (<><dt className="text-ink-soft">Website</dt><dd className="break-all"><a className="text-blue underline" href={a.website} target="_blank" rel="noreferrer noopener">{a.website.replace(/^https?:\/\//, '')}</a></dd></>)}
          <dt className="text-ink-soft">Applied by</dt>
          <dd>{a.applicantId?.name}, {formatPhone(a.applicantId?.countryCode, a.applicantId?.phone)}</dd>
          {a.description && (<><dt className="text-ink-soft">About</dt><dd>{a.description}</dd></>)}
        </dl>

        <div>
          <h3 className="font-bold">Verification checklist</h3>
          <ul className="mt-2 space-y-1.5 text-[15px]">
            <Check state={c.idFormat === 'VALID' ? true : null}>
              {c.idFormat === 'VALID' ? `${c.idLabel} format is valid${a.idType === 'GSTIN' ? ' (check digit correct)' : ''}` : `${c.idLabel || 'This number'} has no national format: compare it with the certificate`}
            </Check>
            <Check state={c.document}>{c.document ? 'Registration certificate uploaded' : 'No certificate'}</Check>
            <Check state={c.websiteMatchesEmail}>
              {c.websiteMatchesEmail === true ? 'The email belongs to the website\'s domain' : c.websiteMatchesEmail === false ? 'The email is not on the website\'s domain: call the contact number' : 'No website or no email to compare: call the contact number'}
            </Check>
            {c.accountAgeDays == null ? (
              <Check state={false}>The applicant's account no longer exists: reject this request</Check>
            ) : (
              <Check state={c.accountAgeDays >= 7 ? true : null}>Account made {c.accountAgeDays === 0 ? 'today' : `${c.accountAgeDays} day${c.accountAgeDays === 1 ? '' : 's'} ago`}</Check>
            )}
            {c.previouslyRejected > 0 && <Check state={false}>This number was rejected {c.previouslyRejected} time{c.previouslyRejected > 1 ? 's' : ''} before</Check>}
          </ul>
          <button type="button" className="btn-ghost mt-3" onClick={openCertificate}>
            <ExternalLink size={18} aria-hidden /> Open the certificate
          </button>
        </div>
      </div>

      {a.status === 'PENDING' ? (
        <div className="mt-5 border-t border-line pt-4">
          {!rejecting ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="field-label" htmlFor={`note-${a._id}`}>Note for the record <span className="font-normal text-ink-soft">(optional)</span></label>
                <input id={`note-${a._id}`} className="field" value={note} maxLength={120} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Called the principal's office, certificate matches" />
              </div>
              {c.accountAgeDays != null && <button type="button" className="btn-primary" disabled={busy} onClick={() => decide('APPROVED')}>Approve as {ROLE_AFTER[a.kind]}</button>}
              <button type="button" className="btn-ghost" disabled={busy} onClick={() => setRejecting(true)}>Reject…</button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="field-label" htmlFor={`reason-${a._id}`}>Reason (the organisation sees this)</label>
                <input id={`reason-${a._id}`} className="field" value={reason} maxLength={120} onChange={(e) => setReason(e.target.value)} placeholder="e.g. The certificate is for a different trust" />
              </div>
              <button type="button" className="btn-primary bg-kumkum" disabled={busy} onClick={() => decide('REJECTED')}>Reject request</button>
              <button type="button" className="btn-ghost" disabled={busy} onClick={() => setRejecting(false)}>Back</button>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-4 border-t border-line pt-3 text-[15px]">
          {a.status === 'APPROVED' ? 'Approved' : 'Not approved'} {a.reviewedAt ? fmtDate(a.reviewedAt) : ''}
          {a.reviewNote ? `. Note: ${a.reviewNote}` : ''}
          {a.rejectionReason ? `. Reason: ${a.rejectionReason}` : ''}
        </p>
      )}
      <Notice tone="error" className="mt-3">{error}</Notice>
    </li>
  );
}

export default function HostRequests() {
  const [status, setStatus] = useState('PENDING');
  const [list, setList] = useState(null);
  const [error, setError] = useState('');

  // a counter so a slow reply for an earlier tab never replaces the newer one
  const latest = useRef(0);
  const load = useCallback(() => {
    const ticket = ++latest.current;
    setError('');
    API.get('/hosts', { params: { status } })
      .then(({ data }) => {
        if (ticket === latest.current) setList({ status, items: data });
      })
      .catch((e) => {
        if (ticket === latest.current) setError(errorMessage(e));
      });
  }, [status]);
  useEffect(() => {
    load();
  }, [load]);

  const items = list?.status === status ? list.items : null;
  return (
    <div className="shell space-y-6 py-8">
      <PageTitle kicker="Super Admin" tone="blue" title="Host requests" lead="Organisations asking to run their own events. Check the number and the certificate before approving." />
      <div role="group" aria-label="Show requests" className="flex flex-wrap gap-2">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={status === id} className={status === id ? 'btn-ink' : 'btn-ghost'} onClick={() => setStatus(id)}>{label}</button>
        ))}
      </div>
      <Notice tone="error">{error}</Notice>
      {!items && !error && <Loading />}
      {items && !items.length && <p className="text-ink-soft">{status === 'PENDING' ? 'No requests are waiting.' : 'Nothing here yet.'}</p>}
      {items && items.length > 0 && <ul className="space-y-4">{items.map((a) => <Request key={a._id} a={a} onDone={load} />)}</ul>}
    </div>
  );
}
