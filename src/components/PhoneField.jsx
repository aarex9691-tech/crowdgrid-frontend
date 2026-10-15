import { useState } from 'react';
import { COUNTRIES, countryFor } from '../lib/phone';
import { optionalPhoneError } from '../lib/validate';

/**
 * Country code + mobile number. Only digits can be typed and the number stops at
 * the country's length; a live digit count and the country's rule are shown.
 * `required={false}` makes it optional (empty is fine, anything typed must be valid).
 */
export default function PhoneField({
  id = 'phone', countryCode, phone, onChange, touched: touchedProp, onBlur, label = 'Mobile number',
  required = true, showErrors = false, hint, className = '',
}) {
  const [touchedSelf, setTouched] = useState(false);
  const c = countryFor(countryCode);
  const digits = String(phone || '').replace(/\D/g, '');
  const err = optionalPhoneError(countryCode, phone, { required });
  const show = err && (touchedProp || touchedSelf || showErrors);
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}{!required && <span className="font-normal text-ink-soft"> (optional)</span>}
      </label>
      <div className="flex gap-2">
        <label htmlFor={`${id}-cc`} className="sr-only">Country code</label>
        <select
          id={`${id}-cc`}
          className="field w-28 shrink-0 px-2 sm:w-36"
          value={countryCode}
          onChange={(e) => onChange({ countryCode: e.target.value, phone: digits.slice(0, countryFor(e.target.value).max) })}
        >
          {COUNTRIES.map((x) => (
            <option key={x.code} value={x.code}>+{x.code} {x.name}</option>
          ))}
        </select>
        <input
          id={id}
          type="tel"
          className={`field tabular-nums ${show ? 'border-kumkum' : ''}`}
          inputMode="numeric"
          autoComplete="tel-national"
          pattern="[0-9]*"
          maxLength={c.max}
          placeholder={`${c.min === c.max ? c.min : `${c.min}-${c.max}`}-digit mobile number`}
          value={digits}
          onChange={(e) => onChange({ countryCode, phone: e.target.value.replace(/\D/g, '').slice(0, c.max) })}
          onBlur={() => { setTouched(true); onBlur?.(); }}
          aria-invalid={show ? 'true' : 'false'}
          aria-describedby={`${id}-help`}
          required={required}
        />
      </div>
      <p id={`${id}-help`} className={`mt-1 flex justify-between gap-3 text-sm ${show ? 'font-semibold text-kumkum' : 'text-ink-soft'}`} role={show ? 'alert' : undefined}>
        {show ? <span>{err}</span> : (
          <>
            <span>{hint || (c.pattern ? 'Starts with 6, 7, 8 or 9' : '')}</span>
            <span className="tabular-nums">{digits.length}/{c.max}</span>
          </>
        )}
      </p>
    </div>
  );
}
