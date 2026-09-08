import { useRef, useState } from 'react';
import { Box, Button, Stack, Typography, Alert } from '@mui/material';
import api from '../api';
import { useAuthedImage, studentPhotoUrl } from '../branding';

const MAX_BYTES = 512 * 1024;

/**
 * The learner's passport photo, as it appears on their report card.
 *
 * Read as a data URL and sent as JSON rather than multipart: the API stores
 * these in a base64 column, so a form upload would only be decoded and
 * re-encoded on the way through.
 */
export default function PhotoUpload({ student, onChange, size = 96 }) {
  const fileRef = useRef(null);
  const [version, setVersion] = useState(student.photo_updated_at || null);
  const [has, setHas] = useState(Boolean(student.has_photo));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const src = useAuthedImage(has ? studentPhotoUrl(student.id, version) : null);
  const initials = `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.toUpperCase();

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';                       // so the same file can be re-picked
    if (!file) return;
    setError('');
    if (file.size > MAX_BYTES) {
      setError(`That image is ${Math.round(file.size / 1024)}KB. Please use one under ${MAX_BYTES / 1024}KB.`);
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = () => reject(new Error('Could not read that file'));
        r.readAsDataURL(file);
      });
      const { data } = await api.put(`/students/${student.id}/photo`, { photo: dataUrl });
      setHas(true);
      setVersion(data.photo_updated_at);
      onChange?.(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Could not save that photo');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError('');
    try {
      const { data } = await api.put(`/students/${student.id}/photo`, { remove_photo: true });
      setHas(false);
      setVersion(null);
      onChange?.(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not remove that photo');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{
          width: size, height: size, flexShrink: 0, borderRadius: 1, overflow: 'hidden',
          border: '1px solid', borderColor: 'divider', bgcolor: 'report.mist',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {src
            ? <Box component="img" src={src} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <Typography sx={{ fontSize: size * 0.3, fontWeight: 600, color: 'primary.main' }}>{initials || '—'}</Typography>}
        </Box>
        <Box>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" disabled={busy} onClick={() => fileRef.current?.click()}>
              {has ? 'Replace photo' : 'Add photo'}
            </Button>
            {has && <Button size="small" color="error" disabled={busy} onClick={remove}>Remove</Button>}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
            A square passport photo reads best. PNG or JPEG, under {MAX_BYTES / 1024}KB.
          </Typography>
        </Box>
      </Stack>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} />
      {error && <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>}
    </Box>
  );
}
