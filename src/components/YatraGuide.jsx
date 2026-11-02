import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronDown, Lightbulb, MapPin, Ticket } from 'lucide-react';
import API from '../lib/api';
import { fmtDate, fmtTime } from '../lib/format';
import { rupees } from '../lib/cart';

/**
 * "Good to know before you go": the yatra's story, practical tips and the
 * public events (aartis, kirtans, walks) happening in the same city.
 * Collapsed by default so booking stays one tap away.
 */
export default function YatraGuide({ event }) {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    let on = true;
    API.get('/events', { params: { kind: 'PUBLIC' } })
      .then(({ data }) => on && setEvents((data || []).filter((e) => e.city === event.city).slice(0, 4)))
      .catch(() => {});
    return () => { on = false; };
  }, [event.city]);

  const tips = event.tips || [];
  const summary = [tips.length && `${tips.length} tips`, events.length && `${events.length} ${events.length === 1 ? 'event' : 'events'} here`].filter(Boolean).join(' · ');

  return (
    <details className="group panel overflow-hidden" data-testid="yatra-guide">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-5 py-3 font-semibold hover:bg-mist">
        <Lightbulb size={20} className="shrink-0 text-marigold-deep" aria-hidden />
        <span className="flex-1">
          Good to know before you go
          {summary && <span className="ml-2 font-normal text-ink-soft">{summary}</span>}
        </span>
        <ChevronDown size={20} className="shrink-0 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="grid gap-6 border-t border-line p-5 md:grid-cols-2">
        <div>
          <h3 className="font-bold">About this yatra</h3>
          <p className="mt-1 text-ink-soft">{event.description}</p>
          {event.venue && (
            <p className="mt-2 flex items-center gap-2 text-sm"><MapPin size={16} aria-hidden /> {event.venue}</p>
          )}
          {tips.length > 0 && (
            <>
              <h3 className="mt-5 font-bold">Tips from our seva teams</h3>
              <ul className="mt-2 space-y-2">
                {tips.map((t) => (
                  <li key={t} className="flex gap-2 text-ink-soft">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-marigold" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div>
          {event.keyDates?.length > 0 && (
            <>
              <h3 className="font-bold">Key dates</h3>
              <ol className="mt-2 space-y-2 border-l-2 border-marigold/50 pl-4">
                {event.keyDates.map((d) => (
                  <li key={d.label}>
                    <p className="text-sm font-semibold text-terracotta">{fmtDate(d.date)}</p>
                    <p>{d.label}</p>
                  </li>
                ))}
              </ol>
            </>
          )}
          {events.length > 0 && (
            <>
              <h3 className="mt-5 font-bold">Events at this yatra</h3>
              <ul className="mt-2 space-y-2">
                {events.map((e) => (
                  <li key={e._id}>
                    <Link to={`/event/${e.slug}`} className="flex items-start gap-3 rounded-xl border border-line p-3 hover:border-ink-faint hover:bg-mist">
                      <Ticket size={18} className="mt-0.5 shrink-0 text-terracotta" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{e.title}</span>
                        <span className="flex items-center gap-1 text-sm text-ink-soft">
                          <CalendarDays size={14} aria-hidden /> {fmtDate(e.startDate)}, {fmtTime(e.startDate)} · {e.ticketPrice > 0 ? rupees(e.ticketPrice) : 'Free'}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </details>
  );
}
