import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

/**
 * Corner Festive Phataka / Sparkler Fountain (पटाखा / अनार):
 * Emits joyous twinkling golden sparks in the corner of the screen or hero.
 * Interactive: Clicking or hovering triggers a celebratory burst!
 * Lightweight pure SVG + CSS transforms (under 2KB, 60 FPS GPU).
 */
export function CornerPhataka({ position = 'bottom-right' }) {
  const [burstCount, setBurstCount] = useState(0);

  const handleBurst = () => {
    setBurstCount((c) => c + 1);
  };

  const posClass =
    position === 'bottom-left'
      ? 'bottom-6 left-6'
      : position === 'hero-corner'
      ? 'bottom-4 right-4 sm:bottom-6 sm:right-8'
      : 'bottom-6 right-6';

  return (
    <div
      onClick={handleBurst}
      role="button"
      tabIndex={0}
      aria-label="Festive Phataka - Click for celebration sparks"
      title="Click for celebratory sparks!"
      className={`fixed ${posClass} z-30 flex flex-col items-center cursor-pointer select-none group transition-transform hover:scale-110 active:scale-95`}
    >
      {/* Radiating Sparkler Particles emitting upwards */}
      <div className="relative w-16 h-20 pointer-events-none">
        {/* Continuous ambient sparks */}
        <span
          className="absolute left-6 bottom-8 text-amber-300 text-sm animate-sparkle-1"
          style={{ animationDuration: '1.8s' }}
        >
          ✦
        </span>
        <span
          className="absolute left-3 bottom-10 text-yellow-200 text-xs animate-sparkle-2"
          style={{ animationDuration: '2.2s', animationDelay: '0.4s' }}
        >
          ✨
        </span>
        <span
          className="absolute left-8 bottom-12 text-amber-400 text-xs animate-sparkle-3"
          style={{ animationDuration: '1.9s', animationDelay: '0.8s' }}
        >
          ✦
        </span>
        <span
          className="absolute left-5 bottom-14 text-orange-300 text-[10px] animate-sparkle-1"
          style={{ animationDuration: '2.5s', animationDelay: '1.2s' }}
        >
          ✴
        </span>

        {/* Dynamic Burst Sparks on click */}
        {burstCount > 0 && (
          <div key={burstCount} className="absolute inset-0">
            <span className="absolute left-2 bottom-12 text-yellow-300 text-base animate-burst-left">✨</span>
            <span className="absolute left-8 bottom-12 text-amber-200 text-lg animate-burst-right">✦</span>
            <span className="absolute left-5 bottom-16 text-white text-sm animate-burst-up">💥</span>
          </div>
        )}

        {/* Golden Anar / Firework Cone Base */}
        <svg className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-10" viewBox="0 0 32 40" fill="none">
          <defs>
            <linearGradient id="anarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="40%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#832014" />
            </linearGradient>
            <radialGradient id="sparkHalo" cx="50%" cy="20%" r="50%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Spark Core Glow */}
          <circle cx="16" cy="8" r="7" fill="url(#sparkHalo)" className="animate-pulse" />

          {/* Golden Cone Shape */}
          <polygon points="16,4 4,36 28,36" fill="url(#anarGrad)" stroke="#c99436" strokeWidth="1.2" />

          {/* Decorative band */}
          <line x1="8" y1="24" x2="24" y2="24" stroke="#fef08a" strokeWidth="1.5" />
          <line x1="6" y1="30" x2="26" y2="30" stroke="#fef08a" strokeWidth="1" strokeDasharray="1 1" />
        </svg>
      </div>

      {/* Pill Badge */}
      <span className="mt-1 rounded-full bg-[#832014]/90 border border-amber-300/60 px-2.5 py-0.5 text-[10px] font-bold text-amber-200 shadow-md backdrop-blur-xs flex items-center gap-1 group-hover:bg-[#832014]">
        <Sparkles size={11} className="text-amber-300 animate-spin" style={{ animationDuration: '8s' }} /> उत्सव
      </span>
    </div>
  );
}

/**
 * Grand Sacred Diya (महा आरती दीप):
 * A majestic ornate Indian brass Diya with a glowing, flickering sacred flame,
 * carved filigree stand, and "॥ तमसो मा ज्योतिर्गमय ॥" blessing.
 * Placed gracefully in the bottom section before the footer.
 */
