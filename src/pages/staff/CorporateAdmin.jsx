import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Coffee, Copy, Mail, MessageCircle, Plus, Presentation, Printer, RefreshCw, Trash2, Users, X } from 'lucide-react';
import API, { errorMessage } from '../../lib/api';
import { addDaysIST, fmtDate, fmtDateTime, fmtTime, todayIST } from '../../lib/format';
import Notice, { Loading } from '../../components/Notice';
import QrCode from '../../components/QrCode';

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
    'Log in or create a free CrowdGrid account, then confirm the code and pick your sessions. Show the badge QR at the registration desk.',
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
          <div className="bg-ink px-6 py-5 text-white">
            <p className="text-[#c9d6ee]">{event.companyName} invites you to</p>
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

function InvitePanel({ event }) {
  const [copied, copy] = useCopy();
  const [showCard, setShowCard] = useState(false);
  const text = invitationText(event);
  const subject = `Invitation: ${event.title}`;

  return (
    <div className="space-y-3 rounded-2xl border border-line bg-mist p-4">
      <h4 className="font-bold">Invite attendees</h4>
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
  useEffect(() => {
    API.get(`/events/${event._id}/corporate/attendees`)
      .then(({ data }) => setRows(data))
      .catch((e) => setError(errorMessage(e)));
  }, [event._id]);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!rows) return <Loading label="Loading attendees" />;
  if (!rows.length) return <Notice>No one has claimed a badge yet. Send the invitation to get started.</Notice>;
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white">
      <table className="w-full min-w-[560px] text-left text-[15px]">
        <thead className="bg-mist text-ink-soft">
          <tr>
            <th className="px-4 py-2 font-semibold">Name</th>
            <th className="px-4 py-2 font-semibold">Mobile</th>
            <th className="px-4 py-2 font-semibold">Sessions</th>
            <th className="px-4 py-2 font-semibold">Badge claimed</th>
            <th className="px-4 py-2 font-semibold">At venue</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => (
            <tr key={r._id}>
              <td className="px-4 py-2 font-medium">{r.name}</td>
              <td className="px-4 py-2">{r.phone}</td>
              <td className="px-4 py-2 text-ink-soft">{r.sessions.join(', ')}</td>
              <td className="px-4 py-2 text-ink-soft">{fmtDateTime(r.claimedAt)}</td>
              <td className="px-4 py-2">
                {r.checkedIn ? <span className="pill-ok">Checked in {fmtTime(r.checkedInAt)}</span> : <span className="pill-quiet">Not yet</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EventCard({ event, onChanged, highlight, ended }) {
  const [copied, copy] = useCopy();
  const [open, setOpen] = useState(highlight ? 'invite' : null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const regenerate = async () => {
    if (!window.confirm('Generate a new access code? The current code stops working immediately, so anyone you already invited will need the new one.')) return;
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
            <button type="button" className="btn-ghost min-h-10 px-3 text-sm" onClick={() => copy('code', event.accessCode)}>
              <Copy size={16} aria-hidden /> {copied === 'code' ? 'Copied' : 'Copy'}
            </button>
            <button type="button" className="btn-ghost min-h-10 px-3 text-sm" onClick={regenerate} disabled={busy}>
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
          Attendees ({event.badgesClaimed})
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
    date: addDaysIST(todayIST(), 1),
    start: '10:00',
    end: '17:00',
    description: '',
  });
  const [sessions, setSessions] = useState([emptySession(), emptySession('MEAL')]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setSession = (i, k, v) => setSessions((list) => list.map((s, j) => (j === i ? { ...s, [k]: v } : s)));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.end <= form.start) return setError('End time must be after the start time');
    const filled = sessions.filter((s) => s.title.trim());
    if (!filled.length) return setError('Add at least one session or meal');
    setBusy(true);
    try {
      const { data } = await API.post('/events', {
        kind: 'CORPORATE',
        title: form.title,
        companyName: form.companyName,
        venue: form.venue,
        city: form.city,
        description: form.description,
        startDate: `${form.date}T${form.start}:00+05:30`,
        endDate: `${form.date}T${form.end}:00+05:30`,
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
    <form onSubmit={submit} className="panel space-y-5 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">New corporate event</h2>
        <button type="button" className="btn-ghost min-h-10 px-3" onClick={onCancel} aria-label="Close form">
          <X size={18} aria-hidden />
        </button>
      </div>
      <Notice tone="error">{error}</Notice>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="ce-title">Event title</label>
          <input id="ce-title" className="field" value={form.title} onChange={set('title')} required />
        </div>
        <div>
          <label className="field-label" htmlFor="ce-company">Company</label>
          <input id="ce-company" className="field" value={form.companyName} onChange={set('companyName')} required />
        </div>
        <div>
          <label className="field-label" htmlFor="ce-venue">Venue</label>
          <input id="ce-venue" className="field" value={form.venue} onChange={set('venue')} required />
        </div>
        <div>
          <label className="field-label" htmlFor="ce-city">City</label>
          <input id="ce-city" className="field" value={form.city} onChange={set('city')} required />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="field-label" htmlFor="ce-date">Date</label>
          <input id="ce-date" type="date" className="field" min={todayIST()} value={form.date} onChange={set('date')} required />
        </div>
        <div>
          <label className="field-label" htmlFor="ce-start">Starts</label>
          <input id="ce-start" type="time" className="field" value={form.start} onChange={set('start')} required />
        </div>
        <div>
          <label className="field-label" htmlFor="ce-end">Ends</label>
          <input id="ce-end" type="time" className="field" value={form.end} onChange={set('end')} required />
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="ce-desc">Short description (optional)</label>
        <textarea id="ce-desc" rows={2} className="field py-3" value={form.description} onChange={set('description')} />
      </div>

      <fieldset className="space-y-2">
        <legend className="field-label">Sessions and meals attendees can choose</legend>
        {sessions.map((s, i) => (
          <div key={i} className="grid grid-cols-[1fr_7rem_auto_auto] items-center gap-2">
            <input className="field" placeholder={s.kind === 'MEAL' ? 'e.g. Networking lunch' : 'e.g. Keynote address'} aria-label={`Session ${i + 1} title`} value={s.title} onChange={(e) => setSession(i, 'title', e.target.value)} />
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">My corporate events</h1>
          <p className="text-ink-soft">Create invite-only events, send invitations and see who is coming.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/scan" className="btn-ghost">Registration desk scanner</Link>
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
