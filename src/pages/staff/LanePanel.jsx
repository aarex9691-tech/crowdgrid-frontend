import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Footprints } from 'lucide-react';
import API, { errorMessage } from '../../lib/api';
import { useLive } from '../../lib/realtime';
import Notice from '../../components/Notice';
import RouteMap, { LANE_STYLE, RouteLegend } from '../../components/RouteMap';

const ORDER = { CLOSED: 0, CROWDED: 1, BUSY: 2, NORMAL: 3 };

/**
 * Control room: mark walking lanes busy, crowded or closed. Pilgrims' safest
 * routes change straight away (live update). Click a lane on the map or in the list.
 */
export default function LanePanel({ eventId }) {
  const [net, setNet] = useState(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState('');
  const [form, setForm] = useState({ status: 'NORMAL', note: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');

  const load = useCallback(
    () =>
      API.get('/route/network', { params: { eventId } })
        .then(({ data }) => {
          setNet(data);
          setError('');
        })
        .catch((e) => {
          setNet(null);
          setError(e.response?.status === 404 ? '' : errorMessage(e)); // other yatras have no walking map yet
        }),
    [eventId]
  );
  useEffect(() => {
    load();
  }, [load]);
  useLive('route', load, { wait: 3000 });

  const lanes = useMemo(() => (net ? [...net.lanes].sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.name.localeCompare(b.name)) : []), [net]);
  const lane = net?.lanes.find((l) => l.id === selected);

  const pick = (id) => {
    const l = net.lanes.find((x) => x.id === id);
    setSelected(id);
    setForm({ status: l.manualStatus, note: l.note || '' });
    setSaved('');
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.patch(`/route/lanes/${selected}`, form);
      setSelected('');
      setSaved(`${lane.name} marked ${LANE_STYLE[form.status].label.toLowerCase()}. Pilgrims' routes update now.`);
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!net) return error ? <Notice tone="error">{error}</Notice> : null; // nothing for yatras without a walking map
  const flagged = net.lanes.filter((l) => l.status !== 'NORMAL').length;

  return (
    <section aria-labelledby="lanes" className="panel space-y-4 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="lanes" className="flex items-center gap-2 text-2xl font-bold"><Footprints size={22} aria-hidden /> Walking lanes</h2>
          <p className="text-ink-soft">{flagged} of {net.lanes.length} lanes are busy, crowded or closed. Click a lane to change it; pilgrims' safest routes avoid them.</p>
        </div>
        <Link to="/yatra/simhastha-kumbh-2027?tab=route" className="btn-ghost">Pilgrim's view</Link>
      </div>
      <Notice tone="error">{error}</Notice>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-2">
          <RouteMap nodes={net.nodes} lanes={net.lanes} selectedLane={selected} onLaneClick={pick} height={380} />
          <RouteLegend showRoutes={false} />
        </div>
        <div className="space-y-3">
          {lane ? (
            <form onSubmit={save} className="space-y-3 rounded-xl bg-mist p-3">
              <p className="font-bold">{lane.name}</p>
              <p className="text-sm text-ink-soft">{lane.lengthM} m · now <b>{LANE_STYLE[lane.status].label.toLowerCase()}</b></p>
              {lane.reasons?.length > 0 && <ul className="list-disc pl-5 text-sm text-ink-soft">{lane.reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
              <fieldset>
                <legend className="field-label">Set by the control room</legend>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(LANE_STYLE).map(([k, s]) => (
                    <label key={k} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border-2 px-2 text-sm font-semibold ${form.status === k ? 'border-ink bg-white' : 'border-transparent bg-white/60'}`}>
                      <input type="radio" name="lane-status" value={k} checked={form.status === k} onChange={() => setForm((f) => ({ ...f, status: k }))} className="sr-only" />
                      <span className="h-0 w-5" style={{ borderTop: `4px ${s.dashArray ? 'dotted' : 'solid'} ${s.color}` }} aria-hidden /> {s.label}
                    </label>
                  ))}
                </div>
              </fieldset>
              {form.status !== 'NORMAL' && (
                <div>
                  <label htmlFor="lane-note" className="field-label">Reason (shown to staff)</label>
                  <input id="lane-note" className="field" maxLength={120} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="e.g. Procession passing until 11:00" />
                </div>
              )}
              <div className="flex gap-2">
                <button type="submit" className="btn-ink" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                <button type="button" className="btn-ghost" onClick={() => setSelected('')}>Cancel</button>
              </div>
              <p className="text-xs text-ink-soft">Crowd SOS alerts and heavy check-ins can still raise a lane automatically.</p>
            </form>
          ) : (
            <Notice tone="success">{saved}</Notice>
          )}
          <ul className="max-h-80 divide-y divide-line overflow-auto rounded-xl border border-line" aria-label="Lanes, most restricted first">
            {lanes.map((l) => (
              <li key={l.id}>
                <button type="button" className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-mist ${selected === l.id ? 'bg-mist' : ''}`} onClick={() => pick(l.id)}>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{l.name}</span>
                    {l.reasons?.[0] && <span className="block truncate text-xs text-ink-soft">{l.reasons[0]}</span>}
                  </span>
                  <span className="flex flex-none items-center gap-1.5 text-xs font-bold text-ink-soft">
                    <span className="h-0 w-4" style={{ borderTop: `4px ${LANE_STYLE[l.status].dashArray ? 'dotted' : 'solid'} ${LANE_STYLE[l.status].color}` }} aria-hidden />
                    {LANE_STYLE[l.status].label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
