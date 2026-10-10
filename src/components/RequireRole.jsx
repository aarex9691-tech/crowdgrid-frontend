import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

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
        <p className="mt-2 text-ink-soft">It's meant for a different role. Head back to the home page to continue.</p>
      </div>
    );
  }
  return <Outlet />;
}
