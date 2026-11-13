import { useT } from '../lib/i18n';
import { LANDING_MEDIA } from '../data/landingMedia';

/*
 * Frame for the log-in and sign-up pages: the form on the left and, on wide screens,
 * the three kinds of gathering stacked on the right. The art is decorative; the form is the page.
 */
const SHOTS = [
  ['pilgrimage', '46% 55%'],
  ['public', '50% 42%'],
  ['corporate', '50% 47%'],
];

export default function AuthShell({ children }) {
  const t = useT();
  return (
    <div className="cg-auth">
      <div className="cg-auth-form">{children}</div>
      <aside className="cg-auth-art" aria-hidden="true">
        <div className="cg-hero-strip">
          {SHOTS.map(([k, pos]) => (
            <div key={k}>
              <img src={LANDING_MEDIA[k].src} alt="" decoding="async" style={{ objectPosition: pos }} />
            </div>
          ))}
        </div>
        <p className="cg-auth-quote">
          <span className="block font-display text-3xl leading-tight">{t('home.title1')} {t('home.title2')}</span>
          <span className="mt-2 block text-blue-mist">{t('access.offline')}</span>
        </p>
      </aside>
    </div>
  );
}
