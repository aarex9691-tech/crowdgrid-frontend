import { useEffect, useState } from 'react';

/**
 * Auspicious Namaste Entrance Transition:
 * Displays on arrival over the subtle cream wallpaper. Features the user's authentic
 * Indian Namaste artwork (Anjali Mudra hands with alta, bangles, and lotus mandala).
 * Radiates a sacred golden aura with "॥ स्वागतम् ॥" and dissolves smoothly into the website.
 * Ultra-fast and lightweight (0 heavy video/GIFs).
 */
export default function NamasteIntro({ onComplete }) {
  const [phase, setPhase] = useState('entering'); // 'entering' -> 'glowing' -> 'dissolving' -> 'done'

  useEffect(() => {
    // Check if user already saw the intro in this browser session
    const seen = sessionStorage.getItem('cg_namaste_intro_seen');
    if (seen) {
      setPhase('done');
      if (onComplete) onComplete();
      return;
    }

    // Step 1: Smooth entrance
    const t1 = setTimeout(() => {
      setPhase('glowing');
    }, 200);

    // Step 2: Dissolve in gradient fade (at 2300ms)
    const t2 = setTimeout(() => {
      setPhase('dissolving');
      sessionStorage.setItem('cg_namaste_intro_seen', 'true');
    }, 2400);

    // Step 3: Unmount completely from DOM (at 3100ms)
    const t3 = setTimeout(() => {
      setPhase('done');
      if (onComplete) onComplete();
    }, 3100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  if (phase === 'done') return null;

  const handleSkip = () => {
    sessionStorage.setItem('cg_namaste_intro_seen', 'true');
    setPhase('dissolving');
    setTimeout(() => {
      setPhase('done');
      if (onComplete) onComplete();
    }, 600);
  };

  return (
    <div
      onClick={handleSkip}
      role="button"
      tabIndex={0}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer transition-all duration-700 ease-out select-none ${
        phase === 'dissolving'
          ? 'opacity-0 scale-105 pointer-events-none filter blur-sm'
          : 'opacity-100 scale-100'
      }`}
      style={{
        backgroundColor: '#faf6f0',
        backgroundImage: "url('/assets/golden-pattern.jpg')",
        backgroundRepeat: 'repeat',
        backgroundSize: '260px auto',
      }}
      aria-label="Welcome to CrowdGrid - Click to enter"
      title="Click anywhere to enter"
    >
      {/* Subtle radial golden vignette overlay */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#faf6f0]/40 to-[#faf6f0]/95 pointer-events-none" />

      {/* Centerpiece Namaste Artwork & Greetings */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-lg">
        {/* Glowing Halo & Namaste Illustration */}
        <div className="relative flex items-center justify-center">
          {/* Radiant Pulsing Golden Halo behind the Mandala */}
          <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-radial-gradient from-amber-400/30 via-amber-300/10 to-transparent animate-sacred-pulse pointer-events-none" />

          {/* Authentic High-Res Namaste Artwork */}
          <img
            src="/assets/namaste-hands.png"
            alt="Auspicious Namaste"
            className={`w-64 h-64 sm:w-80 sm:h-80 object-contain drop-shadow-[0_15px_35px_rgba(217,119,6,0.35)] transition-all duration-800 ease-out transform ${
              phase === 'entering'
                ? 'translate-y-8 scale-90 opacity-0'
                : 'translate-y-0 scale-100 opacity-100'
            }`}
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

        {/* Subtle Tap to Enter Prompt */}
        <div className="mt-6 text-[11px] font-semibold uppercase tracking-widest text-ink-faint animate-pulse">
          Tap anywhere to enter →
        </div>
      </div>
    </div>
  );
}
