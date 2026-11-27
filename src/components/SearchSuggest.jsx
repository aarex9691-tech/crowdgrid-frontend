import { useDeferredValue, useEffect, useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, Flag, MapPin, Search, Ticket } from 'lucide-react';
import API from '../lib/api';
import { fmtDate } from '../lib/format';
import { useT } from '../lib/i18n';
import { DEFAULT_EVENTS } from '../data/defaultEvents';
import { eventPath, splitMatch, suggestEvents } from '../lib/eventSearch';

/*
 * Header search with live suggestions (WAI-ARIA combobox pattern).
 * While the visitor types, matching yatras and public events appear under the box;
 * Enter or "See all results" opens the filtered Events page as before.
 * The event list is fetched once per visit and filtered on the device, so suggestions are instant.
 */

let cache = null; // one request per page load, shared by the desktop and mobile boxes
const loadEvents = () => {
  if (!cache) {
    cache = API.get('/events')
      .then(({ data }) => (Array.isArray(data) && data.length ? data : DEFAULT_EVENTS))
      .catch(() => {
        cache = null; // try again next time the box is used
        return DEFAULT_EVENTS;
      });
  }
  return cache;
};

const dateRange = (e) => {
  const from = fmtDate(e.startDate, { year: undefined });
  const to = e.endDate ? fmtDate(e.endDate) : '';
  return to && to !== fmtDate(e.startDate) ? `${from} – ${to}` : fmtDate(e.startDate);
};

function Highlight({ text, query }) {
  const [before, match, after] = splitMatch(text, query);
  return (
    <>
      {before}
      {match && <b className="font-extrabold text-ink">{match}</b>}
      {after}
    </>
  );
}

