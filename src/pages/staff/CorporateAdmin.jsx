import { useCallback, useEffect, useState } from 'react';
import { Coffee, Copy, Mail, MessageCircle, Plus, Presentation, Printer, RefreshCw, Trash2, Users, X } from 'lucide-react';
import API, { errorMessage } from '../../lib/api';
import { addDaysIST, fmtDate, fmtDateTime, fmtTime, todayIST } from '../../lib/format';
import DateTimeRange, { toIsoRange, windowError } from '../../components/DateTimeRange';
import Notice, { Loading } from '../../components/Notice';
import { useConfirm } from '../../lib/confirm';
import { TextField } from '../../components/Fields';
import { cleanText, firstError, textError } from '../../lib/validate';
import QrCode from '../../components/QrCode';
import PageTitle from '../../components/PageTitle';

const inviteLinkFor = (event) => `${window.location.origin}/corporate/${event.slug}?code=${event.accessCode}`;
const spacedCode = (code) => (code ? `${code.slice(0, 3)} ${code.slice(3)}` : '');

const invitationText = (event) =>
  [
    `You're invited: ${event.title}`,
    event.companyName,
    `${event.venue}, ${event.city}`,
    `${fmtDate(event.startDate)}, ${fmtTime(event.startDate)} to ${fmtTime(event.endDate)}`,
    '',
    `Access code: ${event.accessCode}`,
    `Claim your digital badge: ${inviteLinkFor(event)}`,
    '',
    'Log in or create a free CrowdGrid account with the mobile number or email this was sent to, then confirm the code and pick your sessions. Show the badge QR at the registration desk.',
  ].join('\n');

function useCopy() {
  const [copied, setCopied] = useState('');
  const copy = async (key, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      setCopied('');
    }
  };
  return [copied, copy];
}

