import { addDaysIST, fmtDate, todayIST } from '../lib/format';

/** Same rules as the server (event.service.js assertHostedWindow). */
export const MAX_DAYS_AHEAD = 365;
export const MIN_MINUTES = 30;
export const MAX_MINUTES = 12 * 60;

const toMin = (t) => {
  const [h, m] = String(t || '0:0').split(':').map(Number);
  return h * 60 + m;
};

/** Returns an error message for a date + start + end, or '' when it is fine. */
export const windowError = ({ date, start, end }) => {
  const today = todayIST();
  if (!date || !start || !end) return 'Choose a date, start time and end time';
  if (date < today) return 'The date cannot be in the past';
  if (date > addDaysIST(today, MAX_DAYS_AHEAD)) return 'Events can be scheduled at most one year ahead';
  if (new Date(`${date}T${start}:00+05:30`) < new Date()) return 'The start time has already passed';
  const mins = toMin(end) - toMin(start);
  if (mins < MIN_MINUTES) return 'The event must end at least 30 minutes after it starts';
  if (mins > MAX_MINUTES) return 'An event can last at most 12 hours';
  return '';
};

/**
 * The one date-and-time picker used for every hosted event (public and
 * corporate): a date between today and one year ahead, then start and end
 * times in 15-minute steps on the same day.
 */
export default function DateTimeRange({ idPrefix, value, onChange }) {
  const today = todayIST();
  const max = addDaysIST(today, MAX_DAYS_AHEAD);
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });
  const err = windowError(value);
  const mins = toMin(value.end) - toMin(value.start);

  return (
    <div className="space-y-2">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="field-label" htmlFor={`${idPrefix}-date`}>Date</label>
          <input id={`${idPrefix}-date`} type="date" className="field" min={today} max={max} value={value.date} onChange={set('date')} required />
        </div>
        <div>
          <label className="field-label" htmlFor={`${idPrefix}-start`}>Starts (IST)</label>
          <input id={`${idPrefix}-start`} type="time" step={900} className="field" value={value.start} onChange={set('start')} required />
        </div>
        <div>
          <label className="field-label" htmlFor={`${idPrefix}-end`}>Ends (IST)</label>
          <input id={`${idPrefix}-end`} type="time" step={900} className="field" value={value.end} onChange={set('end')} required />
        </div>
      </div>
      <p className={`text-sm ${err ? 'font-semibold text-kumkum' : 'text-ink-soft'}`} role={err ? 'alert' : undefined}>
        {err ||
          `${fmtDate(value.date, { weekday: 'long' })}, ${Math.floor(mins / 60) ? `${Math.floor(mins / 60)} h ` : ''}${mins % 60 ? `${mins % 60} min` : ''}. Dates from today up to ${fmtDate(max)}.`}
      </p>
    </div>
  );
}

/** ISO strings with the IST offset, ready for the API. */
export const toIsoRange = ({ date, start, end }) => ({
  startDate: `${date}T${start}:00+05:30`,
  endDate: `${date}T${end}:00+05:30`,
});
