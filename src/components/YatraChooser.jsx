import { Link } from 'react-router-dom';
import { CalendarDays, MapPin } from 'lucide-react';
import { fmtDate } from '../lib/format';

// Each yatra keeps its own colour, so no single mela becomes the theme of the whole site
const ACCENTS = [
  { bar: 'bg-terracotta', ring: 'ring-terracotta', text: 'text-terracotta-dark', wash: 'bg-terracotta-wash' },
  { bar: 'bg-tulsi', ring: 'ring-tulsi', text: 'text-tulsi', wash: 'bg-tulsi-wash' },
  { bar: 'bg-marigold', ring: 'ring-marigold', text: 'text-marigold-deep', wash: 'bg-marigold-wash' },
];

const dayMs = 86400000;
const todayIso = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

/** The next date worth knowing for this yatra: its start, or the next key date while it runs. */
const nextMoment = (e) => {
  const today = todayIso();
  const start = String(e.startDate).slice(0, 10);
  if (start > today) return { label: 'Begins', date: e.startDate };
  const next = (e.keyDates || []).find((d) => String(d.date).slice(0, 10) >= today);
  return next ? { label: next.label, date: next.date } : null;
};
const inDays = (date) => {
  const n = Math.round((new Date(`${String(date).slice(0, 10)}T12:00:00+05:30`) - new Date(`${todayIso()}T12:00:00+05:30`)) / dayMs);
  return n <= 0 ? 'today' : n === 1 ? 'tomorrow' : `in ${n} days`;
};
const running = (e) => {
  const t = todayIso();
  return String(e.startDate).slice(0, 10) <= t && t <= String(e.endDate).slice(0, 10);
};

/**
 * Home page opening: "where are you going?" Every yatra is a ticket of equal weight.
 * Picking one sets the search bar below; "Plan this yatra" opens its services.
 */
export default function YatraChooser({ yatras, selected, onSelect }) {
  return (
    <section aria-labelledby="hero-title" className="space-y-6">
      <div className="max-w-3xl">
        <h1 id="hero-title" className="font-display text-4xl font-extrabold leading-tight text-ink sm:text-6xl">
          Plan your yatra.
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-soft sm:text-xl">
          Verified camps, free meals, shuttles and help in an emergency, with one QR pass for everything. Choose where you are going.
        </p>
      </div>

      <ul className="grid gap-4 md:grid-cols-3" role="list">
        {yatras.map((e, i) => {
          const a = ACCENTS[i % ACCENTS.length];
          const on = selected?._id === e._id;
          const next = nextMoment(e);
          const beds = e.stats?.availableBeds;
          return (
            <li key={e._id || e.slug}>
              <div
                className={`ticket relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition ${on ? `ring-4 ${a.ring} border-transparent` : 'border-line'}`}
              >
                <span className={`h-2 w-full ${a.bar}`} aria-hidden />
                <button
                  type="button"
                  onClick={() => onSelect(e)}
                  aria-pressed={on}
                  className="flex flex-1 flex-col items-start gap-2 p-5 text-left"
                >
                  <span className="font-display text-2xl font-extrabold leading-snug text-ink">{e.title}</span>
                  <span className="flex items-center gap-1.5 text-ink-soft">
                    <MapPin size={16} className={a.text} aria-hidden /> {e.city}
                    {e.state ? `, ${e.state}` : ''}
                  </span>
                  <span className="flex items-center gap-1.5 text-ink-soft">
                    <CalendarDays size={16} className={a.text} aria-hidden />
                    {fmtDate(e.startDate, { year: undefined })} – {fmtDate(e.endDate)}
                  </span>
                  {running(e) && <span className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${a.wash} ${a.text}`}>Happening now</span>}
                </button>
                {/* ticket stub: perforation + the one line a pilgrim plans around */}
                <div className="ticket-stub mx-5 border-t-2 border-dashed border-line py-4">
                  {next && (
                    <p className="text-sm text-ink-soft">
                      <b className="text-ink">{next.label}</b> {inDays(next.date)}
                    </p>
                  )}
                  {typeof beds === 'number' && beds > 0 && (
                    <p className="text-sm text-ink-soft">{beds.toLocaleString('en-IN')} beds free tonight</p>
                  )}
                  <Link to={`/yatra/${e.slug}`} className="btn-primary mt-3 w-full">
                    Plan this yatra
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
