/**
 * Photo and video slots for the home page.
 *
 * Each slot is null for now, so the page shows its drawn illustration instead.
 * To use a generated photo or clip (for example from Higgsfield), put the file in
 * public/media/ and set the path here, e.g. pilgrimage: '/media/hero-pilgrimage.webp'.
 * Videos (.mp4 / .webm) play muted and looped; the illustration stays as the fallback.
 *
 * Suggested prompts, so all three panels feel like one set:
 *  - pilgrimage: dawn at a stone river ghat in India, families in saffron and white,
 *    marigold garlands, calm and orderly crowd, soft warm light, documentary photo, no text
 *  - public: open-air evening concert in an Indian city square, mixed crowd of all ages,
 *    string lights, blue dusk sky, documentary photo, no text
 *  - corporate: bright modern conference hall in India, speakers on stage, attendees
 *    with lanyard badges, green plants, natural light, documentary photo, no text
 *  - together: aerial view of a well-managed crowd moving through marked lanes, no text
 */
export const LANDING_MEDIA = {
  // Panels take { src, depth, focus }: depth (white = near) makes the photo 3D under the mouse,
  // focus [x, y] keeps that part of the photo in view when the tall panel crops it.
  pilgrimage: { src: '/media/hero-pilgrimage.webp', depth: '/media/hero-pilgrimage-depth.webp', focus: [0.46, 0.5], strength: 0.024 },
  public: { src: '/media/hero-public.webp', depth: '/media/hero-public-depth.webp', focus: [0.5, 0.5], strength: 0.016 },
  corporate: { src: '/media/hero-corporate.webp', depth: '/media/hero-corporate-depth.webp', focus: [0.5, 0.5], strength: 0.016 },
  together: '/media/together.webp',
};

export const isVideo = (src) => /\.(mp4|webm)$/i.test(src || '');
