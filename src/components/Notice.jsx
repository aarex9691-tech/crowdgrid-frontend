import { CircleAlert, CircleCheck, Info } from 'lucide-react';

const STYLES = {
  error: { cls: 'border-kumkum bg-kumkum-wash', tint: 'text-kumkum', icon: CircleAlert },
  success: { cls: 'border-leaf bg-tulsi-wash', tint: 'text-tulsi', icon: CircleCheck },
  info: { cls: 'border-blue bg-blue-wash', tint: 'text-blue', icon: Info },
  warning: { cls: 'border-marigold bg-marigold-wash', tint: 'text-marigold-deep', icon: CircleAlert },
};

/** A message in the page: a coloured rule and icon say what kind, the text stays dark and readable. */
export default function Notice({ tone = 'info', children, className = '' }) {
  if (!children) return null;
  const s = STYLES[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2.5 rounded-xl border-l-4 px-4 py-3 font-medium text-ink ${s.cls} ${className}`}>
      <s.icon size={20} className={`mt-0.5 shrink-0 ${s.tint}`} aria-hidden />
      <div className="min-w-0">{children}</div>
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
