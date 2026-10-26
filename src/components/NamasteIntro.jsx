import { useEffect, useState } from 'react';

/**
 * Auspicious Namaste (Anjali Mudra) Entrance Transition:
 * Displays on arrival over the subtle cream wallpaper. Two ornate gold hands
 * join in prayer, radiating a sacred golden halo and "॥ स्वागतम् ॥".
 * Smoothly dissolves in a gradient manner to reveal the website beneath.
 * Ultra-lightweight: pure SVG + CSS (under 5KB, 0 heavy video/GIFs).
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

    // Step 1: Hands assemble & glow (0ms - 1400ms)
    const t1 = setTimeout(() => {
      setPhase('glowing');
    }, 400);

    // Step 2: Dissolve in gradient fade (at 2100ms)
    const t2 = setTimeout(() => {
      setPhase('dissolving');
      sessionStorage.setItem('cg_namaste_intro_seen', 'true');
    }, 2200);

    // Step 3: Unmount completely from DOM (at 2900ms)
    const t3 = setTimeout(() => {
      setPhase('done');
      if (onComplete) onComplete();
    }, 2900);

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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer transition-all duration-700 ease-out ${
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

      {/* Centerpiece Namaste Assembly */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-md select-none">
        {/* Radiating Sunburst / Chakra Halo */}
        <div className="relative flex items-center justify-center">
          <svg
            className={`w-48 h-48 sm:w-60 sm:h-60 text-amber-500/25 transition-all duration-1000 ${
              phase === 'glowing' ? 'scale-110 rotate-45 opacity-80' : 'scale-90 rotate-0 opacity-40'
            }`}
            viewBox="0 0 200 200"
            fill="none"
          >
            {/* 16 Radiating Rays */}
            {Array.from({ length: 16 }).map((_, i) => (
              <line
                key={i}
                x1="100"
                y1="100"
                x2={100 + 85 * Math.cos((i * Math.PI) / 8)}
                y2={100 + 85 * Math.sin((i * Math.PI) / 8)}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            ))}
            <circle cx="100" cy="100" r="60" stroke="#d97706" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
            <circle cx="100" cy="100" r="75" stroke="#f59e0b" strokeWidth="1.5" opacity="0.3" />
          </svg>

          {/* Golden Namaste Hands (Anjali Mudra) SVG */}
          <div
            className={`absolute transition-all duration-700 ease-out transform ${
              phase === 'entering'
                ? 'translate-y-8 scale-90 opacity-0'
                : 'translate-y-0 scale-100 opacity-100 drop-shadow-[0_10px_25px_rgba(217,119,6,0.35)]'
            }`}
          >
            <svg className="w-28 h-36 sm:w-36 sm:h-44" viewBox="0 0 120 150" fill="none">
              <defs>
                <linearGradient id="goldHandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="35%" stopColor="#f59e0b" />
                  <stop offset="70%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#92400e" />
                </linearGradient>
                <linearGradient id="goldShineGrad" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                  <stop offset="60%" stopColor="#fef08a" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Ornate Cuff / Bangles (Kadas) at wrists */}
              <g stroke="url(#goldHandGrad)" strokeWidth="2.5">
                {/* Left wrist cuff */}
                <path d="M 28,135 Q 45,130 54,136" fill="none" strokeWidth="3.5" />
                <path d="M 26,140 Q 45,135 54,141" fill="none" strokeWidth="2" strokeDasharray="2 2" />
                
                {/* Right wrist cuff */}
                <path d="M 92,135 Q 75,130 66,136" fill="none" strokeWidth="3.5" />
                <path d="M 94,140 Q 75,135 66,141" fill="none" strokeWidth="2" strokeDasharray="2 2" />
              </g>

              {/* Left Hand Silhouette joined at palm */}
              <path
                d="M 32,135 C 30,115 32,95 38,82 C 40,77 42,65 46,55 C 49,47 52,32 55,22 C 57,17 59,12 60,10 C 60,10 60,25 60,45 C 60,65 59,95 56,135 Z"
                fill="url(#goldHandGrad)"
                stroke="#78350f"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />

              {/* Right Hand Silhouette joined at palm */}
              <path
                d="M 88,135 C 90,115 88,95 82,82 C 80,77 78,65 74,55 C 71,47 68,32 65,22 C 63,17 61,12 60,10 C 60,10 60,25 60,45 C 60,65 61,95 64,135 Z"
                fill="url(#goldHandGrad)"
                stroke="#78350f"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />

              {/* Finger Contours & Creases */}
              <g stroke="#92400e" strokeWidth="1.2" strokeLinecap="round" opacity="0.8">
                {/* Thumb lines */}
                <path d="M 46,88 Q 50,84 54,86" />
                <path d="M 74,88 Q 70,84 66,86" />
                
                {/* Index & middle finger subtle crease accents */}
                <path d="M 50,55 Q 55,52 58,54" />
                <path d="M 70,55 Q 65,52 62,54" />
                
                <path d="M 53,38 Q 56,36 58,37" />
                <path d="M 67,38 Q 64,36 62,37" />
              </g>

              {/* Palm Center Line (Sacred Meeting Point) */}
              <line x1="60" y1="10" x2="60" y2="135" stroke="#fef08a" strokeWidth="1.5" opacity="0.9" />

              {/* Radiant Light Core between palms */}
              <circle cx="60" cy="50" r="8" fill="url(#goldShineGrad)" />
              <circle cx="60" cy="50" r="3" fill="#ffffff" opacity="0.9" />
            </svg>
          </div>
        </div>

        {/* Sacred Sanskrit Welcome Typography */}
        <div
          className={`mt-6 space-y-1.5 transition-all duration-700 delay-200 transform ${
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

          <p className="text-xs text-ink-soft/80 font-sans tracking-wide pt-1">
            CrowdGrid Sacred Pilgrimage Portal
          </p>
        </div>

        {/* Subtle Tap to Enter Prompt */}
        <div className="mt-8 text-[11px] font-semibold uppercase tracking-widest text-ink-faint animate-pulse">
          Tap anywhere to enter →
        </div>
      </div>
    </div>
  );
}
