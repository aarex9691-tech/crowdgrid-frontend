import { useEffect, useRef, useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import API, { errorMessage } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useConfirm } from '../lib/confirm';
import { squarePhoto } from '../lib/squarePhoto';
import Avatar from './Avatar';

/**
 * Profile photo with add / change / remove. The picked photo is cropped square and
 * shrunk in the browser, shown as a preview, and uploaded only when "Save photo" is pressed.
 */
export default function ProfilePhoto() {
  const { user, refresh } = useAuth();
  const confirm = useConfirm();
  const input = useRef(null);
  const [preview, setPreview] = useState(null); // { blob, url }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => () => preview && URL.revokeObjectURL(preview.url), [preview]);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // picking the same file again still fires a change
    if (!file) return;
    setError('');
    setNote('');
    try {
      setPreview(await squarePhoto(file));
    } catch (err) {
      setError(err.message);
    }
  };

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const body = new FormData();
      body.append('photo', preview.blob, 'photo.jpg');
      await API.put('/auth/me/photo', body);
      await refresh();
      setPreview(null);
      setNote('Photo saved. Gate volunteers will see it when they scan your pass.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    const ok = await confirm({ title: 'Remove your photo?', message: 'Your initials will show instead.', confirmLabel: 'Remove photo', tone: 'danger' });
    if (!ok) return;
    setBusy(true);
    setError('');
    try {
      await API.delete('/auth/me/photo');
      await refresh();
      setNote('Photo removed.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-none flex-col items-center gap-2">
      <div className="relative">
        {preview ? (
          <img src={preview.url} alt="Preview of your new photo" width={88} height={88} className="h-[88px] w-[88px] rounded-full object-cover ring-4 ring-marigold" />
        ) : (
          <Avatar name={user.name} photoUrl={user.photoUrl} size={88} alt={user.photoUrl ? `Photo of ${user.name}` : ''} />
        )}
        {!preview && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-terracotta text-white shadow hover:bg-terracotta-dark"
            aria-label={user.photoUrl ? 'Change photo' : 'Add photo'}
            title={user.photoUrl ? 'Change photo' : 'Add photo'}
          >
            <Camera size={18} aria-hidden />
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-hidden onChange={pick} />

      {preview ? (
        <div className="flex gap-2">
          <button type="button" className="btn-primary min-h-10 px-3 text-sm" onClick={save} disabled={busy}>
            {busy ? 'Saving…' : 'Save photo'}
          </button>
          <button type="button" className="btn-ghost min-h-10 px-3 text-sm" onClick={() => setPreview(null)} disabled={busy}>
            Cancel
          </button>
        </div>
      ) : user.photoUrl ? (
        <button type="button" className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-ink-soft hover:text-kumkum" onClick={remove} disabled={busy}>
          <Trash2 size={15} aria-hidden /> Remove
        </button>
      ) : (
        <button type="button" className="min-h-10 text-sm font-semibold text-terracotta-dark hover:underline" onClick={() => input.current?.click()} disabled={busy}>
          Add photo
        </button>
      )}
      {error && <p className="max-w-56 text-center text-sm font-semibold text-kumkum" role="alert">{error}</p>}
      {note && <p className="max-w-56 text-center text-sm text-tulsi" role="status">{note}</p>}
    </div>
  );
}
