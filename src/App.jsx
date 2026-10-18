import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import RequireRole from './components/RequireRole';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Hub from './pages/Hub';
import Passbook from './pages/Passbook';
import Corporate from './pages/Corporate';
import Scanner from './pages/Scanner';
import Account from './pages/Account';
import Checkout from './pages/Checkout';
import TentMap from './pages/staff/TentMap';
import HostEvents from './pages/staff/HostEvents';
import EventDetail from './pages/EventDetail';
import Events from './pages/Events';
import About from './pages/About';
import ControlRoom from './pages/staff/ControlRoom';
import { Loading } from './components/Notice';
// Charts library is large, so the dashboard loads only when opened
const Analytics = lazy(() => import('./pages/staff/Analytics'));
import NgoPortal from './pages/staff/NgoPortal';
import CorporateAdmin from './pages/staff/CorporateAdmin';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/events" element={<Events />} />
        <Route path="/event/:slug" element={<EventDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/yatra/:slug" element={<Hub />} />
        <Route path="/corporate/:slug" element={<Corporate />} />

        <Route element={<RequireRole />}>
          <Route path="/passbook" element={<Passbook />} />
          <Route path="/account" element={<Account />} />
          <Route path="/checkout" element={<Checkout />} />
        </Route>
        <Route element={<RequireRole roles={['SUPER_ADMIN', 'AUTHORITY', 'CORPORATE_ADMIN', 'NGO_ADMIN', 'VOLUNTEER']} />}>
          <Route path="/scan" element={<Scanner />} />
        </Route>
        <Route element={<RequireRole roles={['SUPER_ADMIN', 'AUTHORITY']} />}>
          <Route path="/control" element={<ControlRoom />} />
          <Route path="/analytics" element={<Suspense fallback={<Loading label="Loading analytics" />}><Analytics /></Suspense>} />
        </Route>
        <Route element={<RequireRole roles={['SUPER_ADMIN', 'CORPORATE_ADMIN']} />}>
          <Route path="/corporate-admin" element={<CorporateAdmin />} />
        </Route>
        <Route element={<RequireRole roles={['SUPER_ADMIN', 'AUTHORITY', 'NGO_ADMIN']} />}>
          <Route path="/camps/:id/map" element={<TentMap />} />
        </Route>
        <Route element={<RequireRole roles={['SUPER_ADMIN', 'AUTHORITY']} />}>
          <Route path="/host" element={<HostEvents />} />
        </Route>
        <Route element={<RequireRole roles={['SUPER_ADMIN', 'NGO_ADMIN']} />}>
          <Route path="/ngo" element={<NgoPortal />} />
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
