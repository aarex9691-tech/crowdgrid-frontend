/**
 * Photo and video slots for the home page and the log-in / sign-up pages.
 * src: the 1600px photo; small: the same photo 800px wide, for phones (srcset picks one).
 * ratio: width / height of the photo file.
 * focus: [x, y] from 0 to 1, the part of the photo that must stay in view when it is cropped.
 */
export const LANDING_MEDIA = {
  pilgrimage: { src: '/media/hero-pilgrimage-hq.webp', small: '/media/hero-pilgrimage-800.webp', ratio: 1600 / 1172, focus: [0.62, 0.42], strength: 0.024 },
  public: { src: '/media/hero-public-hq.webp', small: '/media/hero-public-800.webp', ratio: 1600 / 896, focus: [0.4, 0.45], strength: 0.016 },
  corporate: { src: '/media/hero-corporate-hq.webp', small: '/media/hero-corporate-800.webp', ratio: 1, focus: [0.6, 0.32], strength: 0.016 },
  together: '/media/together.webp',
};

/** CSS object-position for a slot's focus point. */
export const focusPosition = (entry) => (entry?.focus ? `${entry.focus[0] * 100}% ${entry.focus[1] * 100}%` : '50% 50%');

/** srcset for a slot: phones download the 800px copy, large screens the 1600px one. */
export const srcSetOf = (entry) => (entry?.small ? `${entry.small} 800w, ${entry.src} 1600w` : undefined);
