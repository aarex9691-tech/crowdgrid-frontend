import { fmtDate, todayIST } from '../lib/format';

const startDayOf = (event) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(event.startDate));

/** Before a yatra starts, pilgrims can pre-book; this says so and what each service allows. */
export default function PrebookNotice({ event }) {
  if (todayIST() >= startDayOf(event)) return null;
  return (
    <div className="panel border-marigold/40 bg-marigold-wash/60 p-4" data-testid="prebook-notice">
      <p className="font-bold">Pre-booking is open. {event.title} starts on {fmtDate(event.startDate)}.</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-soft">
        <li>Stay: choose your check-in and check-out dates, from day 1 to the last day.</li>
        <li>Shuttles: choose the day you will travel. One pass covers up to 5 people for that day.</li>
        <li>Meals: tokens for the first days of the yatra can be taken now.</li>
      </ul>
      <p className="mt-2 text-sm text-ink-soft">Pre-booked passes are marked in your passbook and open for scanning on the day they are for.</p>
    </div>
  );
}
