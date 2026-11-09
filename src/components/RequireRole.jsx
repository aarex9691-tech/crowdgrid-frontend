import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { homeFor, useAuth } from '../lib/auth';

/**
 * Hides screens the user's role cannot use. This is for convenience only:
 * the API enforces every permission again on the server.
 */
export default function RequireRole({ roles }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="shell py-16 text-center">
        <h1 className="text-2xl font-bold">This page isn't available for your account</h1>
        <p className="mt-2 text-ink-soft">It's meant for a different role.</p>
        <Link to={homeFor(user.role)} className="btn-primary mt-5">Go to my home page</Link>
      </div>
    );
  }
  return <Outlet />;
}
