import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TONE = {
  pilgrimage: '#e36f1e',
  public: '#4fb3ae',      // light teal edge
  corporate: '#2da862',
};

const BG_COLOR = {
  pilgrimage: 'bg-[#5c0f1c]', // Rich royal temple maroon for Kumbh, Wari, Rath Yatra
  public: 'bg-navy',          // teal for public events (the site's dark band colour)
  corporate: 'bg-[#0d4424]',  // Deep emerald for corporate
  all: 'bg-navy',             // teal for general/about
};

export default function PageHero({ kind = 'all', back, label, title, lead, children }) {
  const bg = BG_COLOR[kind] || BG_COLOR.all;
  const isAll = kind === 'all';

  return (
    <section className={`cg-compact-hero ${bg} relative overflow-hidden text-white shadow-xs`}>
      {/* Top accent line (only for specific event categories; omitted for 'all' to avoid duplicate tiranga under navbar) */}
      {!isAll && TONE[kind] && (
        <div
          className="h-1.5 w-full"
          style={{ background: TONE[kind] }}
        />
      )}
      <div className="shell py-6 sm:py-8 space-y-2">
        {back && (
          <Link
            to={back.to}
            className="-mt-1 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-blue-mist hover:text-white transition-colors"
          >
            <ArrowLeft size={16} aria-hidden /> {back.label}
          </Link>
        )}
        {label && <p className="cg-kicker text-saffron-light">{label}</p>}
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
          {title}
        </h1>
        {lead && (
          <p className="text-base sm:text-lg text-blue-mist max-w-3xl leading-relaxed mt-1">
            {lead}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