export function GrandSacredDiya() {
  return (
    <section
      aria-label="Auspicious Sacred Flame"
      className="relative my-8 sm:my-12 mx-auto w-full max-w-4xl px-4 text-center select-none"
    >
      <div className="relative overflow-hidden rounded-3xl border-2 border-[#c99436]/50 bg-gradient-to-b from-[#fefbf6] via-[#faede0] to-[#f4dfca] p-6 sm:p-10 shadow-lg">
        {/* Subtle background golden aura */}
        <div className="absolute inset-0 bg-radial-gradient from-amber-400/15 via-transparent to-transparent pointer-events-none" />

        {/* Sacred Inscription */}
        <div className="relative z-10 mb-4 inline-flex items-center gap-2 rounded-full border border-amber-600/30 bg-amber-500/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-[#832014]">
          <span>॥ तमसो मा ज्योतिर्गमय ॥</span>
        </div>

        <h3 className="relative z-10 font-display text-xl sm:text-3xl font-extrabold text-[#832014] drop-shadow-xs">
          THE ETERNAL FLAME OF SIMHASTHA
        </h3>
        <p className="relative z-10 mx-auto mt-1 max-w-lg text-xs sm:text-sm text-ink-soft">
          May the sacred waters and holy lamps bring peace, auspiciousness, and health to every pilgrim.
        </p>

        {/* Majestic Ornate Brass Diya SVG */}
        <div className="relative z-10 mt-6 flex justify-center">
          <svg className="w-48 h-44 sm:w-64 sm:h-56 drop-shadow-[0_15px_30px_rgba(180,83,9,0.35)]" viewBox="0 0 240 200" fill="none">
            <defs>
              <linearGradient id="brassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="25%" stopColor="#f59e0b" />
                <stop offset="60%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>

              <linearGradient id="flameGrad" x1="50%" y1="100%" x2="50%" y2="0%">
                <stop offset="0%" stopColor="#b91c1c" />
                <stop offset="25%" stopColor="#ea580c" />
                <stop offset="60%" stopColor="#f59e0b" />
                <stop offset="85%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>

              <radialGradient id="diyaHalo" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Radiant Ambient Flame Halo */}
            <circle cx="120" cy="55" r="50" fill="url(#diyaHalo)" className="animate-sacred-pulse" />

            {/* Sacred Flickering Flame */}
            <g className="animate-float-slow origin-bottom" style={{ transformOrigin: '120px 75px' }}>
              {/* Outer Flame */}
              <path
                d="M 120,18 C 132,35 142,50 138,65 C 135,78 126,82 120,82 C 114,82 105,78 102,65 C 98,50 108,35 120,18 Z"
                fill="url(#flameGrad)"
              />
              {/* Inner White Flame Core */}
              <path
                d="M 120,38 C 126,48 130,58 128,68 C 126,75 122,78 120,78 C 118,78 114,75 112,68 C 110,58 114,48 120,38 Z"
                fill="#ffffff"
                opacity="0.85"
              />
            </g>

            {/* Cotton Wick (Batti) */}
            <line x1="120" y1="72" x2="120" y2="86" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" />

            {/* Ornate Diya Bowl (Patra) */}
            <path
              d="M 40,92 C 40,88 65,85 120,85 C 175,85 200,88 200,92 C 200,122 170,136 120,136 C 70,136 40,122 40,92 Z"
              fill="url(#brassGrad)"
              stroke="#92400e"
              strokeWidth="2"
            />

            {/* Diya Rim Filigree */}
            <ellipse cx="120" cy="92" rx="76" ry="7" fill="none" stroke="#fef08a" strokeWidth="1.5" />
            <ellipse cx="120" cy="96" rx="72" ry="6" fill="none" stroke="#78350f" strokeWidth="1" strokeDasharray="3 3" />

            {/* Diya Stem & Pillar */}
            <path
              d="M 108,136 L 104,162 Q 120,165 136,162 L 132,136 Z"
              fill="url(#brassGrad)"
              stroke="#78350f"
              strokeWidth="1.5"
            />
            {/* Pillar Ring Carving */}
            <ellipse cx="120" cy="148" rx="14" ry="3" fill="#fef08a" stroke="#78350f" strokeWidth="1" />

            {/* Ornate Stepped Pedestal Base */}
            <path
              d="M 90,162 C 85,168 70,178 60,185 C 80,188 160,188 180,185 C 170,178 155,168 150,162 Z"
              fill="url(#brassGrad)"
              stroke="#78350f"
              strokeWidth="2"
            />
            {/* Bottom Base Rim */}
            <rect x="52" y="185" width="136" height="7" rx="3.5" fill="url(#brassGrad)" stroke="#78350f" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Auspicious Footnote */}
        <p className="relative z-10 mt-3 font-display text-xs font-bold uppercase tracking-wider text-[#832014]">
          ॥ शुभं करोति कल्याणमारोग्यं धनसंपदा ॥
        </p>
      </div>
    </section>
  );
}
