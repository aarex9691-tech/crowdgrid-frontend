import { useCallback, useEffect, useRef, useState } from 'react';
import { CircleAlert, CircleCheck, CircleX, ExternalLink } from 'lucide-react';
import API, { errorMessage } from '../../lib/api';
import { DOMAIN_LABELS, fmtDate } from '../../lib/format';
import { formatPhone } from '../../lib/phone';
import Notice, { Loading } from '../../components/Notice';

/*
 * Seva volunteers. The District Control Room (and the Super Admin) approves them after looking at the
 * photo ID they registered with, then checks the same card in person before their first duty.
 * Trusts (NGO admins) see the volunteers who chose them, read-only.
 */

const VIEWS = [
  ['PENDING', 'Waiting'],
  ['IDCHECK', 'ID check in person'],
  ['APPROVED', 'Approved'],
];

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

/** Opens the ID card in a new tab, fetched with the login token (never a public link). */
async function openIdCard(id, setError) {
  setError('');
  const tab = window.open('', '_blank');
  // a blocked pop-up must not replace this page (the queue would be lost)
  if (!tab) return setError('Allow pop-ups for this site to open the ID card in a new tab.');
  try {
    const { data } = await API.get(`/volunteer/applications/${id}/id-card`, { responseType: 'blob' });
    const url = URL.createObjectURL(data);
    tab.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (e) {
    tab?.close();
    const message = await e.response?.data?.text?.().then((t) => JSON.parse(t)?.message).catch(() => '');
    setError(message || errorMessage(e));
  }
}

function Application({ a, canDecide, view, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const c = a.checks || {};
  const u = a.userId || {};

  const act = async (path, body) => {
    setBusy(true);
    setError('');
    try {
      await API.post(`/volunteer/applications/${a._id}/${path}`, body);
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
          <p className="text-lg font-bold">{u.name}</p>
          <p className="text-ink-soft">
            {DOMAIN_LABELS[a.domain]}
            {a.sector ? `, ${a.sector}` : ''}
            {a.providerId?.name ? `, with ${a.providerId.name}` : ''}
          </p>
          {u.phone && <p className="text-[15px]">{formatPhone(u.countryCode, u.phone)}</p>}
          {a.dates?.length > 0 && <p className="text-[15px]">Days: {a.dates.map((d) => fmtDate(d, { year: undefined })).join(', ')}</p>}
          {a.note && <p className="text-[15px] text-ink-soft">“{a.note}”</p>}
        </div>
        <p className="text-sm text-ink-soft">Applied {fmtDate(a.createdAt)}</p>
      </div>

      <div className="mt-3 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <ul className="space-y-1.5 text-[15px]">
          <Check state={c.idType ? true : false}>{c.idType ? `${c.idType} ending in ${c.idLast4}` : 'No photo ID given (applied before IDs were required)'}</Check>
          <Check state={c.idDocument}>{c.idDocument ? 'Photo of the ID card uploaded' : 'No ID card photo'}</Check>
          <Check state={c.photo ? true : null}>{c.photo ? 'Has a profile photo (shown when their badge is scanned)' : 'No profile photo: match the face with the ID card'}</Check>
          {c.accountAgeDays != null && <Check state={c.accountAgeDays >= 7 ? true : null}>Account made {c.accountAgeDays === 0 ? 'today' : `${c.accountAgeDays} day${c.accountAgeDays === 1 ? '' : 's'} ago`}</Check>}
          {a.status === 'APPROVED' && <Check state={c.idVerified ? true : null}>{c.idVerified ? 'ID card checked in person' : 'ID card not yet checked in person'}</Check>}
        </ul>
        {canDecide && c.idDocument && (
          <button type="button" className="btn-ghost" onClick={() => openIdCard(a._id, setError)}>
            <ExternalLink size={18} aria-hidden /> Open the ID card
          </button>
        )}
      </div>

      {canDecide && view === 'PENDING' && (
        <div className="mt-4 border-t border-line pt-3">
          {!rejecting ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-primary" disabled={busy} onClick={() => act('review', { decision: 'APPROVED' })}>Approve volunteer</button>
              <button type="button" className="btn-ghost" disabled={busy} onClick={() => setRejecting(true)}>Reject…</button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="field-label" htmlFor={`vr-${a._id}`}>Reason (the volunteer sees this)</label>
                <input id={`vr-${a._id}`} className="field" maxLength={120} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. The ID photo is not readable" />
              </div>
              <button type="button" className="btn-primary bg-kumkum" disabled={busy || reason.trim().length < 5} onClick={() => act('review', { decision: 'REJECTED', reason: reason.trim() })}>Reject</button>
              <button type="button" className="btn-ghost" disabled={busy} onClick={() => setRejecting(false)}>Back</button>
            </div>
          )}
        </div>
      )}
      {canDecide && view === 'IDCHECK' && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-3">
          <p className="flex-1 text-[15px]">Look at the card in person: same name, same last 4 characters, same face.</p>
          <button type="button" className="btn-primary" disabled={busy} onClick={() => act('verify-id')}>ID card checked</button>
        </div>
      )}
      <Notice tone="error" className="mt-3">{error}</Notice>
    </li>
  );
}

/** canDecide: the control room / Super Admin; trusts get a read-only list. */
export default function VolunteerReview({ canDecide = true }) {
  const [view, setView] = useState('PENDING');
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const latest = useRef(0);

  const load = useCallback(() => {
    const ticket = ++latest.current;
    setError('');
    const params = view === 'PENDING' ? { status: 'PENDING' } : view === 'IDCHECK' ? { status: 'APPROVED', idVerified: 'false' } : { status: 'APPROVED' };
    API.get('/volunteer/applications', { params })
      .then(({ data }) => {
        if (ticket === latest.current) setList({ view, items: data });
      })
      .catch((e) => {
        if (ticket === latest.current) setError(errorMessage(e));
      });
  }, [view]);
  useEffect(() => {
    load();
  }, [load]);

  const items = list?.view === view ? list.items : null;
  const views = canDecide ? VIEWS : VIEWS.filter(([id]) => id !== 'IDCHECK');
  return (
    <section aria-labelledby="vol-review" className="space-y-4">
      <div>
        <h2 id="vol-review" className="text-2xl font-bold">Seva volunteers</h2>
        <p className="text-ink-soft">
          {canDecide
            ? 'Approve volunteers after checking their photo ID. Before their first duty, check the same card in person.'
            : 'Volunteers who chose your trust. The District Control Room approves them and checks their ID.'}
        </p>
      </div>
      <div role="group" aria-label="Show volunteers" className="flex flex-wrap gap-2">
        {views.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={view === id} className={view === id ? 'btn-ink' : 'btn-ghost'} onClick={() => setView(id)}>{label}</button>
        ))}
      </div>
      <Notice tone="error">{error}</Notice>
      {!items && !error && <Loading />}
      {items && !items.length && <p className="text-ink-soft">{view === 'PENDING' ? 'No applications waiting.' : view === 'IDCHECK' ? 'Every approved volunteer has shown their ID.' : 'No approved volunteers yet.'}</p>}
      {items?.length > 0 && (
        <ul className="space-y-3">
          {items.map((a) => <Application key={a._id} a={a} view={view} canDecide={canDecide} onDone={load} />)}
        </ul>
      )}
    </section>
  );
}
