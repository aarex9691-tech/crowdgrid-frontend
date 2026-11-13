import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Megaphone, Phone, RefreshCw, Search, Siren, UserPlus, X } from 'lucide-react';
import API, { errorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useConfirm } from '../../lib/confirm';
import { LiveBadge, useLive } from '../../lib/realtime';
import { formatPhone } from '../../lib/phone';
import Notice, { Loading } from '../../components/Notice';
import PageTitle from '../../components/PageTitle';
import { useCelebrate } from '../../components/SuccessSplash';

/*
 * District control room: volunteers. Live status of every approved volunteer, duty posts and
 * shifts, coverage of each sector against the people staying there, and messages to volunteers.
 * Data: GET /volunteer/control (one request); refreshed live on duty, SOS and broadcast events.
 */

const DOMAIN = { CROWD_CONTROL: 'Crowd marshalling', LANGAR_SERVING: 'Langar serving', SENIOR_ESCORT: 'Senior escort', FIRST_AID: 'First aid' };
const STATUS = {
  ON_DUTY: { label: 'On duty', cls: 'pill-ok' },
  BUSY: { label: 'On SOS', cls: 'pill-out' },
  LATE: { label: 'Late check-in', cls: 'pill-low' },
  SCHEDULED: { label: 'Later', cls: 'pill bg-blue-wash text-blue' },
  OFF: { label: 'Off duty', cls: 'pill-quiet' },
};
const FILTERS = [
  ['ALL', 'All'],
  ['ON_DUTY', 'On duty'],
  ['BUSY', 'On SOS'],
  ['LATE', 'Late'],
  ['SCHEDULED', 'Later'],
  ['OFF', 'Off duty'],
];
const SOS_TYPE = { MEDICAL: 'medical', CROWD: 'crowd', LOST: 'lost person', FIRE: 'fire', GENERAL: 'general' };
const POSTS = ['Main gate', 'Ghat steps', 'Help booth', 'Langar hall', 'Parking', 'Shuttle stop', 'Medical tent', 'Queue barricade'];
const HOURS = [2, 4, 6, 8, 10, 12];

const time = (d) => new Date(d).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
const dayOf = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
const shiftLabel = (duty) => {
  const today = dayOf(new Date());
  const when = dayOf(duty.start) === today ? '' : `${new Date(duty.start).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' })}, `;
  return `${when}${time(duty.start)} to ${time(duty.end)}`;
};
const ago = (d) => {
  const m = Math.round((Date.now() - new Date(d)) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};
// datetime-local value for a Date, in the browser's local time (the control room works in IST)
const localInput = (d) => {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 16);
};
const nextQuarter = () => {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(Math.ceil((d.getMinutes() + 1) / 15) * 15);
  return d;
};

function Stat({ label, value, tone }) {
  return (
    <div className="cg-stat">
      <p className="cg-stat-label">{label}</p>
      <p className={`cg-stat-value ${tone || ''}`}>{value}</p>
    </div>
  );
}

