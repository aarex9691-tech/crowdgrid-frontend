import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/** Password input with an eye button that shows or hides what was typed. */
export default function PasswordField({ id, label = 'Password', value, onChange, autoComplete = 'current-password', minLength, hint }) {
  const [shown, setShown] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={shown ? 'text' : 'password'}
          className="field pr-14"
          autoComplete={autoComplete}
          minLength={minLength}
          value={value}
          onChange={onChange}
          required
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-ink-soft hover:text-ink"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? 'Hide password' : 'Show password'}
          aria-pressed={shown}
          title={shown ? 'Hide password' : 'Show password'}
        >
          {shown ? <EyeOff size={20} aria-hidden /> : <Eye size={20} aria-hidden />}
        </button>
      </div>
      {hint && <p className="mt-1 text-sm text-ink-soft">{hint}</p>}
    </div>
  );
}
