/**
 * Turns a picked photo into a small square JPEG in the browser: centre-cropped and
 * scaled to `size` px, so uploads are a few dozen KB even from a 12 MP phone camera.
 * Returns { blob, url } where url is a preview link (call URL.revokeObjectURL when done).
 */
export async function squarePhoto(file, size = 256) {
  if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Choose a JPEG, PNG or WEBP photo');
  if (file.size > 15 * 1024 * 1024) throw new Error('That photo is too large. Choose one under 15 MB.');
  const src = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Could not open that photo. Try another one.'));
      i.src = src; // browsers apply the camera's rotation (EXIF) when drawing an <img>
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - side) / 2;
    const sy = (img.naturalHeight - side) / 2.6; // a little above centre: faces sit in the upper half
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; // transparent PNGs get a white background, not black
    ctx.fillRect(0, 0, size, size);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, Math.max(0, sy), side, side, 0, 0, size, size);
    const blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not prepare that photo. Try another one.'))), 'image/jpeg', 0.86)
    );
    return { blob, url: URL.createObjectURL(blob) };
  } finally {
    URL.revokeObjectURL(src);
  }
}