/** Assign a new duty, or move an existing one (sector, post, time). */
function DutyDialog({ data, initial, onClose, onSaved }) {
  const editing = !!initial.duty;
  const firstField = useRef(null);
  const formRef = useRef(null);
  // the parent passes a new onClose on every render (polls, live updates): keep the latest in a ref,
  // so focus is set once when the dialog opens and not again while someone is typing
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });
  const [form, setForm] = useState(() => {
    const d = initial.duty;
    const start = d ? new Date(d.start) : nextQuarter();
    const hours = d ? Math.max(1, Math.round((new Date(d.end) - new Date(d.start)) / 3600000)) : 6;
    return {
      volunteerId: initial.volunteerId || '',
      sector: d?.sector || initial.sector || data.sectors[0] || '',
      post: d?.post || '',
      start: localInput(start),
      hours: HOURS.includes(hours) ? hours : 6,
    };
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    const opener = document.activeElement;
    firstField.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') return closeRef.current();
      if (e.key !== 'Tab' || !formRef.current) return;
      // keep Tab inside the dialog (it is modal)
      const items = [...formRef.current.querySelectorAll('button, select, input, textarea, [href]')].filter((el) => !el.disabled);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      opener?.focus?.(); // back to the button that opened it
    };
  }, []);

  // Volunteers free right now come first in the list
  const choices = useMemo(() => {
    const rank = { OFF: 0, SCHEDULED: 1, LATE: 2, ON_DUTY: 3, BUSY: 4 };
    return [...data.roster].sort((a, b) => rank[a.status] - rank[b.status] || a.name.localeCompare(b.name));
  }, [data.roster]);
  const person = data.roster.find((r) => r.id === form.volunteerId);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.volunteerId) return setError('Choose a volunteer');
    const start = new Date(form.start);
    if (Number.isNaN(start.getTime())) return setError('Choose a start time');
    const end = new Date(start.getTime() + Number(form.hours) * 3600000);
    setBusy(true);
    try {
      const body = { sector: form.sector, post: form.post, start: start.toISOString(), end: end.toISOString() };
      if (editing) await API.patch(`/volunteer/duties/${initial.duty.id}`, body);
      else await API.post('/volunteer/duties', { ...body, eventId: data.eventId, volunteerId: form.volunteerId });
      onSaved({ name: person?.name || 'Volunteer', sector: form.sector, editing });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  const quick = (offsetMin) => {
    const d = offsetMin === 'dawn' ? (() => { const t = new Date(); t.setDate(t.getDate() + 1); t.setHours(6, 0, 0, 0); return t; })() : new Date(nextQuarter().getTime() + offsetMin * 60000);
    setForm((f) => ({ ...f, start: localInput(d) }));
  };

  return createPortal(
    <div className="cg-backdrop fixed inset-0 z-[1000] flex items-end justify-center bg-ink/50 p-4 sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form ref={formRef} onSubmit={submit} className="cg-dialog max-h-[90dvh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-white p-6" role="dialog" aria-modal="true" aria-labelledby="duty-title">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="duty-title" className="text-2xl font-bold">{editing ? 'Move duty' : 'Assign a duty'}</h2>
            <p className="text-ink-soft">{editing ? person?.name : 'Put a volunteer on a sector post for a shift.'}</p>
          </div>
          <button type="button" className="grid h-11 w-11 place-items-center rounded-lg text-ink-soft hover:bg-mist" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        <Notice tone="error">{error}</Notice>

        {!editing && (
          <div>
            <label htmlFor="d-vol" className="field-label">Volunteer</label>
            <select id="d-vol" ref={firstField} className="field" value={form.volunteerId} onChange={set('volunteerId')} required>
              <option value="">Choose a volunteer…</option>
              {choices.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} · {DOMAIN[r.domain] || r.domain} · {STATUS[r.status].label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="d-sector" className="field-label">Sector</label>
            <select id="d-sector" ref={editing ? firstField : undefined} className="field" value={form.sector} onChange={set('sector')} required>
              {data.sectors.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="d-post" className="field-label">Post <span className="font-normal text-ink-soft">(optional)</span></label>
            <input id="d-post" className="field" list="d-posts" value={form.post} onChange={set('post')} maxLength={80} placeholder="e.g. Main gate" />
            <datalist id="d-posts">{POSTS.map((p) => <option key={p} value={p} />)}</datalist>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
          <div>
            <label htmlFor="d-start" className="field-label">Starts</label>
            <input id="d-start" type="datetime-local" className="field" value={form.start} onChange={set('start')} required />
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              <button type="button" className="cg-chip" onClick={() => quick(0)}>Now</button>
              <button type="button" className="cg-chip" onClick={() => quick(60)}>In 1 hour</button>
              <button type="button" className="cg-chip" onClick={() => quick('dawn')}>Tomorrow 6:00</button>
            </div>
          </div>
          <div>
            <label htmlFor="d-hours" className="field-label">Length</label>
            <select id="d-hours" className="field" value={form.hours} onChange={set('hours')}>
              {HOURS.map((h) => <option key={h} value={h}>{h} hours</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Assign duty'}</button>
        </div>
      </form>
    </div>,
    document.body
  );
}

function Coverage({ data, onAssign }) {
  return (
    <section aria-labelledby="cov-title" className="panel p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="cov-title" className="text-2xl font-bold">Coverage by sector</h2>
        <p className="text-sm text-ink-soft">Target: 1 volunteer per {data.ratio} people staying, at least 2 per sector</p>
      </div>
      <ul className="cg-rows mt-3">
        {data.coverage.map((c) => {
          const pct = Math.min(100, Math.round((c.onDuty / Math.max(c.needed, 1)) * 100));
          return (
            <li key={c.sector} className="grid gap-x-4 gap-y-2 py-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="font-semibold">{c.sector}</span>
                  <span className="text-sm tabular-nums text-ink-soft">
                    <b className="text-ink">{c.onDuty}</b> on duty of {c.needed} needed · {c.scheduled} later · {c.staying.toLocaleString('en-IN')} staying tonight
                  </span>
                </div>
                <div className="cg-meter mt-2" role="img" aria-label={`${c.onDuty} of ${c.needed} volunteers on duty`}>
                  <span className={c.gap ? 'is-short' : ''} style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {c.gap ? <span className="pill-low">Short by {c.gap}</span> : <span className="pill-ok">Covered</span>}
                <button type="button" className="btn-ghost min-h-10 px-3 text-sm" onClick={() => onAssign({ sector: c.sector })}>
                  <UserPlus size={16} aria-hidden /> Assign
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Broadcast({ data, onSent }) {
  const [sector, setSector] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const send = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await API.post('/volunteer/broadcasts', { eventId: data.eventId, sector, message });
      setMessage('');
      onSent(sector);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section aria-labelledby="bc-title" className="panel flex flex-col p-5">
      <h2 id="bc-title" className="flex items-center gap-2 text-2xl font-bold"><Megaphone size={22} aria-hidden /> Message volunteers</h2>
      <form onSubmit={send} className="mt-3 space-y-3">
        <Notice tone="error">{error}</Notice>
        <div>
          <label htmlFor="bc-to" className="field-label">To</label>
          <select id="bc-to" className="field" value={sector} onChange={(e) => setSector(e.target.value)}>
            <option value="">All volunteers at this event</option>
            {data.sectors.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="bc-msg" className="field-label">Message</label>
          <textarea id="bc-msg" className="field min-h-24" maxLength={280} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. Ramkund gate 2 closed. Send pilgrims to gate 4." required />
          <p className="mt-1 text-right text-sm tabular-nums text-ink-soft">{message.length}/280</p>
        </div>
        <button type="submit" className="btn-ink w-full" disabled={busy || message.trim().length < 3}>{busy ? 'Sending…' : 'Send message'}</button>
      </form>
      <h3 className="mt-5 font-bold">Sent recently</h3>
      {data.broadcasts.length ? (
        <ul className="cg-rows mt-1">
          {data.broadcasts.map((b) => (
            <li key={b._id} className="py-2.5">
              <p className="text-[15px]">{b.message}</p>
              <p className="mt-0.5 text-sm text-ink-soft">{b.sector || 'All volunteers'} · {ago(b.createdAt)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-ink-soft">No messages yet.</p>
      )}
    </section>
  );
}

function Roster({ data, onAssign, onMove, onCancel, onEnd }) {
  const [filter, setFilter] = useState('ALL');
  const [q, setQ] = useState('');
  const [sector, setSector] = useState('');
  const [domain, setDomain] = useState('');
  const counts = useMemo(() => {
    const c = { ALL: data.roster.length };
    for (const r of data.roster) c[r.status] = (c[r.status] || 0) + 1;
    return c;
  }, [data.roster]);
  const rows = data.roster.filter((r) => {
    if (filter !== 'ALL' && r.status !== filter) return false;
    if (sector && (r.duty?.sector || r.homeSector) !== sector) return false;
    if (domain && r.domain !== domain) return false;
    const s = q.trim().toLowerCase();
    return !s || r.name.toLowerCase().includes(s) || (r.phone || '').includes(s);
  });

  return (
    <section aria-labelledby="roster-title" className="panel p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="roster-title" className="text-2xl font-bold">Roster</h2>
        {/* phones: filters stack full width; wider screens: one row */}
        <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap">
          <label className="relative block">
            <span className="sr-only">Search by name or mobile</span>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden />
            <input className="field w-full pl-9 sm:w-56" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or mobile" />
          </label>
          <label>
            <span className="sr-only">Sector</span>
            <select className="field w-full sm:w-52" value={sector} onChange={(e) => setSector(e.target.value)}>
              <option value="">All sectors</option>
              {data.sectors.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Seva domain</span>
            <select className="field w-full sm:w-44" value={domain} onChange={(e) => setDomain(e.target.value)}>
              <option value="">All duties</option>
              {Object.entries(DOMAIN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div role="group" aria-label="Filter by status" className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
        {FILTERS.map(([k, label]) => (
          <button key={k} type="button" aria-pressed={filter === k} className={`cg-chip shrink-0 ${filter === k ? 'is-on' : ''}`} onClick={() => setFilter(k)}>
            {label} <span className="tabular-nums opacity-80">{counts[k] || 0}</span>
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-ink-soft">{data.roster.length ? 'No volunteer matches these filters.' : 'No approved volunteers for this event yet.'}</p>
      ) : (
        <ul className="cg-rows mt-2">
          {rows.map((r) => {
            const st = STATUS[r.status];
            return (
              <li key={r.id} className="grid gap-x-5 gap-y-2 py-3.5 md:grid-cols-[minmax(0,1.3fr)_8.5rem_minmax(0,1.5fr)_auto] md:items-center">
                <div className="min-w-0">
                  <p className="truncate font-bold">{r.name}</p>
                  <p className="truncate text-sm text-ink-soft">{DOMAIN[r.domain] || r.domain}{r.trust ? ` · ${r.trust}` : ''}</p>
                </div>
                <div>
                  <span className={st.cls}>{st.label}</span>
                </div>
                <div className="min-w-0 text-[15px]">
                  {r.sos && (
                    <p className="flex items-center gap-1.5 font-semibold text-kumkum"><Siren size={15} aria-hidden /> Handling a {SOS_TYPE[r.sos.type] || ''} alert</p>
                  )}
                  {r.duty ? (
                    <>
                      <p className="truncate font-semibold">{r.duty.sector}{r.duty.post ? ` · ${r.duty.post}` : ''}</p>
                      <p className="text-sm tabular-nums text-ink-soft">
                        {shiftLabel(r.duty)}{r.duty.checkedInAt ? ` · in at ${time(r.duty.checkedInAt)}` : ''}
                      </p>
                    </>
                  ) : (
                    <p className="text-ink-soft">No shift · prefers {r.homeSector || 'any sector'}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
                  {r.phone && (
                    <a className="btn-ghost min-h-10 px-3 text-sm" href={`tel:+${r.countryCode || '91'}${r.phone}`} aria-label={`Call ${r.name}, ${formatPhone(r.countryCode, r.phone)}`}>
                      <Phone size={15} aria-hidden /> Call
                    </a>
                  )}
                  {!r.duty && <button type="button" className="btn-ink min-h-10 px-3 text-sm" onClick={() => onAssign({ volunteerId: r.id, sector: r.homeSector })} aria-label={`Assign a duty to ${r.name}`}>Assign</button>}
                  {r.duty && <button type="button" className="btn-ghost min-h-10 px-3 text-sm" onClick={() => onMove(r)} aria-label={`Move ${r.name}'s duty`}>Move</button>}
                  {r.duty?.status === 'ON_DUTY' && <button type="button" className="btn-ghost min-h-10 px-3 text-sm" onClick={() => onEnd(r)} aria-label={`End ${r.name}'s shift`}>End shift</button>}
                  {r.duty?.status === 'SCHEDULED' && <button type="button" className="btn-ghost min-h-10 px-3 text-sm" onClick={() => onCancel(r)} aria-label={`Cancel ${r.name}'s duty`}>Cancel</button>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default function Volunteers() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const celebrate = useCelebrate();
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(null); // { volunteerId?, sector?, duty? }

  useEffect(() => {
    API.get('/events', { params: { kind: 'YATRA' } })
      .then(({ data: list }) => {
        setEvents(list);
        setEventId((list.find((e) => e.isFlagship) || list[0])?._id || '');
      })
      .catch((e) => setError(errorMessage(e)));
  }, []);

  // the yatra chosen now: an answer for a yatra chosen earlier (slow network) is dropped
  const wanted = useRef(eventId);
  useEffect(() => {
    wanted.current = eventId;
  }, [eventId]);
  const load = useCallback(() => {
    if (!eventId) return;
    API.get('/volunteer/control', { params: { eventId } })
      .then(({ data: d }) => {
        if (wanted.current !== eventId) return;
        setData({ ...d, eventId });
        setError('');
      })
      .catch((e) => wanted.current === eventId && setError(errorMessage(e)));
  }, [eventId]);
  useEffect(() => {
    setData(null);
    load();
    // statuses change with the clock too (a shift starting turns into "late"), so re-read every minute
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);
  useLive(['duty', 'sos', 'volunteer-broadcast', 'beds'], load, { wait: 1200 });

  const event = events.find((e) => e._id === eventId);

  const cancelDuty = async (r) => {
    const ok = await confirm({ title: 'Cancel this duty?', message: `${r.name} will no longer be expected at ${r.duty.sector} (${shiftLabel(r.duty)}).`, confirmLabel: 'Cancel duty', cancelLabel: 'Keep it' });
    if (!ok) return;
    try {
      await API.patch(`/volunteer/duties/${r.duty.id}`, { status: 'CANCELLED' });
      celebrate({ tone: 'cancel', title: 'Duty cancelled', line: `${r.name} is off the ${r.duty.sector} roster.` });
      load();
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  const endShift = async (r) => {
    const ok = await confirm({ title: 'End this shift now?', message: `${r.name} will be marked off duty at ${r.duty.sector}.`, confirmLabel: 'End shift', cancelLabel: 'Keep on duty' });
    if (!ok) return;
    try {
      await API.patch(`/volunteer/duties/${r.duty.id}`, { status: 'DONE' });
      celebrate({ tone: 'cancel', title: 'Shift ended', line: `${r.name} is now off duty.` });
      load();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <div className="shell space-y-6 py-6">
      <div className="cg-pagehead">
        <PageTitle kicker="District control room" tone="blue" title={<>Volunteers <LiveBadge /></>} lead={event ? `Duties, live status and coverage for ${event.title}` : user.name} />
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="v-ev" className="field-label">Event</label>
            <select id="v-ev" className="field" value={eventId} onChange={(e) => setEventId(e.target.value)}>
              {events.map((e) => <option key={e._id} value={e._id}>{e.title}</option>)}
            </select>
          </div>
          <button type="button" className="btn-ghost" onClick={load} aria-label="Refresh"><RefreshCw size={18} /></button>
          <Link to="/control" className="btn-ghost">Control room</Link>
          <button type="button" className="btn-primary" onClick={() => setDialog({})} disabled={!data?.roster.length}>
            <UserPlus size={18} aria-hidden /> Assign duty
          </button>
        </div>
      </div>
      <Notice tone="error">{error}</Notice>

      {!data ? (
        <Loading label="Loading volunteers" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Stat label="Approved volunteers" value={data.summary.total} />
            <Stat label="On duty now" value={data.summary.onDuty} tone="text-tulsi" />
            <Stat label="Handling SOS" value={data.summary.busy} tone={data.summary.busy ? 'text-kumkum' : ''} />
            <Stat label="Late check-in" value={data.summary.late} tone={data.summary.late ? 'text-terracotta' : ''} />
            <Stat label="Shifts later" value={data.summary.scheduled} tone="text-blue" />
            <Stat label="Sectors short" value={data.summary.sectorsShort} tone={data.summary.sectorsShort ? 'text-terracotta' : 'text-tulsi'} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <Coverage data={data} onAssign={(init) => setDialog(init)} />
            <Broadcast data={data} onSent={(to) => { celebrate({ title: 'Message sent', line: to ? `To volunteers in ${to}.` : 'To every volunteer at this event.' }); load(); }} />
          </div>

          <Roster
            data={data}
            onAssign={(init) => setDialog(init)}
            onMove={(r) => setDialog({ volunteerId: r.id, duty: r.duty })}
            onCancel={cancelDuty}
            onEnd={endShift}
          />
        </>
      )}

      {dialog && data && (
        <DutyDialog
          data={data}
          initial={dialog}
          onClose={() => setDialog(null)}
          onSaved={({ name, sector, editing }) => {
            setDialog(null);
            celebrate({ title: editing ? 'Duty moved' : 'Duty assigned', line: `${name} · ${sector}` });
            load();
          }}
        />
      )}
    </div>
  );
}
