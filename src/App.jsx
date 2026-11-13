import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import RequireRole from './components/RequireRole';
import { Loading } from './components/Notice';
// First screens a visitor sees ship in the main download
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';

// Everything else loads when it is opened, so the home page appears sooner on slow networks
const loadHub = () => import('./pages/Hub');
const loadPassbook = () => import('./pages/Passbook');
const Hub = lazy(loadHub);
const Passbook = lazy(loadPassbook);
const Corporate = lazy(() => import('./pages/Corporate'));
const Scanner = lazy(() => import('./pages/Scanner'));
const Account = lazy(() => import('./pages/Account'));
const Checkout = lazy(() => import('./pages/Checkout'));
const About = lazy(() => import('./pages/About'));
const Help = lazy(() => import('./pages/Help'));
const TentMap = lazy(() => import('./pages/staff/TentMap'));
const HostEvents = lazy(() => import('./pages/staff/HostEvents'));
const ControlRoom = lazy(() => import('./pages/staff/ControlRoom'));
const Analytics = lazy(() => import('./pages/staff/Analytics'));
const NgoPortal = lazy(() => import('./pages/staff/NgoPortal'));
const CorporateAdmin = lazy(() => import('./pages/staff/CorporateAdmin'));
const SetPassword = lazy(() => import('./pages/SetPassword'));
const HelpDesk = lazy(() => import('./pages/staff/HelpDesk'));
const Volunteers = lazy(() => import('./pages/staff/Volunteers'));

/** Wraps a lazily loaded page; the header and footer stay on screen while it loads. */
const page = (Page, label = 'Loading') => (
  <Suspense fallback={<Loading label={label} variant="page" />}>
    <Page />
  </Suspense>
);

export default function App() {
  // After the first screen is up, fetch the passbook and yatra services in the background.
  // The service worker caches them, so the passbook still opens with no network.
  useEffect(() => {
    const warm = () => { loadPassbook(); loadHub(); };
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(warm, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(warm, 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/events" element={<Events />} />
        <Route path="/event/:slug" element={<EventDetail />} />
        <Route path="/about" element={page(About)} />
        <Route path="/help" element={page(Help)} />
        <Route path="/yatra/:slug" element={page(Hub)} />
        <Route path="/corporate/:slug" element={page(Corporate)} />

        <Route element={<RequireRole />}>
          <Route path="/set-password" element={page(SetPassword)} />
          <Route path="/passbook" element={page(Passbook)} />
          <Route path="/account" element={page(Account)} />
          <Route path="/checkout" element={page(Checkout)} />
        </Route>
        <Route element={<RequireRole roles={['SUPER_ADMIN', 'AUTHORITY', 'CORPORATE_ADMIN', 'NGO_ADMIN', 'VOLUNTEER']} />}>
          <Route path="/scan" element={page(Scanner)} />
        </Route>
        <Route element={<RequireRole roles={['SUPER_ADMIN', 'AUTHORITY']} />}>
          <Route path="/control" element={page(ControlRoom)} />
          <Route path="/analytics" element={page(Analytics, 'Loading analytics')} />
        </Route>
        <Route element={<RequireRole roles={['SUPER_ADMIN', 'CORPORATE_ADMIN']} />}>
          <Route path="/corporate-admin" element={page(CorporateAdmin)} />
        </Route>
        <Route element={<RequireRole roles={['SUPER_ADMIN', 'AUTHORITY', 'NGO_ADMIN']} />}>
          <Route path="/camps/:id/map" element={page(TentMap)} />
        </Route>
        <Route element={<RequireRole roles={['SUPER_ADMIN', 'AUTHORITY']} />}>
          <Route path="/host" element={page(HostEvents)} />
          <Route path="/helpdesk" element={page(HelpDesk)} />
          <Route path="/volunteers" element={page(Volunteers, 'Loading volunteers')} />
        </Route>
        <Route element={<RequireRole roles={['SUPER_ADMIN', 'NGO_ADMIN']} />}>
          <Route path="/ngo" element={page(NgoPortal)} />
        </Route>

        <Route
          path="*"
          element={
            <div className="shell py-16 text-center">
              <h1 className="text-2xl font-bold">Page not found</h1>
              <a href="/" className="btn-primary mt-4">Go to home</a>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}
