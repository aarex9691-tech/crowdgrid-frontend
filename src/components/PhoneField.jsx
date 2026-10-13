import { COUNTRIES, countryFor, phoneError } from '../lib/phone';

/**
 * Country code + mobile number. Shows a live digit count and an error as soon as
 * the number is too long or (after leaving the field) too short.
 */
export default function PhoneField({ id = 'phone', countryCode, phone, onChange, touched, onBlur, label = 'Mobile number' }) {
  const c = countryFor(countryCode);
  const digits = phone.replace(/\D/g, '');
  const err = phoneError(countryCode, phone);
  const tooLong = digits.length > c.max;
  const showErr = err && (touched || tooLong);
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <div className="flex gap-2">
        <label htmlFor={`${id}-cc`} className="sr-only">Country code</label>
        <select
          id={`${id}-cc`}
          className="field w-36 shrink-0"
          value={countryCode}
          onChange={(e) => onChange({ countryCode: e.target.value, phone })}
        >
          {COUNTRIES.map((x) => (
            <option key={x.code} value={x.code}>+{x.code} {x.name}</option>
          ))}
        </select>
        <input
          id={id}
          className={`field ${showErr ? 'border-kumkum' : ''}`}
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={`${c.min === c.max ? c.min : `${c.min}-${c.max}`}-digit mobile number`}
          value={phone}
          onChange={(e) => onChange({ countryCode, phone: e.target.value.slice(0, 20) })}
          onBlur={onBlur}
          aria-invalid={showErr ? 'true' : 'false'}
          aria-describedby={`${id}-help`}
          required
        />
      </div>
      <p id={`${id}-help`} className={`mt-1 text-sm ${showErr ? 'font-semibold text-kumkum' : 'text-ink-soft'}`} role={showErr ? 'alert' : undefined}>
        {showErr ? err : `${digits.length}/${c.max} digits`}
      </p>
    </div>
  );
}
