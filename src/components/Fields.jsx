import { useState } from 'react';
import { cleanText, intError, LIMITS, pinError, textError } from '../lib/validate';

/**
 * Form fields with the same rules as the server:
 *   TextField   - strips characters the field never accepts, live character counter
 *   NumberField - digits only (no e, +, -, decimals), min/max shown as you type
 *   PinField    - Indian 6-digit PIN code
 * Errors appear after leaving the field, or for every field once `showErrors` is set
 * (the parent sets it when the user presses submit).
 */

function Help({ id, error, show, children }) {
  const visible = show && error;
  return (
    <p id={id} className={`mt-1 flex justify-between gap-3 text-sm ${visible ? 'font-semibold text-kumkum' : 'text-ink-soft'}`} role={visible ? 'alert' : undefined}>
      {visible ? <span>{error}</span> : children}
    </p>
  );
}

function useTouched() {
  const [touched, setTouched] = useState(false);
  return [touched, () => setTouched(true)];
}

export function TextField({
  id, label, value, onChange, rule, required = false, showErrors = false, placeholder, hint,
  multiline = false, rows = 3, autoComplete, className = '', optionalLabel = true,
}) {
  const r = typeof rule === 'string' ? LIMITS[rule] : rule;
  const [touched, touch] = useTouched();
  const error = textError(value, label, r, { required });
  const show = touched || showErrors;
  const len = String(value ?? '').length;
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <div className={className}>
      <label className="field-label" htmlFor={id}>
        {label}{!required && optionalLabel && <span className="font-normal text-ink-soft"> (optional)</span>}
      </label>
      <Tag
        id={id}
        className={`field ${multiline ? 'py-3' : ''} ${show && error ? 'border-kumkum' : ''}`}
        rows={multiline ? rows : undefined}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={r.max}
        onChange={(e) => onChange(cleanText(e.target.value, r))}
        onBlur={(e) => { touch(); const t = e.target.value.trim(); if (t !== e.target.value) onChange(t); }}
        aria-invalid={show && error ? 'true' : 'false'}
        aria-describedby={`${id}-help`}
        required={required}
      />
      <Help id={`${id}-help`} error={error} show={show}>
        <span>{hint || ''}</span>
        <span className={`tabular-nums ${len >= r.max ? 'font-semibold text-marigold-deep' : ''}`}>{len}/{r.max}</span>
      </Help>
    </div>
  );
}

export function NumberField({
  id, label, value, onChange, min = 0, max, required = false, showErrors = false, prefix, hint, allowNegative = false, className = '', optionalLabel = true,
}) {
  const [touched, touch] = useTouched();
  const error = intError(value, label, { min, max, required });
  const show = touched || showErrors;
  const maxDigits = String(Math.max(Math.abs(min), Math.abs(max))).length;
  const clean = (raw) => {
    const neg = allowNegative && raw.trim().startsWith('-');
    const d = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, maxDigits);
    return neg ? `-${d}` : d;
  };
  return (
    <div className={className}>
      <label className="field-label" htmlFor={id}>
        {label}{!required && optionalLabel && <span className="font-normal text-ink-soft"> (optional)</span>}
      </label>
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-ink-soft">{prefix}</span>}
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern={allowNegative ? '-?[0-9]*' : '[0-9]*'}
          className={`field tabular-nums ${prefix ? 'pl-9' : ''} ${show && error ? 'border-kumkum' : ''}`}
          value={value}
          onChange={(e) => onChange(clean(e.target.value))}
          onKeyDown={(e) => {
            // Arrow keys step the value like a normal number box
            if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
            e.preventDefault();
            const n = Number(value || 0) + (e.key === 'ArrowUp' ? 1 : -1);
            onChange(String(Math.min(max, Math.max(min, n))));
          }}
          onBlur={touch}
          aria-invalid={show && error ? 'true' : 'false'}
          aria-describedby={`${id}-help`}
          required={required}
        />
      </div>
      <Help id={`${id}-help`} error={error} show={show}>
        <span>{hint || `${min.toLocaleString('en-IN')} to ${max.toLocaleString('en-IN')}`}</span>
      </Help>
    </div>
  );
}

export function PinField({ id, label = 'PIN code', value, onChange, required = false, showErrors = false, className = '' }) {
  const [touched, touch] = useTouched();
  const error = pinError(value, { required });
  const show = touched || showErrors;
  return (
    <div className={className}>
      <label className="field-label" htmlFor={id}>
        {label}{!required && <span className="font-normal text-ink-soft"> (optional)</span>}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="postal-code"
        pattern="[0-9]*"
        className={`field tabular-nums tracking-widest ${show && error ? 'border-kumkum' : ''}`}
        placeholder="e.g. 422001"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        onBlur={touch}
        aria-invalid={show && error ? 'true' : 'false'}
        aria-describedby={`${id}-help`}
      />
      <Help id={`${id}-help`} error={error} show={show}>
        <span>6 digits</span>
        <span className="tabular-nums">{String(value || '').length}/6</span>
      </Help>
    </div>
  );
}
