import { useState } from 'react';
import { assetUrl } from '../lib/api';

const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

/**
 * A person's profile photo, or their initials when there is none (or it fails to load).
 * `size` is in px. Decorative by default: the name is always written next to it.
 */
export default function Avatar({ name, photoUrl, size = 40, className = '', alt = '' }) {
  const [broken, setBroken] = useState('');
  const src = photoUrl && broken !== photoUrl ? assetUrl(photoUrl) : '';
  const box = { width: size, height: size, fontSize: Math.round(size * 0.38) };
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        style={box}
        className={`flex-none rounded-full object-cover ring-2 ring-white ${className}`}
        onError={() => setBroken(photoUrl)}
      />
    );
  }
  return (
    <span style={box} className={`flex flex-none items-center justify-center rounded-full bg-ink font-display text-marigold ${className}`} aria-hidden={alt ? undefined : true} role={alt ? 'img' : undefined} aria-label={alt || undefined}>
      {initials(name)}
    </span>
  );
}
