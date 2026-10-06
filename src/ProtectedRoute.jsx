import { Navigate, Outlet } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user } = useContext(AuthContext);

  // 1. Not logged in at all? Send to login.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Logged in, but route requires a specific role they don't have? Send to dashboard.
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // 3. Authorized! Render the route.
  return <Outlet />;
};

export default ProtectedRoute;