import { useState } from 'react';
import { Link } from 'react-router-dom';
import { fmtDate } from '../../lib/format';

/*
 * The yatras as a 3D ring: the chosen card faces you, the others turn away to the sides.
 * Each yatra carries its own emblem and colour, so no single mela owns the page.
 * Arrow buttons, a click on a side card, or the left/right keys turn the ring.
 */

const range = (n) => Array.from({ length: n }, (_, i) => i);

/** Kalash: the water pot with mango leaves and a coconut, for the Kumbh ("kumbh" means pot). */
function Kalash() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
      <path d="M40 62 C 22 74 24 104 60 106 C 96 104 98 74 80 62 Z" fill="currentColor" fillOpacity="0.16" />
      <path d="M42 62 H78 M46 54 H74 L78 62 H42 Z" />
      {[-40, -20, 0, 20, 40].map((a) => <path key={a} transform={`rotate(${a} 60 54)`} d="M60 54 C 53 42 54 30 60 22 C 66 30 67 42 60 54 Z" fill="currentColor" fillOpacity="0.22" />)}
      <circle cx="60" cy="24" r="9" fill="currentColor" fillOpacity="0.35" />
      <path d="M38 82 H82 M44 92 q 16 8 32 0" strokeWidth="2" />
    </g>
  );
}

/** Tulsi vrindavan: the holy basil in its pedestal, carried and worshipped on the Wari. */
function Tulsi() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
      <path d="M38 106 H82 V98 H38 Z M44 98 V70 H76 V98 M40 70 H80 V62 H40 Z" fill="currentColor" fillOpacity="0.16" />
      <path d="M54 98 V84 a6 6 0 0 1 12 0 V98" />
      <path d="M60 62 V22" />
      {[[30, 1], [40, -1], [50, 1], [58, -1]].map(([y, d]) => (
        <path key={y} d={`M60 ${y} C ${60 + d * 8} ${y - 10} ${60 + d * 20} ${y - 10} ${60 + d * 24} ${y - 2} C ${60 + d * 18} ${y + 4} ${60 + d * 8} ${y + 4} 60 ${y} Z`} fill="currentColor" fillOpacity="0.28" strokeWidth="2.2" />
      ))}
      <path d="M60 22 C 55 15 57 9 60 6 C 63 9 65 15 60 22 Z" fill="currentColor" fillOpacity="0.28" strokeWidth="2.2" />
    </g>
  );
}

/** The chariot wheel of the Rath Yatra. */
function Wheel() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="hx-wheel">
      <circle cx="60" cy="60" r="46" />
      <circle cx="60" cy="60" r="39" strokeWidth="1.6" />
      <circle cx="60" cy="60" r="10" fill="currentColor" fillOpacity="0.3" />
      {range(16).map((i) => (
        <path key={i} transform={`rotate(${i * 22.5} 60 60)`} d={i % 2 ? 'M60 50 V22' : 'M60 50 L56 34 L60 21 L64 34 Z'} fill="currentColor" fillOpacity="0.22" strokeWidth={i % 2 ? 2 : 1.8} />
      ))}
      {range(16).map((i) => <circle key={`b${i}`} transform={`rotate(${i * 22.5 + 11.25} 60 60)`} cx="60" cy="17.5" r="1.8" fill="currentColor" stroke="none" />)}
    </g>
  );
}

/** A diya, for any yatra without its own emblem yet. */
function Lamp() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round">
      <path d="M22 70 Q 60 112 98 70 Q 60 82 22 70 Z" fill="currentColor" fillOpacity="0.2" />
      <path d="M60 22 C 74 42 72 56 60 66 C 48 56 46 42 60 22 Z" fill="currentColor" fillOpacity="0.35" />
    </g>
  );
}

const THEMES = [
  { test: /kumbh|nashik|simhastha/i, Emblem: Kalash, tone: 'gerua' },
  { test: /wari|pandharpur|ashadhi/i, Emblem: Tulsi, tone: 'tulsi' },
  { test: /rath|puri|jagannath/i, Emblem: Wheel, tone: 'brass' },
];
// "31 Oct 2026 to 24 Jul 2028" when the years differ, "25 Jun to 15 Jul 2027" when they match
const dateRange = (e) => {
  const sameYear = new Date(e.startDate).getFullYear() === new Date(e.endDate).getFullYear();
  return `${fmtDate(e.startDate, sameYear ? { year: undefined } : {})} to ${fmtDate(e.endDate)}`;
};
const themeFor = (e) => THEMES.find((t) => t.test.test(`${e.title} ${e.city} ${e.slug}`)) || { Emblem: Lamp, tone: 'gerua' };

export default function YatraRing({ yatras = [] }) {
  const [at, setAt] = useState(0);
  const n = yatras.length;
  if (!n) return null;
  const turn = (d) => setAt((at + d + n) % n);
  // shortest way round the ring from the chosen card to card i
  const offset = (i) => {
    let d = i - at;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  };
  const onKey = (ev) => {
    if (ev.key === 'ArrowRight') { ev.preventDefault(); turn(1); }
    if (ev.key === 'ArrowLeft') { ev.preventDefault(); turn(-1); }
  };

  return (
    <section className="hx-ring" aria-labelledby="hx-ring-title">
      <div className="hx-ring-head">
        <h2 id="hx-ring-title" className="hx-title">Choose your yatra</h2>
        <p className="hx-lede">Camps, meals, shuttles and help are open for each of them. One QR pass covers all.</p>
      </div>

      <div className="hx-ring-stage" role="group" aria-roledescription="carousel" aria-label="Yatras" onKeyDown={onKey}>
        <ul className="hx-ring-track" role="list">
          {yatras.map((e, i) => {
            const d = offset(i);
            const { Emblem, tone } = themeFor(e);
            const front = d === 0;
            return (
              <li
                key={e._id || e.slug}
                className={`hx-card hx-tone-${tone}${front ? ' is-front' : ''}`}
                style={{ '--d': d, '--abs': Math.abs(d), zIndex: 10 - Math.abs(d) }}
                aria-hidden={front ? undefined : 'true'}
                onClick={front ? undefined : () => setAt(i)}
              >
                <div className="hx-card-art">
                  <svg viewBox="0 0 120 120" aria-hidden="true"><Emblem /></svg>
                </div>
                <div className="hx-card-body">
                  <h3 className="hx-card-title">{e.title}</h3>
                  <p className="hx-card-meta">{e.city}{e.state ? `, ${e.state}` : ''}</p>
                  <p className="hx-card-meta">{dateRange(e)}</p>
                  <Link to={`/yatra/${e.slug}`} className="hx-card-cta" tabIndex={front ? 0 : -1}>Plan this yatra</Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {n > 1 && (
        <div className="hx-ring-nav">
          <button type="button" className="hx-ring-btn" onClick={() => turn(-1)} aria-label="Previous yatra">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 5 L8 12 L15 19" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <p className="hx-ring-count" aria-live="polite">{yatras[at].title}, {at + 1} of {n}</p>
          <button type="button" className="hx-ring-btn" onClick={() => turn(1)} aria-label="Next yatra">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 5 L16 12 L9 19" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      )}
    </section>
  );
}
