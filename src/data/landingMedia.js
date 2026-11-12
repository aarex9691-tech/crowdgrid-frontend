/**
 * Photo and video slots for the home page.
 */
export const LANDING_MEDIA = {
  pilgrimage: { src: '/media/hero-pilgrimage.jpg', focus: [0.5, 0.5], strength: 0.024 },
  public: { src: '/media/hero-public.jpg', focus: [0.5, 0.5], strength: 0.016 },
  corporate: { src: '/media/hero-corporate.jpg', focus: [0.5, 0.5], strength: 0.016 },
  together: '/media/together.webp',
};

export const isVideo = (src) => /\.(mp4|webm)$/i.test(src || '');
