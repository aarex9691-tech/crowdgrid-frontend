import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import API from './api';

const AuthContext = createContext(null);

const readCachedUser = () => {
  try {
    return JSON.parse(localStorage.getItem('cg_user') || 'null');
  } catch {
    return null;
  }
};

export const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  AUTHORITY: 'District Authority',
  CORPORATE_ADMIN: 'Corporate Admin',
  NGO_ADMIN: 'NGO / Seva Admin',
  VOLUNTEER: 'Ground Volunteer',
  USER: 'Pilgrim',
};

/** Where each role lands after signing in. */
export const homeFor = (role) =>
  ({ SUPER_ADMIN: '/control', AUTHORITY: '/control', NGO_ADMIN: '/ngo', VOLUNTEER: '/scan', CORPORATE_ADMIN: '/corporate-admin' })[role] || '/';

// Which roles may open each restricted page (same lists as the <RequireRole> routes in App.jsx)
const PAGE_ROLES = [
  [/^\/scan/, ['SUPER_ADMIN', 'AUTHORITY', 'CORPORATE_ADMIN', 'NGO_ADMIN', 'VOLUNTEER']],
  [/^\/(control|analytics|host)/, ['SUPER_ADMIN', 'AUTHORITY']],
  [/^\/corporate-admin/, ['SUPER_ADMIN', 'CORPORATE_ADMIN']],
  [/^\/camps\/.+\/map/, ['SUPER_ADMIN', 'AUTHORITY', 'NGO_ADMIN']],
  [/^\/ngo/, ['SUPER_ADMIN', 'NGO_ADMIN']],
];
/** Can this role open the page at `path`? Pages not listed are open to everyone signed in. */
export const canOpen = (role, path = '') => {
  const rule = PAGE_ROLES.find(([re]) => re.test(path));
  return !rule || rule[1].includes(role);
};
/** Where to go after logging in: back to the page they came from only if their role may open it. */
export const afterLogin = (role, from) => (from && from !== '/login' && canOpen(role, from) ? from : homeFor(role));

export const STAFF_ROLES = ['SUPER_ADMIN', 'AUTHORITY', 'CORPORATE_ADMIN', 'NGO_ADMIN', 'VOLUNTEER'];

/** Only pilgrims / attendees book. Admins and hosts work from their dashboards. */
export const canBook = (user) => !user || user.role === 'USER';
export const HOST_ROLES = ['SUPER_ADMIN', 'AUTHORITY'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (localStorage.getItem('cg_token') ? readCachedUser() : null));

  const save = useCallback((token, nextUser) => {
    if (token) localStorage.setItem('cg_token', token);
    localStorage.setItem('cg_user', JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('cg_token');
    localStorage.removeItem('cg_user');
    localStorage.removeItem('cg_passes');
    localStorage.removeItem('cg_cart');
    localStorage.removeItem('cg_myqr');
    localStorage.removeItem('cg_myqr_live');
    setUser(null);
  }, []);

  // Refresh the profile on load: the role may have changed (e.g. NGO verified).
  // Offline, the cached profile keeps the passbook usable.
  const refresh = useCallback(async () => {
    if (!localStorage.getItem('cg_token')) return;
    try {
      const { data } = await API.get('/auth/me');
      save(null, data);
    } catch (err) {
      if (err.response?.status === 401) logout();
    }
  }, [save, logout]);

  useEffect(() => {
    refresh();
    const onUnauthorized = () => logout();
    window.addEventListener('cg:unauthorized', onUnauthorized);
    return () => window.removeEventListener('cg:unauthorized', onUnauthorized);
  }, [refresh, logout]);

  const value = useMemo(
    () => ({
      user,
      async login(identifier, password, countryCode = '91') {
        const { data } = await API.post('/auth/login', { identifier, password, countryCode });
        save(data.token, data.user);
        return data.user;
      },
      async register(form) {
        const { data } = await API.post('/auth/register', form);
        save(data.token, data.user);
        return data.user;
      },
      logout,
      refresh,
    }),
    [user, save, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
