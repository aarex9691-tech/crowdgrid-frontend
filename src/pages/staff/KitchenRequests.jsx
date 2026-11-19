import { useCallback, useEffect, useRef, useState } from 'react';
import { CircleAlert, CircleCheck, CircleX, ExternalLink } from 'lucide-react';
import API, { errorMessage } from '../../lib/api';
import { formatPhone } from '../../lib/phone';
import { fmtDate } from '../../lib/format';
import Notice, { Loading } from '../../components/Notice';
import { PROGRAMME_TYPES } from '../hub/ProgrammesTab';

/*
 * Tabs of the Requests page for kitchen services and programmes for pilgrims:
 *   KitchenServiceQueue  Super Admin: recognise a kitchen service (licence + certificate)
 *   ServiceRequestQueue  District Control Room: may this kitchen serve at this yatra?
 *   ProgrammeQueue       District Control Room: may this programme be held for pilgrims?
 */

const ORG_TYPE = { TRUST: 'Langar / annadan trust', COMMUNITY_KITCHEN: 'Community kitchen', NGO: 'NGO', ASHRAM: 'Ashram or math', COMPANY: 'Company (CSR kitchen)', OTHER: 'Other' };
const ROLE = { KITCHEN_MANAGER: 'Kitchen service', EVENT_HOST: 'Event host', ORG_HOST: 'Organisation host' };

/** The pending list of one queue, guarded against out-of-order replies. */
function useQueue(url) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const latest = useRef(0);
  const load = useCallback(() => {
    const ticket = ++latest.current;
    setError('');
    API.get(url, { params: { status: 'PENDING' } })
      .then(({ data }) => {
        if (ticket === latest.current) setItems(data);
      })
      .catch((e) => {
        if (ticket === latest.current) setError(errorMessage(e));
      });
  }, [url]);
  useEffect(() => {
    load();
  }, [load]);
  return { items, error, load };
}

/** Approve, or reject with a reason the applicant sees. */
function Decide({ url, name, approveLabel, onDone }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const send = async (decision) => {
    setBusy(true);
    setError('');
    try {
      await API.post(url, decision === 'APPROVED' ? { decision } : { decision, reason: reason.trim() });
      onDone();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const id = url.replace(/\W/g, '');
  return (
    <div className="mt-4 border-t border-line pt-3">
      {!rejecting ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary" disabled={busy} aria-label={`${approveLabel}: ${name}`} onClick={() => send('APPROVED')}>{approveLabel}</button>
          <button type="button" className="btn-ghost" disabled={busy} aria-label={`Reject ${name}…`} onClick={() => setRejecting(true)}>Reject…</button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="field-label" htmlFor={`r-${id}`}>Reason (they see this)</label>
            <input id={`r-${id}`} className="field" autoFocus maxLength={200} aria-describedby={`r-${id}-hint`} value={reason} onChange={(e) => setReason(e.target.value)} />
            <p id={`r-${id}-hint`} className="mt-1 text-sm text-ink-soft">At least 5 characters.</p>
          </div>
          <button type="button" className="btn-primary bg-kumkum" disabled={busy || reason.trim().length < 5} onClick={() => send('REJECTED')}>Reject</button>
          <button type="button" className="btn-ghost" disabled={busy} onClick={() => setRejecting(false)}>Back</button>
        </div>
      )}
      <Notice tone="error" className="mt-3">{error}</Notice>
    </div>
  );
}

function Check({ state, children }) {
  const icon = state === true ? <CircleCheck size={18} className="text-tulsi" aria-hidden /> : state === false ? <CircleX size={18} className="text-kumkum" aria-hidden /> : <CircleAlert size={18} className="text-terracotta-dark" aria-hidden />;
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 flex-none">{icon}</span>
      <span><span className="sr-only">{state === true ? 'Passed' : state === false ? 'Failed' : 'Check yourself'}: </span>{children}</span>
    </li>
  );
}

function Queue({ title, lead, empty, state, children }) {
  return (
    <section aria-label={title} className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-ink-soft">{lead}</p>
      </div>
      <Notice tone="error">{state.error}</Notice>
      {!state.items && !state.error && <Loading />}
      {state.items && !state.items.length && <p className="text-ink-soft">{empty}</p>}
      {state.items?.length > 0 && <ul className="space-y-3">{children}</ul>}
    </section>
  );
}

