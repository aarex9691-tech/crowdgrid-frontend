import { CircleAlert, CircleCheck, Info } from 'lucide-react';

const STYLES = {
  error: { cls: 'border-kumkum/30 bg-kumkum-wash text-kumkum', icon: CircleAlert },
  success: { cls: 'border-tulsi/30 bg-tulsi-wash text-tulsi', icon: CircleCheck },
  info: { cls: 'border-line bg-white text-ink-soft', icon: Info },
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

export function Loading({ label = 'Loading' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-ink-soft" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-ink" aria-hidden />
      {label}
    </div>
  );
}
