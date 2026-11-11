import { CircleAlert, CircleCheck, Info } from 'lucide-react';

const STYLES = {
  error: { cls: 'border-kumkum/30 bg-kumkum-wash text-kumkum', icon: CircleAlert },
  success: { cls: 'border-tulsi/30 bg-tulsi-wash text-tulsi', icon: CircleCheck },
  info: { cls: 'border-line bg-white text-ink-soft', icon: Info },
  warning: { cls: 'border-marigold/40 bg-marigold-wash text-ink', icon: CircleAlert },
};

export default function Notice({ tone = 'info', children, className = '' }) {
  if (!children) return null;
  const s = STYLES[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-xl border px-4 py-3 font-medium ${s.cls} ${className}`}>
      <s.icon size={20} className="mt-0.5 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}

/**
 * Loading state. `variant="page"` draws grey blocks shaped like a page (title, cards, panel),
 * so a page that is still downloading already looks like itself instead of a spinner.
 */
export function Loading({ label = 'Loading', variant }) {
  if (variant === 'page') {
    return (
      <div className="shell space-y-6 py-6" role="status" aria-live="polite">
        <span className="sr-only">{label}</span>
        <div className="space-y-2 border-b border-line pb-5" aria-hidden>
          <div className="cg-skel h-3 w-24" />
          <div className="cg-skel h-9 w-64 max-w-full" />
          <div className="cg-skel h-4 w-80 max-w-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3" aria-hidden>
          <div className="cg-skel h-24" />
          <div className="cg-skel h-24" />
          <div className="cg-skel h-24" />
        </div>
        <div className="cg-skel h-56" aria-hidden />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-ink-soft" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-ink" aria-hidden />
      {label}
    </div>
  );
}