export function KitchenServiceQueue() {
  const q = useQueue('/kitchens/applications');
  const [error, setError] = useState('');
  const open = async (id) => {
    setError('');
    const tab = window.open('', '_blank');
    if (!tab) return setError('Allow pop-ups for this site to open the certificate in a new tab.');
    try {
      const { data } = await API.get(`/kitchens/applications/${id}/document`, { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      tab.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      tab.close();
      setError(errorMessage(e));
    }
  };
  return (
    <>
    <Notice tone="error" className="mb-3">{error}</Notice>
    <Queue title="Kitchen services" lead="Kitchens asking to be recognised. Once recognised, each yatra's District Control Room decides where they serve." empty="No kitchen services waiting." state={q}>
      {q.items?.map((a) => (
        <li key={a._id} className="panel p-4 sm:p-5" data-no-translate>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-lg font-bold">{a.orgName}</h3>
              <p className="text-ink-soft">{ORG_TYPE[a.orgType]}, {a.city}{a.mealsPerDay ? `. About ${a.mealsPerDay.toLocaleString('en-IN')} meals a day` : ''}</p>
            </div>
            <p className="text-sm text-ink-soft">Sent {fmtDate(a.createdAt)}</p>
          </div>
          <dl className="mt-3 grid grid-cols-[9rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-[15px]">
            <dt className="text-ink-soft">{a.checks?.idLabel || a.idType}</dt>
            <dd className="font-mono font-semibold break-all">{a.idNumber}</dd>
            <dt className="text-ink-soft">In charge</dt>
            <dd>{a.contactName}, {formatPhone(a.contactCountryCode, a.contactPhone)}</dd>
            {a.description && (<><dt className="text-ink-soft">About</dt><dd>{a.description}</dd></>)}
          </dl>
          <ul className="mt-3 space-y-1.5 text-[15px]">
            <Check state={a.checks?.idFormat === 'VALID' ? true : null}>{a.checks?.idFormat === 'VALID' ? `${a.checks.idLabel} format is valid` : 'No national format for this number: compare it with the certificate'}</Check>
            <Check state={a.checks?.document}>{a.checks?.document ? 'Certificate uploaded' : 'No certificate'}</Check>
            {a.checks?.previouslyRejected > 0 && <Check state={false}>This number was rejected {a.checks.previouslyRejected} time(s) before</Check>}
          </ul>
          <button type="button" className="btn-ghost mt-3" aria-label={`Open the certificate of ${a.orgName} (opens in a new tab)`} onClick={() => open(a._id)}>
            <ExternalLink size={18} aria-hidden /> Open the certificate
          </button>
          <Decide url={`/kitchens/applications/${a._id}/decision`} name={a.orgName} approveLabel="Recognise kitchen" onDone={q.load} />
        </li>
      ))}
    </Queue>
    </>
  );
}

export function ServiceRequestQueue() {
  const q = useQueue('/kitchens/service-requests');
  return (
    <Queue title="Kitchens asking to serve at a yatra" lead="Recognised kitchen services asking to cook for pilgrims at your yatra. Approve to let them list kitchens and meal tokens here." empty="No kitchens waiting." state={q}>
      {q.items?.map((r) => (
        <li key={r._id} className="panel p-4 sm:p-5" data-no-translate>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-lg font-bold">{r.orgName}</h3>
              <p className="text-ink-soft">At {r.eventId?.title}{r.sector ? `, ${r.sector}` : ''}{r.mealsPerDay ? `. About ${r.mealsPerDay.toLocaleString('en-IN')} meals a day` : ''}</p>
            </div>
            <p className="text-sm text-ink-soft">Sent {fmtDate(r.createdAt)}</p>
          </div>
          <p className="mt-2 text-[15px]">In charge: {r.organiserId?.name}, {formatPhone(r.organiserId?.countryCode, r.organiserId?.phone)}</p>
          {r.note && <p className="text-[15px] text-ink-soft">“{r.note}”</p>}
          <Decide url={`/kitchens/service-requests/${r._id}/decision`} name={`${r.orgName} at ${r.eventId?.title}`} approveLabel="Approve for this yatra" onDone={q.load} />
        </li>
      ))}
    </Queue>
  );
}

export function ProgrammeQueue() {
  const q = useQueue('/programmes');
  return (
    <Queue title="Programmes for pilgrims" lead="Bhandaras, satsangs and health camps that organisations want to hold. Check the place and time against the crowd plan." empty="No programmes waiting." state={q}>
      {q.items?.map((p) => (
        <li key={p._id} className="panel p-4 sm:p-5" data-no-translate>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-terracotta-dark">{PROGRAMME_TYPES[p.type]}</p>
              <h3 className="text-lg font-bold">{p.title}</h3>
              <p className="text-ink-soft">{p.eventId?.title}: {fmtDate(`${p.date}T12:00:00+05:30`, { weekday: 'short' })}, {p.startTime} to {p.endTime}</p>
            </div>
            <span className="pill-quiet">{p.capacity} places</span>
          </div>
          <dl className="mt-3 grid grid-cols-[8rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-[15px]">
            <dt className="text-ink-soft">Place</dt>
            <dd>{p.venue}{p.sector ? `, ${p.sector}` : ''}</dd>
            <dt className="text-ink-soft">Organiser</dt>
            <dd>{p.organiserName} ({ROLE[p.organiserId?.role] || 'organisation'}), {formatPhone(p.organiserId?.countryCode, p.organiserId?.phone)}</dd>
            {p.description && (<><dt className="text-ink-soft">About</dt><dd>{p.description}</dd></>)}
          </dl>
          <Decide url={`/programmes/${p._id}/decision`} name={p.title} approveLabel="Approve programme" onDone={q.load} />
        </li>
      ))}
    </Queue>
  );
}
