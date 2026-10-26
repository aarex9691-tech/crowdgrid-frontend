import { useEffect, useState } from 'react';

/**
 * Auspicious Namaste Entrance Transition:
 * Displays on arrival seamlessly blended into the cream wallpaper background.
 * Shows the authentic Indian Namaste artwork (Anjali Mudra hands with alta, bangles, and lotus mandala)
 * for 4 to 5 seconds with a radiating golden halo and "॥ स्वागतम् ॥", then automatically dissolves
 * into the website in a smooth gradient fade-out without requiring any clicks.
 */
export default function NamasteIntro({ onComplete }) {
  const [phase, setPhase] = useState('entering'); // 'entering' -> 'glowing' -> 'dissolving' -> 'done'

  useEffect(() => {
    // Step 1: Smooth entrance to glowing state
    const t1 = setTimeout(() => {
      setPhase('glowing');
    }, 200);

    // Step 2: Show serene Namaste for ~4.5 seconds, then dissolve in gradient manner
    const t2 = setTimeout(() => {
      setPhase('dissolving');
    }, 4500);

    // Step 3: Complete transition and unmount at ~5.4s
    const t3 = setTimeout(() => {
      setPhase('done');
      if (onComplete) onComplete();
    }, 5400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  if (phase === 'done') return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center select-none pointer-events-none transition-all duration-900 ease-out ${
        phase === 'dissolving'
          ? 'opacity-0 scale-105 filter blur-sm'
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
      {/* Subtle radial golden vignette overlay */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#faf6f0]/30 to-[#faf6f0]/95 pointer-events-none" />

      {/* Centerpiece Namaste Artwork & Greetings */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-lg">
        {/* Glowing Halo & Namaste Illustration */}
        <div className="relative flex items-center justify-center">
          {/* Radiant Pulsing Golden Halo behind the Mandala */}
          <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-radial-gradient from-amber-400/30 via-amber-300/10 to-transparent animate-sacred-pulse pointer-events-none" />

          {/* Authentic Namaste Artwork blended seamlessly (no square box) */}
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

          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider text-[#832014] drop-shadow-xs">
            ॥ स्वागतम् ॥
          </h2>

          <p className="font-display text-sm sm:text-base font-bold uppercase tracking-widest text-[#c99436]">
            SIMHASTHA MAHA KUMBH 2026
          </p>

          <p className="text-xs text-ink-soft/80 font-sans tracking-wide pt-0.5">
            CrowdGrid Sacred Pilgrimage Portal
          </p>
        </div>
      </div>
    </div>
  );
}
