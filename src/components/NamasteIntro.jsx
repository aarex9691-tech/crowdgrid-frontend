import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Auspicious Namaste Entrance Transition:
 * 100% True Fullscreen Overlay portaled directly to document.body (covers entire screen,
 * hides navbar, ticker, and hero until dissolved).
 * Shows the user's background-removed authentic Indian Namaste artwork (Anjali Mudra
 * hands with alta, bangles, and lotus mandala) seamlessly blended with the golden wallpaper.
 * Displays peacefully for ~4.5 seconds with radiating golden aura and "॥ सुस्वागतम् ॥",
 * then automatically dissolves into the website in a smooth gradient blur fade-out.
 * Non-clickable, no prompt text.
 */
export default function NamasteIntro({ onComplete }) {
  const [phase, setPhase] = useState('entering'); // 'entering' -> 'glowing' -> 'dissolving' -> 'done'
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Step 1: Smooth entrance to glowing state
    const t1 = setTimeout(() => {
      setPhase('glowing');
    }, 150);

    // Step 2: Show serene Namaste for 4.5 seconds, then dissolve in gradient manner
    const t2 = setTimeout(() => {
      setPhase('dissolving');
    }, 4500);

    // Step 3: Complete transition and unmount at ~5.5s
    const t3 = setTimeout(() => {
      setPhase('done');
      if (onComplete) onComplete();
    }, 5500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  if (!mounted || phase === 'done') return null;

  return createPortal(
    <div
      className={`fixed top-0 left-0 w-screen h-screen min-h-dvh z-[999999] flex flex-col items-center justify-center select-none pointer-events-none transition-all duration-1000 ease-out overflow-hidden ${
        phase === 'dissolving'
          ? 'opacity-0 scale-105 filter blur-md pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
      style={{
        backgroundColor: '#faf6f0',
        backgroundImage: "url('/assets/golden-pattern.jpg')",
        backgroundRepeat: 'repeat',
        backgroundSize: '260px auto',
      }}
      aria-label="Welcome to CrowdGrid - Maha Kumbh 2026"
    >
      {/* Centerpiece Namaste Artwork & Greetings */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-lg">
        {/* Glowing Halo & Namaste Illustration */}
        <div className="relative flex items-center justify-center">
          {/* Radiant Pulsing Golden Halo behind the Mandala */}
          <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-radial-gradient from-amber-400/25 via-amber-300/10 to-transparent animate-sacred-pulse pointer-events-none" />

          {/* Authentic Namaste Artwork with 100% Transparent Background */}
          <img
            src="/assets/namaste-hands.png"
            alt="Auspicious Namaste"
            className={`w-64 h-64 sm:w-80 sm:h-80 object-contain drop-shadow-[0_15px_35px_rgba(217,119,6,0.3)] transition-all duration-800 ease-out transform ${
              phase === 'entering'
                ? 'translate-y-8 scale-90 opacity-0'
                : 'translate-y-0 scale-100 opacity-100'
            }`}
            style={{ mixBlendMode: 'multiply' }}
          />
        </div>

        {/* Sacred Sanskrit Welcome Typography */}
        <div
          className={`mt-4 space-y-1.5 transition-all duration-700 delay-150 transform ${
            phase === 'entering' ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
          }`}
        >
          <div className="inline-block rounded-full bg-amber-500/10 border border-amber-600/30 px-4 py-1 text-xs font-bold uppercase tracking-widest text-[#832014]">
            ॥ ॐ नमः शिवाय ॥
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-wider text-[#832014] drop-shadow-xs">
            ॥ सुस्वागतम् ॥
          </h2>

          <p className="font-display text-sm sm:text-base font-bold uppercase tracking-widest text-[#c99436]">
            SIMHASTHA MAHA KUMBH 2026
          </p>

          <p className="text-xs text-ink-soft/80 font-sans tracking-wide pt-0.5">
            CrowdGrid Sacred Pilgrimage Portal
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