/** Printable invitation card: shown in an overlay, printed on its own. */
function InvitationCard({ event, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/60 p-4 print:static print:bg-white print:p-0" role="dialog" aria-modal="true" aria-label="Invitation card">
      <div className="w-full max-w-md">
        <div className="mb-3 flex justify-end gap-2 print:hidden">
          <button type="button" className="btn-primary" onClick={() => window.print()}>
            <Printer size={18} aria-hidden /> Print or save as PDF
          </button>
          <button type="button" className="btn-ghost" onClick={onClose} aria-label="Close">
            <X size={18} aria-hidden />
          </button>
        </div>
        <article className="print-area overflow-hidden rounded-3xl bg-white text-ink shadow-xl print:shadow-none">
          <div className="cg-band px-6 py-5">
            <p className="text-blue-mist">{event.companyName} invites you to</p>
            <h2 className="font-display text-3xl leading-tight">{event.title}</h2>
          </div>
          <div className="space-y-4 p-6">
            <p className="text-lg">
              {event.venue}, {event.city}
              <br />
              {fmtDate(event.startDate)}, {fmtTime(event.startDate)} to {fmtTime(event.endDate)}
            </p>
            {event.sessions?.length > 0 && (
              <ul className="space-y-1 text-[15px]">
                {event.sessions.map((s) => (
                  <li key={s.code} className="flex justify-between gap-3 border-b border-dashed border-line pb-1">
                    <span>{s.title}</span>
                    <span className="text-ink-soft">{s.time}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center gap-5 rounded-2xl bg-mist p-4">
              <QrCode value={inviteLinkFor(event)} size={128} label="QR code that opens the invitation" />
              <div>
                <p className="text-sm text-ink-soft">Access code</p>
                <p className="text-3xl font-extrabold tracking-widest tabular-nums">{spacedCode(event.accessCode)}</p>
                <p className="mt-1 text-sm text-ink-soft">Scan to claim your badge, or enter the code on CrowdGrid.</p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

/** Who may claim a badge: only mobile numbers and emails on this list (the code alone is not enough). */
function InviteList({ event, onChanged }) {
  const [entries, setEntries] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const add = async (e) => {
    e.preventDefault();
    if (!entries.trim()) return setError('Type at least one mobile number or email');
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const { data } = await API.post(`/events/${event._id}/corporate/invitees`, { entries });
      setResult(data);
      // keep anything not recognised in the box, so it can be fixed instead of typed again
      setEntries((data.skipped || []).join('\n'));
      onChanged?.();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={add} className="space-y-2" data-no-translate>
      <label htmlFor={`inv-${event._id}`} className="font-bold">1. Add the people you are inviting</label>
      <p className="text-sm text-ink-soft">Only these people can claim a badge, even if the code is shared. One mobile number or email per line.</p>
      <textarea id={`inv-${event._id}`} rows={4} className="field py-3 font-mono text-[15px]" value={entries} onChange={(e) => setEntries(e.target.value)} placeholder={'9876543210\nprincipal@college.edu.in'} />
      <button type="submit" className="btn-ink" disabled={busy}>{busy ? 'Adding…' : 'Add to the invite list'}</button>
      {result && <Notice tone="success">{result.added} added; {result.invitees} invited in all.</Notice>}
      {result?.skipped?.length > 0 && <Notice tone="error">Not recognised, left in the box to fix: {result.skipped.join(', ')}</Notice>}
      <Notice tone="error">{error}</Notice>
    </form>
  );
}

function InvitePanel({ event }) {
  const [copied, copy] = useCopy();
  const [showCard, setShowCard] = useState(false);
  const text = invitationText(event);
  const subject = `Invitation: ${event.title}`;

  return (
    <div className="space-y-4 rounded-2xl border border-line bg-mist p-4">
      <InviteList event={event} />
      <h4 className="font-bold">2. Send them the invitation</h4>
      <pre className="whitespace-pre-wrap rounded-xl border border-line bg-white p-3 font-sans text-[15px]">{text}</pre>
      <div className="flex flex-wrap gap-2">
        <a className="btn-ink" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">
          <MessageCircle size={18} aria-hidden /> Share on WhatsApp
        </a>
        <a className="btn-ghost" href={`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`}>
          <Mail size={18} aria-hidden /> Send by email
        </a>
        <button type="button" className="btn-ghost" onClick={() => copy('text', text)}>
          <Copy size={18} aria-hidden /> {copied === 'text' ? 'Invitation copied' : 'Copy invitation'}
        </button>
        <button type="button" className="btn-ghost" onClick={() => copy('link', inviteLinkFor(event))}>
          <Copy size={18} aria-hidden /> {copied === 'link' ? 'Link copied' : 'Copy link only'}
        </button>
        <button type="button" className="btn-ghost" onClick={() => setShowCard(true)}>
          <Printer size={18} aria-hidden /> Invitation card with QR
        </button>
      </div>
      <p className="text-sm text-ink-soft">
        WhatsApp and email open on this device with the message ready; choose the recipients there. The link already contains the access code.
      </p>
      {showCard && <InvitationCard event={event} onClose={() => setShowCard(false)} />}
    </div>
  );
}

function AttendeeList({ event }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const confirm = useConfirm();
  const load = useCallback(() => {
    API.get(`/events/${event._id}/corporate/attendees`)
      .then(({ data }) => setRows(data))
      .catch((e) => setError(errorMessage(e)));
  }, [event._id]);
  useEffect(() => {
    load();
  }, [load]);

  const withdraw = async (contact) => {
    const ok = await confirm({ title: 'Withdraw this invitation?', message: `${contact} will no longer be able to claim a badge.`, confirmLabel: 'Withdraw', tone: 'danger' });
    if (!ok) return;
    setBusy(contact);
    setError('');
    try {
      await API.post(`/events/${event._id}/corporate/invitees/remove`, { contact });
      load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy('');
    }
  };

  if (!rows && error) return <Notice tone="error">{error}</Notice>;
  if (!rows) return <Loading label="Loading attendees" />;
  if (!rows.length) return <Notice>No one is invited yet. Use “Invite attendees” to add mobile numbers or emails.</Notice>;
  const claimed = rows.filter((r) => r.claimed).length;
  return (
    <div className="space-y-2" data-no-translate>
      <p className="text-sm text-ink-soft">{rows.length} invited or attending, {claimed} badge{claimed === 1 ? '' : 's'} claimed.</p>
      <Notice tone="error">{error}</Notice>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[620px] text-left text-[15px]">
          <caption className="sr-only">Invited people and attendees of {event.title}</caption>
          <thead className="bg-mist text-ink-soft">
            <tr>
              <th className="px-4 py-2 font-semibold">Person</th>
              <th className="px-4 py-2 font-semibold">Sessions</th>
              <th className="px-4 py-2 font-semibold">Badge</th>
              <th className="px-4 py-2 font-semibold">At venue</th>
              <th className="px-4 py-2"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r._id}>
                <td className="px-4 py-2">
                  <span className="font-medium">{r.name || 'Not signed up yet'}</span>
                  <span className="block text-sm text-ink-soft">{r.phone || r.contact}</span>
                </td>
                <td className="px-4 py-2 text-ink-soft">{r.sessions.join(', ') || '-'}</td>
                <td className="px-4 py-2">{r.claimed ? <span className="text-ink-soft">Claimed {fmtDateTime(r.claimedAt)}</span> : <span className="pill-low">Invited, not claimed</span>}</td>
                <td className="px-4 py-2">
                  {r.checkedIn ? <span className="pill-ok">Checked in {fmtTime(r.checkedInAt)}</span> : <span className="pill-quiet">Not yet</span>}
                </td>
                <td className="px-4 py-2 text-right">
                  {r.invited && !r.claimed && (
                    <button type="button" className="btn-ghost min-h-11 px-3 text-sm" disabled={busy === r.invited} aria-label={`Withdraw the invitation for ${r.invited}`} onClick={() => withdraw(r.invited)}>
                      <Trash2 size={16} aria-hidden /> Withdraw
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EventCard({ event, onChanged, highlight, ended }) {
  const [copied, copy] = useCopy();
  const [open, setOpen] = useState(highlight ? 'invite' : null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const confirm = useConfirm();

  const regenerate = async () => {
    const ok = await confirm({ title: 'Generate a new access code?', message: 'The current code stops working immediately, so anyone you already invited will need the new one.', confirmLabel: 'Generate new code', tone: 'danger' });
    if (!ok) return;
    setBusy(true);
    setError('');
    try {
      await API.post(`/events/${event._id}/corporate/code`);
      onChanged();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const toggle = (panel) => setOpen((o) => (o === panel ? null : panel));

  return (
    <li className={`panel space-y-4 p-5 ${highlight ? 'border-marigold' : ''}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex-1">
          <p className="text-ink-soft">{event.companyName}</p>
          <h3 className="text-xl font-bold">{event.title}</h3>
          <p className="text-ink-soft">
            {event.venue}, {event.city} · {fmtDateTime(event.startDate)}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="pill-quiet">
              <Users size={14} aria-hidden /> {event.badgesClaimed} badge{event.badgesClaimed === 1 ? '' : 's'} claimed
            </span>
            <span className={event.checkedIn ? 'pill-ok' : 'pill-quiet'}>{event.checkedIn} checked in</span>
            {ended && <span className="pill-out">Ended</span>}
          </div>
        </div>
        {!ended && (
        <div className="rounded-2xl bg-mist p-4 md:min-w-56">
          <p className="text-sm text-ink-soft">Access code</p>
          <p className="text-3xl font-extrabold tracking-widest tabular-nums">{spacedCode(event.accessCode)}</p>
          <div className="mt-2 flex gap-2">
            <button type="button" className="btn-ghost min-h-11 px-3 text-sm" onClick={() => copy('code', event.accessCode)}>
              <Copy size={16} aria-hidden /> {copied === 'code' ? 'Copied' : 'Copy'}
            </button>
            <button type="button" className="btn-ghost min-h-11 px-3 text-sm" onClick={regenerate} disabled={busy}>
              <RefreshCw size={16} aria-hidden /> {busy ? 'Working…' : 'Regenerate'}
            </button>
          </div>
        </div>
        )}
      </div>
      <Notice tone="error">{error}</Notice>
      <div className="flex flex-wrap gap-2">
        {!ended && (
          <button type="button" className={open === 'invite' ? 'btn-ink' : 'btn-ghost'} aria-expanded={open === 'invite'} onClick={() => toggle('invite')}>
            Invite attendees
          </button>
        )}
        <button type="button" className={open === 'people' ? 'btn-ink' : 'btn-ghost'} aria-expanded={open === 'people'} onClick={() => toggle('people')}>
          Invited and attendees
        </button>
      </div>
      {open === 'invite' && <InvitePanel event={event} />}
      {open === 'people' && <AttendeeList event={event} />}
    </li>
  );
}

const emptySession = (kind = 'SESSION') => ({ title: '', time: '', kind });

function CreateEventForm({ onCreated, onCancel }) {
  const [form, setForm] = useState({
    title: '',
    companyName: '',
    venue: '',
    city: 'Nashik',
    description: '',
  });
  const [when, setWhen] = useState({ date: addDaysIST(todayIST(), 1), start: '10:00', end: '17:00' });
  const [sessions, setSessions] = useState([emptySession(), emptySession('MEAL')]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false);
  const put = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const setSession = (i, k, v) => setSessions((list) => list.map((s, j) => (j === i ? { ...s, [k]: v } : s)));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setTried(true);
    const filled = sessions.filter((s) => s.title.trim());
    const problem = firstError(
      textError(form.title, 'Event title', 'title', { required: true }),
      textError(form.companyName, 'Organisation name', 'orgName', { required: true }),
      textError(form.venue, 'Venue', 'venue', { required: true }),
      textError(form.city, 'City', 'city', { required: true }),
      windowError(when),
      textError(form.description, 'Description', 'longText'),
      filled.length ? '' : 'Add at least one session or meal',
      ...filled.map((x, i) => textError(x.title, `Session ${i + 1} title`, { min: 2, max: 120, kind: 'text' })),
    );
    if (problem) return setError(`Please fix the highlighted fields. ${problem}`);
    setBusy(true);
    try {
      const { data } = await API.post('/events', {
        kind: 'CORPORATE',
        title: form.title,
        companyName: form.companyName,
        venue: form.venue,
        city: form.city,
        description: form.description,
        ...toIsoRange(when),
        sessions: filled,
      });
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
        <h2 className="text-2xl font-bold">New campus or corporate event</h2>
        <button type="button" className="btn-ghost min-h-11 px-3" onClick={onCancel} aria-label="Close form">
          <X size={18} aria-hidden />
        </button>
      </div>
      <Notice tone="error">{error}</Notice>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField id="ce-title" label="Event title" rule="title" required value={form.title} onChange={put('title')} showErrors={tried} placeholder="e.g. Annual Tech Fest 2026" />
        <TextField id="ce-company" label="College or company" rule="orgName" required value={form.companyName} onChange={put('companyName')} showErrors={tried} placeholder="e.g. St. Xavier's Technical Institute" />
        <TextField id="ce-venue" label="Venue" rule="venue" required value={form.venue} onChange={put('venue')} showErrors={tried} placeholder="e.g. Main Auditorium" />
        <TextField id="ce-city" label="City" rule="city" required value={form.city} onChange={put('city')} showErrors={tried} />
      </div>
      <DateTimeRange idPrefix="ce" value={when} onChange={setWhen} />
      <TextField id="ce-desc" label="Short description" rule="longText" multiline rows={2} value={form.description} onChange={put('description')} showErrors={tried} />

      <fieldset className="space-y-2">
        <legend className="field-label">Sessions and meals attendees can choose</legend>
        {sessions.map((s, i) => (
          <div key={i} className="grid grid-cols-[1fr_7rem_auto_auto] items-center gap-2">
            <input className="field" placeholder={s.kind === 'MEAL' ? 'e.g. Networking lunch' : 'e.g. Keynote address'} aria-label={`Session ${i + 1} title`} value={s.title} maxLength={120} onChange={(e) => setSession(i, 'title', cleanText(e.target.value, { max: 120, kind: 'text' }))} />
            <input type="time" className="field px-2" aria-label={`Session ${i + 1} time`} value={s.time} onChange={(e) => setSession(i, 'time', e.target.value)} />
            <button
              type="button"
              className="btn-ghost min-h-12 px-3"
              onClick={() => setSession(i, 'kind', s.kind === 'MEAL' ? 'SESSION' : 'MEAL')}
              title={s.kind === 'MEAL' ? 'Meal (click to make it a session)' : 'Session (click to make it a meal)'}
              aria-label={`Session ${i + 1} is a ${s.kind === 'MEAL' ? 'meal' : 'session'}; toggle type`}
            >
              {s.kind === 'MEAL' ? <Coffee size={18} /> : <Presentation size={18} />}
            </button>
            <button type="button" className="btn-ghost min-h-12 px-3" onClick={() => setSessions((l) => l.filter((_, j) => j !== i))} aria-label={`Remove session ${i + 1}`} disabled={sessions.length === 1}>
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        <button type="button" className="btn-ghost" onClick={() => setSessions((l) => [...l, emptySession()])}>
          <Plus size={18} aria-hidden /> Add session
        </button>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Creating…' : 'Create event and generate code'}
        </button>
        <span className="text-sm text-ink-soft">A random 6-digit access code is generated for you.</span>
      </div>
    </form>
  );
}

export default function CorporateAdmin() {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [justCreated, setJustCreated] = useState(null);
  const [showPast, setShowPast] = useState(false);
  const [now] = useState(() => Date.now());

  const load = useCallback(() => {
    API.get('/events/corporate/mine')
      .then(({ data }) => setEvents(data))
      .catch((e) => setError(errorMessage(e)));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="shell space-y-6 py-6">
      <div className="cg-pagehead">
        <PageTitle kicker="Campus and corporate" tone="green" title="Invite-only events" lead="Only the people on your invite list can claim a badge. See who is invited, who claimed and who arrived." />
        <div className="flex flex-wrap gap-2">
          {!creating && (
            <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
              <Plus size={18} aria-hidden /> New event
            </button>
          )}
        </div>
      </div>

      {creating && (
        <CreateEventForm
          onCancel={() => setCreating(false)}
          onCreated={(ev) => {
            setCreating(false);
            setJustCreated(ev._id);
            load();
          }}
        />
      )}
      {justCreated && <Notice tone="success">Event created and an access code generated. Use “Invite attendees” below to send it.</Notice>}
      <Notice tone="error">{error}</Notice>

      {!events ? (
        <Loading label="Loading your events" />
      ) : events.length === 0 ? (
        <Notice>You have no corporate events yet. Create one to get an access code.</Notice>
      ) : (
        <>
          {(() => {
            const upcoming = events.filter((e) => new Date(e.endDate).getTime() >= now);
            const past = events.filter((e) => new Date(e.endDate).getTime() < now).reverse();
            return (
              <>
                <h2 className="text-xl font-bold">Upcoming ({upcoming.length})</h2>
                {upcoming.length === 0 ? (
                  <Notice>No upcoming events. Create one to get an access code.</Notice>
                ) : (
                  <ul className="space-y-4">
                    {upcoming.map((e) => (
                      <EventCard key={e._id} event={e} onChanged={load} highlight={e._id === justCreated} />
                    ))}
                  </ul>
                )}
                {past.length > 0 && (
                  <section className="space-y-4">
                    <button type="button" className="btn-ghost" aria-expanded={showPast} onClick={() => setShowPast(!showPast)}>
                      {showPast ? 'Hide' : 'Show'} past events ({past.length})
                    </button>
                    {showPast && (
                      <ul className="space-y-4">
                        {past.map((e) => (
                          <EventCard key={e._id} event={e} onChanged={load} ended />
                        ))}
                      </ul>
                    )}
                  </section>
                )}
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}
