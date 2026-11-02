import { MAX_PER_ACCOUNT } from '../lib/limits';

/** − n + control for how many people a booking covers (1..5 per account). */
export default function PeopleStepper({ id, label = 'People', value, onChange, max = MAX_PER_ACCOUNT, hint }) {
  const top = Math.max(1, Math.min(max, MAX_PER_ACCOUNT));
  return (
    <div>
      <span id={`${id}-label`} className="field-label">{label}</span>
      <div className="flex items-center gap-2" role="group" aria-labelledby={`${id}-label`}>
        <button type="button" className="btn-ghost h-11 w-11 px-0 text-xl" aria-label="Fewer people" disabled={value <= 1} onClick={() => onChange(value - 1)}>−</button>
        <span className="w-8 text-center text-xl font-bold tabular-nums" aria-live="polite">{value}</span>
        <button type="button" className="btn-ghost h-11 w-11 px-0 text-xl" aria-label="More people" disabled={value >= top} onClick={() => onChange(value + 1)}>+</button>
      </div>
      <p className="mt-1 text-sm text-ink-soft">{hint || `Up to ${MAX_PER_ACCOUNT} people per account`}</p>
    </div>
  );
}
