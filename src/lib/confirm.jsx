import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, LogOut } from 'lucide-react';

/**
 * App-wide confirmation dialog.
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: 'Log out?', confirmLabel: 'Log out' }))) return;
 *
 * Replaces window.confirm(): it matches the app's look, works the same on
 * phones, closes with Esc or a tap outside, and keeps keyboard focus inside.
 */
const ConfirmContext = createContext(null);

const ICONS = { logout: LogOut, danger: AlertTriangle };

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null); // { title, message, confirmLabel, cancelLabel, tone, icon, resolve }
  const cancelRef = useRef(null);
  const confirmRef = useRef(null);
  const lastFocus = useRef(null);

  const confirm = useCallback((opts = {}) => new Promise((resolve) => {
    lastFocus.current = document.activeElement;
    setDialog({ cancelLabel: 'Cancel', confirmLabel: 'Confirm', tone: 'default', ...opts, resolve });
  }), []);

  const close = useCallback((result) => {
    setDialog((d) => {
      d?.resolve(result);
      return null;
    });
    // Give focus back to whatever opened the dialog
    setTimeout(() => lastFocus.current?.focus?.(), 0);
  }, []);

  useEffect(() => {
    if (!dialog) return undefined;
    cancelRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') close(false);
      if (e.key === 'Tab') {
        // Keep focus on the two buttons
        const order = [cancelRef.current, confirmRef.current];
        const i = order.indexOf(document.activeElement);
        e.preventDefault();
        order[(i + (e.shiftKey ? order.length - 1 : 1)) % order.length]?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [dialog, close]);

  const Icon = dialog ? ICONS[dialog.icon] || (dialog.tone === 'danger' ? AlertTriangle : null) : null;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 p-4 sm:items-center"
          onMouseDown={(e) => e.target === e.currentTarget && close(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby={dialog.message ? 'confirm-message' : undefined}
            className="panel w-full max-w-sm p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              {Icon && (
                <span className={`flex h-11 w-11 flex-none items-center justify-center rounded-full ${dialog.tone === 'danger' ? 'bg-kumkum-wash text-kumkum' : 'bg-marigold-wash text-marigold-deep'}`}>
                  <Icon size={22} aria-hidden />
                </span>
              )}
              <div className="min-w-0">
                <h2 id="confirm-title" className="text-xl font-bold text-ink">{dialog.title}</h2>
                {dialog.message && <p id="confirm-message" className="mt-1 text-ink-soft">{dialog.message}</p>}
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button ref={cancelRef} type="button" className="btn-ghost" onClick={() => close(false)}>
                {dialog.cancelLabel}
              </button>
              <button ref={confirmRef} type="button" className={dialog.tone === 'danger' ? 'btn-sos' : 'btn-ink'} onClick={() => close(true)}>
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return ctx;
}
