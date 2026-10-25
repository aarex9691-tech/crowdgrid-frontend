import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './auth';

/**
 * Live updates. One WebSocket per tab, opened with the login token (or as a
 * visitor). The server only sends short "something changed" notices such as
 * { lodgingId } or { action: 'raised' }; screens then re-read their data
 * through the normal API, so permissions are checked exactly as before.
 *
 *   useLive(['beds', 'meals'], () => reload());   // re-run on any of these events
 *   const { connected } = useRealtime();
 */
const RealtimeContext = createContext({ socket: null, connected: false });

export function RealtimeProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState({ socket: null, connected: false });
  const userKey = user ? `${user._id}:${user.role}` : 'visitor';

  useEffect(() => {
    // Same origin: Vite (dev) and the production server both forward /socket.io to the API
    const socket = io(
      (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '') || window.location.origin,
      {
        path: '/socket.io',
        auth: (cb) => cb({ token: localStorage.getItem('cg_token') || undefined }),
        transports: ['websocket', 'polling'],
        reconnectionDelayMax: 10000,
      }
    );
    const up = () => setState({ socket, connected: true });
    const down = () => setState({ socket, connected: false });
    socket.on('connect', up);
    socket.on('disconnect', down);
    socket.on('connect_error', down);
    return () => {
      socket.off();
      socket.close();
    };
  }, [userKey]); // reconnect with the new token after login / logout

  return <RealtimeContext.Provider value={state}>{children}</RealtimeContext.Provider>;
}

export const useRealtime = () => useContext(RealtimeContext);

/**
 * Calls `handler(payload, eventName)` whenever one of `events` arrives.
 * Bursts are merged: at most one call per `wait` ms (default 5 s), so twenty
 * scans in a second cause one reload, not twenty, and screens stay calm.
 */
export function useLive(events, handler, { wait = 5000, enabled = true } = {}) {
  const { socket } = useRealtime();
  const saved = useRef(handler);
  useEffect(() => {
    saved.current = handler;
  });
  const key = [].concat(events).join('|');
  useEffect(() => {
    if (!socket || !enabled) return undefined;
    let timer = null;
    let last = null;
    const fire = (name) => (payload) => {
      last = [payload, name];
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        saved.current(...last);
      }, wait);
    };
    const names = key.split('|');
    const listeners = names.map((n) => [n, fire(n)]);
    listeners.forEach(([n, fn]) => socket.on(n, fn));
    return () => {
      clearTimeout(timer);
      listeners.forEach(([n, fn]) => socket.off(n, fn));
    };
  }, [socket, key, wait, enabled]);
}

/** Follow one camp's tent map (staff only; the server ignores others). */
export function useWatchLodging(lodgingId) {
  const { socket, connected } = useRealtime();
  useEffect(() => {
    if (!socket || !connected || !lodgingId) return undefined;
    socket.emit('watch:lodging', lodgingId);
    return () => socket.emit('unwatch:lodging', lodgingId);
  }, [socket, connected, lodgingId]);
}

/** Small "Live" dot for headers of screens that update by themselves. */
export function LiveBadge({ className = '' }) {
  const { connected } = useRealtime();
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${connected ? 'bg-tulsi-wash text-tulsi' : 'bg-mist text-ink-soft'} ${className}`} title={connected ? 'Updates appear here instantly' : 'Reconnecting… numbers refresh when you reload'}>
      <span className={`h-2 w-2 rounded-full ${connected ? 'animate-pulse bg-tulsi' : 'bg-ink-faint'}`} aria-hidden />
      {connected ? 'Live' : 'Offline'}
    </span>
  );
}