/** variant "pill": the compact desktop box with a floating list; "menu": the full-width box in the phone menu. */
export default function SearchSuggest({ variant = 'pill', onDone }) {
  const t = useT();
  const navigate = useNavigate();
  const id = useId();
  const [query, setQuery] = useState('');
  const [events, setEvents] = useState(DEFAULT_EVENTS);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [wanted, setWanted] = useState(false);
  const deferred = useDeferredValue(query);

  // fetch the event list the first time the box is used
  useEffect(() => {
    if (!wanted) return undefined;
    let alive = true;
    loadEvents().then((list) => alive && setEvents(list));
    return () => {
      alive = false;
    };
  }, [wanted]);

  const trimmed = deferred.trim();
  const results = useMemo(() => suggestEvents(events, trimmed), [events, trimmed]);
  const showList = open && trimmed.length > 0;
  const seeAllIndex = results.length; // the last row: "See all results"
  const optionId = (i) => `${id}-opt-${i}`;

  const finish = (to) => {
    navigate(to);
    setQuery('');
    setOpen(false);
    setActive(-1);
    onDone?.();
  };
  const seeAll = () => trimmed && finish(`/events?q=${encodeURIComponent(trimmed)}`);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!trimmed) return;
      e.preventDefault();
      setOpen(true);
      const last = seeAllIndex;
      setActive((i) => (e.key === 'ArrowDown' ? (i >= last ? 0 : i + 1) : i <= 0 ? last : i - 1));
    } else if (e.key === 'Escape') {
      if (open) {
        e.stopPropagation(); // close the list first, not the whole phone menu
        setOpen(false);
        setActive(-1);
      }
    }
  };
  const onSubmit = (e) => {
    e.preventDefault();
    if (showList && active >= 0 && active < results.length) finish(eventPath(results[active]));
    else seeAll();
  };

  const pill = variant === 'pill';
  const form = pill
    ? 'flex items-center rounded-full border border-line bg-mist py-1 pr-1 pl-3.5 text-sm transition-[border-color,background-color] focus-within:border-navy focus-within:bg-white'
    : 'flex items-center rounded-xl border-[1.5px] border-edge bg-white py-1.5 pr-1.5 pl-3 text-sm focus-within:border-blue';
  const list = pill
    ? 'absolute left-0 top-full z-50 mt-2 w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-white shadow-xl'
    : 'mt-2 overflow-hidden rounded-xl border border-line bg-white';

  return (
    <div
      className={pill ? 'relative hidden xl:block flex-1 max-w-sm' : 'relative mb-3'}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setOpen(false);
          setActive(-1);
        }
      }}
    >
      <form role="search" onSubmit={onSubmit} className={form}>
        <Search size={pill ? 16 : 18} className={`shrink-0 text-ink-soft ${pill ? '' : 'mr-2'}`} aria-hidden />
        <input
          type="text"
          role="combobox"
          aria-label="Search events"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={`${id}-list`}
          aria-activedescendant={showList && active >= 0 ? optionId(active) : undefined}
          autoComplete="off"
          placeholder={t('nav.searchPlaceholder')}
          value={query}
          onFocus={() => {
            setWanted(true);
            setOpen(true);
          }}
          onClick={() => setOpen(true)} // reopen after Esc without leaving the box
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onKeyDown={onKeyDown}
          className={pill ? 'h-9 w-full bg-transparent px-2.5 text-sm text-ink outline-none placeholder:text-ink-soft' : 'w-full bg-transparent text-base text-ink outline-none placeholder:text-ink-faint'}
        />
        {pill ? (
          <button type="submit" aria-label={t('nav.search')} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-white hover:bg-[#14504f]">
            <Search size={13} strokeWidth={2.5} aria-hidden />
          </button>
        ) : (
          <button type="submit" className="flex min-h-11 shrink-0 items-center rounded-lg bg-navy px-3.5 text-sm font-bold text-white hover:bg-[#14504f]">{t('nav.search')}</button>
        )}
      </form>

      {showList && (
        <ul id={`${id}-list`} role="listbox" aria-label="Suggestions" className={list}>
          {results.length === 0 && (
            <li role="presentation" className="px-4 py-3 text-[15px] text-ink-soft">{t('search.none', { q: trimmed })}</li>
          )}
          {results.map((e, i) => {
            const Icon = e.kind === 'YATRA' ? Flag : Ticket;
            return (
              <li
                key={e._id || e.slug}
                id={optionId(i)}
                role="option"
                aria-selected={active === i}
                onMouseDown={(ev) => ev.preventDefault()} // keep focus in the box so the click lands
                onMouseEnter={() => setActive(i)}
                onClick={() => finish(eventPath(e))}
                className={`flex cursor-pointer items-start gap-3 px-4 py-2.5 ${active === i ? 'bg-mist' : ''}`}
              >
                <Icon size={18} className={`mt-0.5 flex-none ${e.kind === 'YATRA' ? 'text-terracotta-dark' : 'text-blue'}`} aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate text-[15px] text-ink" translate="no"><Highlight text={e.title} query={trimmed} /></span>
                  <span className="mt-0.5 flex flex-wrap gap-x-3 text-sm text-ink-soft">
                    <span className="font-semibold">{e.kind === 'YATRA' ? t('search.yatra') : t('search.event')}</span>
                    {e.city && (
                      <span className="inline-flex items-center gap-1"><MapPin size={13} aria-hidden />{e.city}</span>
                    )}
                    <span className="inline-flex items-center gap-1"><CalendarDays size={13} aria-hidden />{dateRange(e)}</span>
                  </span>
                </span>
              </li>
            );
          })}
          <li
            id={optionId(seeAllIndex)}
            role="option"
            aria-selected={active === seeAllIndex}
            onMouseDown={(ev) => ev.preventDefault()}
            onMouseEnter={() => setActive(seeAllIndex)}
            onClick={seeAll}
            className={`flex cursor-pointer items-center gap-2 border-t border-line px-4 py-2.5 text-[15px] font-semibold text-blue ${active === seeAllIndex ? 'bg-mist' : ''}`}
          >
            <Search size={15} aria-hidden /> {t('search.seeAll', { q: trimmed })} <ArrowRight size={15} className="ml-auto" aria-hidden />
          </li>
        </ul>
      )}
      <p className="sr-only" aria-live="polite">{showList ? t('search.count', { n: results.length }) : ''}</p>
    </div>
  );
}
