import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, X } from 'lucide-react';
import API, { errorMessage } from '../../lib/api';
import { CATEGORY_LABELS, fmtDate } from '../../lib/format';
import { useAuth } from '../../lib/auth';
import Notice, { Loading } from '../../components/Notice';
import { LiveBadge, useLive, useWatchLodging } from '../../lib/realtime';

const STATUS = {
  FREE: { label: 'Free', cls: 'border-2 border-tulsi bg-white text-tulsi hover:bg-tulsi-wash' },
  BOOKED: { label: 'Booked online', cls: 'border-2 border-ink bg-ink text-white hover:bg-dusk' },
  HELD: { label: 'Walk-in / held', cls: 'border-2 border-ink-faint bg-[#c7cedb] text-ink hover:brightness-95' },
};
const day = (d) => (d ? fmtDate(`${d}T12:00:00+05:30`, { year: undefined }) : '');

/** One bed drawn like a cinema seat: rounded back, number on the cushion. */
function Seat({ bed, selected, onSelect, unitLabel }) {
  const s = STATUS[bed.status];
  return (
    <button
      type="button"
      onClick={() => onSelect(bed)}
      aria-pressed={selected}
      aria-label={`${unitLabel}, bed ${bed.bed}: ${s.label}${bed.guest ? `, ${bed.guest}` : ''}`}
      title={`Bed ${bed.bed} · ${s.label}${bed.guest ? ` · ${bed.guest}` : ''}`}
      className={`flex h-9 w-9 items-center justify-center rounded-b-md rounded-t-xl text-xs font-bold tabular-nums transition ${s.cls} ${selected ? 'ring-4 ring-marigold' : ''}`}
    >
      {bed.bed}
    </button>
  );
}

export default function TentMap() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [onlyFree, setOnlyFree] = useState(false);

  const load = useCallback(() => {
    setError('');
    API.get(`/lodgings/${id}/bed-map`)
      .then(({ data: d }) => setData(d))
      .catch((e) => setError(errorMessage(e)));
  }, [id]);
  useEffect(() => {
    load();
  }, [load]);
  // Follow this camp: beds turn booked / free as pilgrims book, cancel or staff change the size
  useWatchLodging(id);
  useLive('beds', () => {
    API.get(`/lodgings/${id}/bed-map`).then(({ data: d }) => setData(d)).catch(() => {});
  }, { wait: 3000 });

  const units = useMemo(() => (data ? data.units.filter((u) => !onlyFree || u.free > 0) : []), [data, onlyFree]);
  const back = user?.role === 'NGO_ADMIN' ? '/ngo' : '/control';

  if (error) return <div className="shell py-10"><Notice tone="error">{error}</Notice></div>;
  if (!data) return <Loading label="Drawing the tent map" />;

  const { lodging, summary } = data;
  const occupied = summary.booked + summary.held;
  const pct = lodging.totalBeds ? Math.round((occupied / lodging.totalBeds) * 100) : 0;

  return (
    <div className="shell space-y-5 py-6">
      <Link to={back} className="inline-flex items-center gap-1 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft size={16} aria-hidden /> Back
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-ink-soft">{lodging.provider} · {CATEGORY_LABELS[lodging.category]} · {lodging.sector}</p>
          <h1 className="flex flex-wrap items-center gap-3 text-3xl font-bold">{lodging.name}: {data.unit.label.toLowerCase()} map <LiveBadge /></h1>
        </div>
        <button type="button" className="btn-ghost min-h-10" onClick={load}>
          <RefreshCw size={16} aria-hidden /> Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          [`${data.unit.label}s`, summary.units],
          ['Free beds', summary.free, 'text-tulsi'],
          ['Booked online', summary.booked],
          ['Occupied', `${pct}%`, pct >= 90 ? 'text-kumkum' : ''],
        ].map(([label, value, tone]) => (
          <div key={label} className="panel p-4">
            <p className="text-ink-soft">{label}</p>
            <p className={`text-3xl font-extrabold tabular-nums ${tone || ''}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="panel flex flex-wrap items-center gap-x-6 gap-y-3 p-4">
        {Object.entries(STATUS).map(([k, s]) => (
          <span key={k} className="flex items-center gap-2 text-[15px]">
            <span className={`inline-block h-5 w-5 rounded-b rounded-t-lg ${s.cls}`} aria-hidden /> {s.label}
          </span>
        ))}
        <label className="ml-auto flex items-center gap-2 font-semibold">
          <input type="checkbox" className="h-5 w-5 accent-ink" checked={onlyFree} onChange={(e) => setOnlyFree(e.target.checked)} />
          Only {data.unit.label.toLowerCase()}s with free beds
        </label>
      </div>

      {selected && (
        <div className="panel fixed inset-x-4 bottom-24 z-30 flex items-start gap-4 border-marigold p-4 shadow-xl sm:static sm:shadow-none" role="status">
          <div className="flex-1">
            <p className="text-sm text-ink-soft">{selected.unitLabel} · Bed {selected.bed} (camp bed no. {selected.bedNo})</p>
            <p className="text-xl font-bold">{STATUS[selected.status].label}</p>
            {selected.status === 'BOOKED' && (
              <p>
                Guest: <b>{selected.guest || 'not given'}</b> · Booked by {selected.bookedBy} · Stay {day(selected.checkIn)}
                {selected.checkOut !== selected.checkIn ? ` to ${day(selected.checkOut)}` : ''}
              </p>
            )}
            {selected.status === 'HELD' && <p className="text-ink-soft">Taken by a walk-in pilgrim registered at the camp desk.</p>}
            {selected.status === 'FREE' && <p className="text-ink-soft">Available for online booking.</p>}
          </div>
          <button type="button" className="text-ink-soft hover:text-ink" aria-label="Close bed details" onClick={() => setSelected(null)}>
            <X size={20} />
          </button>
        </div>
      )}

      {/* The "screen": where the camp gate is, like the screen in a cinema */}
      <div className="mx-auto w-2/3 rounded-b-[50%] border-t-4 border-marigold pt-1 text-center text-sm font-semibold uppercase tracking-widest text-ink-soft">
        Camp gate
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {units.map((u) => (
          <li key={u.unitNo} className="panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-lg font-bold">{u.label}</p>
              <span className={u.free === 0 ? 'pill-out' : u.free <= 2 ? 'pill-low' : 'pill-ok'}>{u.free === 0 ? 'Full' : `${u.free} free`}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {u.beds.map((b) => (
                <Seat
                  key={b.bedNo}
                  bed={b}
                  unitLabel={u.label}
                  selected={selected?.bedNo === b.bedNo}
                  onSelect={(bed) => setSelected({ ...bed, unitLabel: u.label })}
                />
              ))}
            </div>
          </li>
        ))}
      </ul>
      {units.length === 0 && <Notice>No {data.unit.label.toLowerCase()} has a free bed right now.</Notice>}
    </div>
  );
}
