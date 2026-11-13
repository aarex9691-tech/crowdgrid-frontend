import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

/*
 * One success moment for the whole app: log in, sign up, log out, every booking, payment and
 * cancellation. The same card every time; only the colour and icon say what happened:
 *   success: green tick     cancel: blue tick     leave: navy door-out arrow
 * A circle pops in, its icon draws itself, a ring ripples out, one line of text, then it fades
 * away (about one second in all). If the action moves to another page, that page is swapped in
 * underneath while the card is still up, so the change reads as one smooth step.
 * Mounted once in main.jsx; call it from anywhere with useCelebrate().
 */
const TONES = { success: 'var(--color-tulsi)', cancel: 'var(--color-blue)', leave: 'var(--color-navy)' };
const ICONS = {
  tick: 'M15 27 l7 7 l15 -16',
  out: 'M23 16 h-7 v20 h7 M27 26 h13 M35 21 l5 5 l-5 5',
};

function Splash({ title, line, tone = 'success', icon, leaving }) {
  const d = ICONS[icon || (tone === 'leave' ? 'out' : 'tick')];
  return (
    <div className={`cg-splash${leaving ? ' is-leaving' : ''}`} role="status" aria-live="polite" style={{ '--splash-tone': TONES[tone] || TONES.success }}>
      <div className="cg-splash-card">
        <span className="cg-splash-mark" aria-hidden="true">
          <span className="cg-splash-ring" />
          <svg viewBox="0 0 52 52" className="cg-splash-tick">
            <circle cx="26" cy="26" r="25" />
            <path d={d} pathLength="1" />
          </svg>
        </span>
        <p className="cg-splash-title">{title}</p>
        {line && <p className="cg-splash-line">{line}</p>}
      </div>
    </div>
  );
}

const CelebrateContext = createContext(() => {});

export function CelebrateProvider({ children }) {
  const [msg, setMsg] = useState(null);
  const timers = useRef([]);
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => clear, []);

  /** celebrate({ title, line, tone: 'success' | 'cancel' | 'leave', icon, then }) */
  const celebrate = useCallback(({ then, ...m }) => {
    clear();
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const hold = calm ? 700 : 1000;
    setMsg({ ...m, id: Date.now(), leaving: false });
    if (then) timers.current.push(setTimeout(then, hold - 250)); // next page arrives under the card
    timers.current.push(setTimeout(() => setMsg((x) => x && { ...x, leaving: true }), hold));
    timers.current.push(setTimeout(() => setMsg(null), hold + 280));
  }, []);

  return (
    <CelebrateContext.Provider value={celebrate}>
      {children}
      {msg && <Splash key={msg.id} {...msg} />}
    </CelebrateContext.Provider>
  );
}

export const useCelebrate = () => useContext(CelebrateContext);
