import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import DepthImage from './landing/DepthImage';
import { LANDING_MEDIA } from '../data/landingMedia';

/*
 * The top of every public page: a full-width photo with the title on a solid navy card.
 *
 *  kind="pilgrimage" | "public" | "corporate"  one photo, 3D under the mouse on desktop
 *  kind="all"                                   the three gatherings side by side (neutral pages)
 *
 * The card keeps text readable over any photo. Its top edge carries the colour of the kind.
 */
const KINDS = ['pilgrimage', 'public', 'corporate'];

// Which part of each photo stays in view inside a wide, short band
const FOCUS = {
  pilgrimage: [0.46, 0.55],
  public: [0.5, 0.42],
  corporate: [0.5, 0.47],
};

const TONE = {
  pilgrimage: '#e36f1e',
  public: '#5b7be8',
  corporate: '#2da862',
  all: 'linear-gradient(to right, #e36f1e 0 33.33%, #ffffff 33.33% 66.66%, #138a43 66.66% 100%)',
};

export default function PageHero({ kind = 'all', size, back, label, title, lead, children }) {
  const shot = KINDS.includes(kind) ? LANDING_MEDIA[kind] : null;
  return (
    <section className={`cg-hero ${size === 'sm' ? 'cg-hero-sm' : ''}`} data-depth-group style={{ '--hero-tone': TONE[kind] || TONE.all }}>
      <div className="cg-hero-media" aria-hidden="true">
        {shot ? (
          <div className="cg-hero-shot" key={kind}>
            <DepthImage src={shot.src} depth={shot.depth} focus={FOCUS[kind]} strength={0.012} />
          </div>
        ) : (
          <div className="cg-hero-strip">
            {KINDS.map((k) => (
              <div key={k}>
                <img src={LANDING_MEDIA[k].src} alt="" decoding="async" style={{ objectPosition: `${FOCUS[k][0] * 100}% ${FOCUS[k][1] * 100}%` }} />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="shell cg-hero-inner">
        <div className="cg-hero-card">
          {back && (
            <Link to={back.to} className="-mt-1 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-blue-mist hover:text-white">
              <ArrowLeft size={16} aria-hidden /> {back.label}
            </Link>
          )}
          {label && <p className="cg-kicker text-saffron-light">{label}</p>}
          <h1>{title}</h1>
          {lead && <p className="mt-2 max-w-prose text-blue-mist">{lead}</p>}
          {children}
        </div>
      </div>
    </section>
  );
}
