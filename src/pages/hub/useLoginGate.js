import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';

/** Returns a function that sends logged-out visitors to log in, then back here. */
export default function useLoginGate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  return () => {
    if (user) return true;
    navigate('/login', { state: { from: location.pathname + location.search } });
    return false;
  };
}
