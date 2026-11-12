import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { BedDouble, BusFront, Footprints, HandHeart, Info, Siren, UtensilsCrossed } from 'lucide-react';
import API, { errorMessage } from '../lib/api';
import { fmtDate } from '../lib/format';
import PrebookNotice from '../components/PrebookNotice';
import Notice, { Loading } from '../components/Notice';
import { canBook, homeFor, ROLE_LABELS, useAuth } from '../lib/auth';
import LodgingTab from './hub/LodgingTab';
import FoodTab from './hub/FoodTab';
import TransitTab from './hub/TransitTab';
import SevaTab from './hub/SevaTab';
import SosTab from './hub/SosTab';
import SnanDates from '../components/SnanDates';
import YatraGuide from '../components/YatraGuide';
import { useT } from '../lib/i18n';
import PageHero from '../components/PageHero';

// The walking map (Leaflet) only loads when the tab is opened
const RouteTab = lazy(() => import('./hub/RouteTab'));
const ROUTE_EVENT = 'simhastha-kumbh-2027'; // walking lanes are mapped for Nashik so far

// Label and one-line hint for each tab come from the language file (lib/i18n.jsx): tab.<id>, hint.<id>
const TABS = [
  { id: 'lodging', icon: BedDouble, Component: LodgingTab },
  { id: 'food', icon: UtensilsCrossed, Component: FoodTab },
  { id: 'transit', icon: BusFront, Component: TransitTab },
  { id: 'route', icon: Footprints, Component: RouteTab, only: ROUTE_EVENT },
  { id: 'seva', icon: HandHeart, Component: SevaTab },
  { id: 'sos', icon: Siren, Component: SosTab },
];

export default function Hub() {
  const { user } = useAuth();
  const t = useT();
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get(`/events/${slug}`)
      .then(({ data }) => setEvent(data))
      .catch((e) => setError(errorMessage(e)));
  }, [slug]);

  if (error) return <div className="shell py-10"><Notice tone="error">{error}</Notice></div>;
  if (!event) return <Loading label="Opening yatra portal" />;
  const tabs = TABS.filter((x) => !x.only || x.only === event.slug);
  const active = tabs.find((x) => x.id === params.get('tab')) || tabs[0];

  const isYatra = event.kind === 'YATRA' || event.slug?.includes('kumbh') || event.slug?.includes('wari') || event.slug?.includes('rath');

  return (
    <div className={isYatra ? 'cg-yatra-theme' : ''}>
      <PageHero
        kind="pilgrimage"
        back={{ to: '/events?tab=yatras', label: t('hub.allYatras') }}
        title={event.title}
        lead={event.tagline}
      >
        <p className="mt-1 text-blue-mist">{fmtDate(event.startDate)} to {fmtDate(event.endDate)}</p>
        <SnanDates event={event} all />
      </PageHero>

      {/* Service ribbon: switches tabs without a page reload (FR-03) */}
      <nav aria-label={t('hub.services')} className="sticky top-[var(--header-h,4rem)] z-20 border-b border-line bg-white shadow-2xs">
        <div className="shell no-scrollbar flex gap-2 overflow-x-auto" role="tablist">
          {tabs.map((tab) => {
            const selected = tab.id === active.id;
            const sos = tab.id === 'sos';
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setParams({ tab: tab.id }, { replace: true })}
                className={`flex min-h-14 sm:min-h-16 shrink-0 items-center gap-2.5 border-b-[3.5px] px-4 sm:px-6 text-base sm:text-lg font-bold transition-all ${
                  selected
                    ? (sos ? 'border-kumkum text-kumkum bg-kumkum-wash/40' : 'border-marigold text-ink bg-marigold-wash/30')
                    : (sos ? 'border-transparent text-kumkum hover:border-kumkum/40 hover:bg-kumkum-wash/20' : 'border-transparent text-ink-soft hover:text-ink hover:bg-mist')
                }`}
              >
                <tab.icon size={22} aria-hidden />
                {t(`tab.${tab.id}`)}
              </button>
            );
          })}
        </div>
      </nav>
      {!canBook(user) && (
        <div className="shell pt-4">
          <Notice>
            Staff view ({ROLE_LABELS[user.role]}): you can see live availability here. Booking is only for pilgrims.{' '}
            <Link className="font-bold underline" to={homeFor(user.role)}>Go to your dashboard</Link>
          </Notice>
        </div>
      )}

      <div className="shell space-y-6 py-8" role="tabpanel">
        {canBook(user) && <PrebookNotice event={event} />}
        <YatraGuide event={event} />
        <p className="flex items-start gap-3 rounded-2xl border border-line bg-mist/70 p-4 sm:p-5 text-base sm:text-lg text-ink-soft" data-testid="tab-hint">
          <Info size={22} className="mt-0.5 shrink-0 text-blue" aria-hidden />
          <span>{t(`hint.${active.id}`)}</span>
        </p>
        <div className="pt-2">
          <Suspense fallback={<Loading label="Loading" />}>
            <active.Component event={event} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
