import { Link } from 'react-router-dom';
import { useT } from '../lib/i18n';
import { focusPosition, LANDING_MEDIA } from '../data/landingMedia';

/*
 * The three kinds of gathering as photo cards, shared by the home page and log in / sign up.
 * Layout: the pilgrimage photo wide across the top, public and corporate side by side below,
 * the two bottom cards the same size. Each slot has a fixed shape; the photo fills it and its
 * focus point (landingMedia.js) keeps the people and the stage in frame.
 * Captions sit under the photos, never on them.
 */
const KINDS = {
  pilgrimage: { tab: 'yatras', dot: '#E36F1E', deep: '#B4530F' },
  public: { tab: 'public', dot: '#1F3F8F', deep: '#1F3F8F' },
  corporate: { tab: 'corporate', dot: '#138A43', deep: '#0D6331' },
};
// [kind, slot shape (width / height)]
const ROWS = [
  [['pilgrimage', 2]],
  [['public', 3 / 2], ['corporate', 3 / 2]],
];

function Card({ id, shape, linked, index }) {
  const t = useT();
  const k = KINDS[id];
  const m = LANDING_MEDIA[id];
  const body = (
    <>
      <span className="cg-gal-photo" style={{ aspectRatio: shape }}>
        <img src={m.src} alt="" decoding="async" style={{ objectPosition: focusPosition(m) }} />
      </span>
      <span className="cg-gal-cap">
        <span className="cg-dot shrink-0" style={{ background: k.dot }} />
        <span className="min-w-0">
          <b className="cg-gal-long">{t(`kind.${id}`)}</b>
          <b className="cg-gal-short">{t(`kind.${id}.short`)}</b>
          <small>{t(`kind.${id}.line`)}</small>
        </span>
      </span>
    </>
  );
  const style = { '--tone': k.deep };
  return linked ? (
    <Link to={`/events?tab=${k.tab}`} className={`cg-gal-card cg-rise cg-rise-${index + 1}`} style={style}>{body}</Link>
  ) : (
    <div className="cg-gal-card" style={style}>{body}</div>
  );
}

/** linked: cards open the events list for that kind (home). Otherwise decorative (log in, sign up). */
export default function GatheringGallery({ linked = false, label }) {
  let i = 0;
  const rows = ROWS.map((row) => (
    <div key={row.map(([id]) => id).join()} className="cg-gal-row">
      {row.map(([id, shape]) => <Card key={id} id={id} shape={shape} linked={linked} index={i++} />)}
    </div>
  ));
  return linked
    ? <nav aria-label={label} className="cg-gal">{rows}</nav>
    : <div className="cg-gal" aria-hidden="true">{rows}</div>;
}
