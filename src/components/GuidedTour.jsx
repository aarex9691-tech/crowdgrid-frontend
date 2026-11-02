import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BedDouble, MapPinned, QrCode, Siren, X } from 'lucide-react';
import { SITE } from '../lib/site';

const KEY = 'cg_tour_done';
const OPEN_EVENT = 'cg:open-tour';

/** Opens the tour from anywhere (Help page, home page link). */
export const openTour = () => window.dispatchEvent(new Event(OPEN_EVENT));

const STEPS = [
  {
    icon: MapPinned,
    title: 'Choose your yatra',
    text: 'Start with the Simhastha Kumbh at Nashik, or pick the Pandharpur Wari or the Jagannath Rath Yatra. Each yatra has its own page with key dates and tips.',
  },
  {
    icon: BedDouble,
    title: 'Book stay, food and transport',
    text: 'On the yatra page, use the tabs to book a bed in a verified camp, a free meal token and a bus pass. One account can book for up to 5 people.',
  },
  {
    icon: QrCode,
    title: 'One QR for everything',
    text: 'Everything you book is saved in My Passbook. Show your personal QR at the camp, kitchen or bus. It works even when the network is weak.',
  },
  {
    icon: Siren,
    title: 'Help is one tap away',
    text: 'Use the Emergency SOS tab to call for help or report a missing person. Our control room and volunteers see it right away. In danger, call 112.',
  },
];

const done = () => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return true; // storage blocked: do not keep showing it
  }
};

/**
 * A short welcome tour for first-time visitors: four steps on how CrowdGrid works.
 * Opens once on the home page (after the welcome animation), and again from
 * "Take the tour" links.
 */
export default function GuidedTour({ auto = false }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const dialogRef = useRef(null);

  const close = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* ignore */
    }
  }, []);

  // first visit: wait for the welcome animation to finish, then open
  useEffect(() => {
    if (!auto || done()) return undefined;
    const id = setInterval(() => {
      if (!document.querySelector('[data-namaste-intro]')) {
        clearInterval(id);
        setStep(0);
        setOpen(true);
      }
    }, 600);
    return () => clearInterval(id);
  }, [auto]);

  useEffect(() => {
    const show = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, show);
    return () => window.removeEventListener(OPEN_EVENT, show);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') setStep((s) => Math.min(s + 1, STEPS.length - 1));
      if (e.key === 'ArrowLeft') setStep((s) => Math.max(s - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    dialogRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!open) return null;
  const s = STEPS[step];
  const last = step === STEPS.length - 1;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-ink/60 p-4 sm:items-center" onClick={close}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        tabIndex={-1}
        data-testid="guided-tour"
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4">
          <p className="text-sm font-semibold text-ink-soft">
            How {SITE.name} works · {step + 1} of {STEPS.length}
          </p>
          <button type="button" onClick={close} className="grid size-10 place-items-center rounded-full text-ink-soft hover:bg-mist" aria-label="Close tour">
            <X size={20} aria-hidden />
          </button>
        </div>
        <div className="px-6 pb-2 pt-3">
          <span className="grid size-14 place-items-center rounded-2xl bg-marigold-wash text-marigold-deep">
            <s.icon size={30} aria-hidden />
          </span>
          <h2 id="tour-title" className="mt-4 text-2xl font-bold">{s.title}</h2>
          <p className="mt-2 text-lg leading-relaxed text-ink-soft">{s.text}</p>
        </div>
        <div className="flex justify-center gap-2 py-3" aria-hidden>
          {STEPS.map((x, i) => (
            <span key={x.title} className={`h-2 rounded-full transition-all ${i === step ? 'w-6 bg-terracotta' : 'w-2 bg-line'}`} />
          ))}
        </div>
        <div className="flex items-center gap-3 border-t border-line px-5 py-4">
          {step > 0 ? (
            <button type="button" className="btn-ghost" onClick={() => setStep(step - 1)}>
              <ArrowLeft size={18} aria-hidden /> Back
            </button>
          ) : (
            <button type="button" className="btn-ghost" onClick={close}>Skip</button>
          )}
          <span className="flex-1" />
          {last ? (
            <Link to={`/yatra/${SITE.flagshipSlug}`} className="btn-primary" onClick={close}>
              Start booking <ArrowRight size={18} aria-hidden />
            </Link>
          ) : (
            <button type="button" className="btn-primary" onClick={() => setStep(step + 1)}>
              Next <ArrowRight size={18} aria-hidden />
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
