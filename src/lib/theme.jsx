import { useCallback, useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

/*
 * Light and dark mode.
 * index.html sets <html data-theme> before the first paint. Until someone taps the
 * sun / moon button the site follows the device setting, live; after a tap the choice is
 * kept on this device (localStorage 'cg-theme') and wins over the device setting.
 */
const KEY = 'cg-theme';
const media = () => window.matchMedia('(prefers-color-scheme: dark)');

function readSaved() {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

function apply(theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  // browser bar colour on phones follows the page
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0a0d0e' : '#1F3F8F');
  window.dispatchEvent(new CustomEvent('cg-theme', { detail: theme }));
}

const current = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

export function useTheme() {
  const [theme, setTheme] = useState(current);

  useEffect(() => {
    const onChange = (e) => setTheme(e.detail);
    window.addEventListener('cg-theme', onChange);
    // follow the device while nobody has picked a mode on this device
    const mq = media();
    const onSystem = () => { if (!readSaved()) apply(mq.matches ? 'dark' : 'light'); };
    mq.addEventListener('change', onSystem);
    return () => {
      window.removeEventListener('cg-theme', onChange);
      mq.removeEventListener('change', onSystem);
    };
  }, []);

  const toggle = useCallback(() => {
    const next = current() === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(KEY, next); } catch { /* private mode: still switches for this visit */ }
    apply(next);
  }, []);

  return { theme, toggle };
}

/** Sun / moon button. Shows the mode you will switch to. */
export function ThemeToggle({ className = '', withLabel = false }) {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-pressed={dark}
      title={label}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border border-line bg-mist/80 px-3 text-ink transition-colors hover:border-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-blue ${className}`}
    >
      {dark ? <Sun size={19} aria-hidden /> : <Moon size={19} aria-hidden />}
      {withLabel && <span className="font-semibold">{dark ? 'Light mode' : 'Dark mode'}</span>}
    </button>
  );
}
