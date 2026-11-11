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
  pilgrimage: null,
  public: null,
  corporate: null,
  together: null,
};

export const isVideo = (src) => /\.(mp4|webm)$/i.test(src || '');
