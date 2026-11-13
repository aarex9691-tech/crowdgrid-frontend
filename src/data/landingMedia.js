/**
 * Photo and video slots for the home page and the log-in / sign-up pages.
 * The *-hq.webp photos are the original hero photos upscaled to 1600px wide (Lanczos, light
 * de-blocking and sharpening). They have no depth maps, so they show as plain photos.
 * The alternative set (hero-*.webp with hero-*-depth.webp) still sits in public/media: to use it,
 * point src at it and add depth: '/media/hero-<kind>-depth.webp' to turn the 3D effect back on.
 * ratio: width / height of the photo file.
 * focus: [x, y] from 0 to 1, the part of the photo that must stay in view when it is cropped.
 */
export const LANDING_MEDIA = {
  pilgrimage: { src: '/media/hero-pilgrimage-hq.webp', ratio: 1600 / 1172, focus: [0.62, 0.42], strength: 0.024 },
  public: { src: '/media/hero-public-hq.webp', ratio: 1600 / 896, focus: [0.4, 0.45], strength: 0.016 },
  corporate: { src: '/media/hero-corporate-hq.webp', ratio: 1, focus: [0.6, 0.32], strength: 0.016 },
  together: '/media/together.webp',
};

/** CSS object-position for a slot's focus point. */
export const focusPosition = (entry) => (entry?.focus ? `${entry.focus[0] * 100}% ${entry.focus[1] * 100}%` : '50% 50%');

export const isVideo = (src) => /\.(mp4|webm)$/i.test(src || '');
