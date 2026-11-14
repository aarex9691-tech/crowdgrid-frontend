import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
  EVENT_HOST: 'Event Host',
  ORG_HOST: 'Organisation Host',
  NGO_ADMIN: 'NGO / Seva Admin',
  VOLUNTEER: 'Ground Volunteer',
  USER: 'Pilgrim',
};

/** Where each role lands after signing in. */
export const homeFor = (role) =>
  ({ SUPER_ADMIN: '/control', AUTHORITY: '/control', NGO_ADMIN: '/ngo', VOLUNTEER: '/scan', CORPORATE_ADMIN: '/corporate-admin', EVENT_HOST: '/host', ORG_HOST: '/host' })[role] || '/';

// Which roles may open each restricted page (same lists as the <RequireRole> routes in App.jsx)
const PAGE_ROLES = [
  [/^\/scan/, ['SUPER_ADMIN', 'AUTHORITY', 'CORPORATE_ADMIN', 'EVENT_HOST', 'ORG_HOST', 'NGO_ADMIN', 'VOLUNTEER']],
  [/^\/host-with-us/, null], // open to everyone
  [/^\/host-requests/, ['SUPER_ADMIN']],
  [/^\/host(\/|$)/, ['SUPER_ADMIN', 'AUTHORITY', 'EVENT_HOST', 'ORG_HOST']],
  [/^\/(control|analytics|helpdesk|volunteers)/, ['SUPER_ADMIN', 'AUTHORITY']],
  [/^\/corporate-admin/, ['SUPER_ADMIN', 'CORPORATE_ADMIN', 'ORG_HOST']],
  [/^\/camps\/.+\/map/, ['SUPER_ADMIN', 'AUTHORITY', 'NGO_ADMIN']],
  [/^\/ngo/, ['SUPER_ADMIN', 'NGO_ADMIN']],
];
/** Can this role open the page at `path`? Pages not listed are open to everyone signed in. */
export const canOpen = (role, path = '') => {
  const page = String(path).split(/[?#]/)[0]; // "/host?tab=x" is the /host page
  const rule = PAGE_ROLES.find(([re]) => re.test(page));
  return !rule || !rule[1] || rule[1].includes(role);
};
/** Where to go after logging in: back to the page they came from only if their role may open it. */
export const afterLogin = (role, from) => (from && from !== '/login' && canOpen(role, from) ? from : homeFor(role));

export const STAFF_ROLES = ['SUPER_ADMIN', 'AUTHORITY', 'CORPORATE_ADMIN', 'EVENT_HOST', 'ORG_HOST', 'NGO_ADMIN', 'VOLUNTEER'];

/** Only pilgrims / attendees book. Admins and hosts work from their dashboards. */
export const canBook = (user) => !user || user.role === 'USER';
export const HOST_ROLES = ['SUPER_ADMIN', 'AUTHORITY', 'EVENT_HOST', 'ORG_HOST']; // may host public events

/** Everything stored for the signed-in person (not the language or other device settings). */
function clearPersonalCache() {
  for (const k of ['cg_passes', 'cg_cart', 'cg_myqr', 'cg_myqr_live']) localStorage.removeItem(k);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (localStorage.getItem('cg_token') ? readCachedUser() : null));

  // Bumped on logout: a profile request that started before it must not log the person back in
  const session = useRef(0);

  const save = useCallback((token, nextUser) => {
    // A different person on this phone: drop the previous person's passes, QR and cart first
    const before = readCachedUser();
    const idOf = (u) => String(u?._id || u?.id || '');
    if (before && idOf(before) !== idOf(nextUser)) clearPersonalCache();
    if (token) localStorage.setItem('cg_token', token);
    localStorage.setItem('cg_user', JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    session.current += 1;
    localStorage.removeItem('cg_token');
    localStorage.removeItem('cg_user');
    clearPersonalCache();
    setUser(null);
  }, []);

  // Refresh the profile on load: the role may have changed (e.g. NGO verified).
  // Offline, the cached profile keeps the passbook usable.
  const refresh = useCallback(async () => {
    const token = localStorage.getItem('cg_token');
    if (!token) return false;
    const started = session.current;
    try {
      const { data } = await API.get('/auth/me');
      // logged out (or someone else logged in) while this was loading: ignore the old answer
      if (session.current !== started || localStorage.getItem('cg_token') !== token) return false;
      save(null, data);
      return true;
    } catch (err) {
      if (err.response?.status === 401 && session.current === started) logout();
      return false;
    }
  }, [save, logout]);

  useEffect(() => {
    refresh();
    const onUnauthorized = () => logout();
    // the server says a new password is needed (help desk reset): reload the profile so the app sends them there
    const onPasswordRequired = () => refresh();
    window.addEventListener('cg:unauthorized', onUnauthorized);
    window.addEventListener('cg:password-required', onPasswordRequired);
    return () => {
      window.removeEventListener('cg:unauthorized', onUnauthorized);
      window.removeEventListener('cg:password-required', onPasswordRequired);
    };
  }, [refresh, logout]);

  const value = useMemo(
    () => ({
      user,
      async login(identifier, password, countryCode = '91') {
        const { data } = await API.post('/auth/login', { identifier, password, countryCode });
        session.current += 1; // a profile request from before this login must not overwrite it
        save(data.token, data.user);
        return data.user;
      },
      async register(form) {
        const { data } = await API.post('/auth/register', form);
        session.current += 1;
        save(data.token, data.user);
        return data.user;
      },
      /** Sets a new password; other devices are logged out and this one gets a fresh token. */
      async changePassword(currentPassword, newPassword) {
        const { data } = await API.post('/auth/password', { currentPassword, newPassword });
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
