import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/** Draws the signed pass payload as a QR image on the device (works offline). */
export default function QrCode({ value, size = 220, label }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let alive = true;
    if (value) {
      QRCode.toDataURL(value, { width: size * 2, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1b2a4a', light: '#ffffff' } })
        .then((url) => alive && setSrc(url))
        .catch(() => alive && setSrc(null));
    }
    return () => {
      alive = false;
    };
  }, [value, size]);

  if (!value) return null;
  return src ? (
    <img src={src} width={size} height={size} alt={label || 'Pass QR code'} className="rounded-lg bg-white" />
  ) : (
    <div style={{ width: size, height: size }} className="animate-pulse rounded-lg bg-mist" />
  );
}
