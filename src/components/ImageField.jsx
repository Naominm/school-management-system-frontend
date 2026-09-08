import { useRef, useState } from 'react';
import { Box, Button, Stack, Typography, Alert } from '@mui/material';
import { useAuthedImage } from '../branding';

const MAX_BYTES = 512 * 1024;

/**
 * An image picked inside a record form, sent with the record rather than
 * separately — so a learner added with a photo is created complete, in one
 * save, instead of being created and then edited again to attach one.
 *
 * The value handed back is a `data:` URL; an empty string clears the image.
 * `currentUrl` is the image already on file, shown until a new one is picked.
 */
export default function ImageField({ label, value, currentUrl, onChange, size = 84 }) {
  const fileRef = useRef(null);
  const [error, setError] = useState('');
  const onFile = useAuthedImage(value === undefined || value === '' ? currentUrl : null);

  // A freshly picked file wins; then whatever is already on file.
  const shown = value || onFile;

  function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    if (file.size > MAX_BYTES) {
      setError(`That image is ${Math.round(file.size / 1024)}KB. Please use one under ${MAX_BYTES / 1024}KB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.onerror = () => setError('That file could not be read.');
    reader.readAsDataURL(file);
  }

  return (
    <Box sx={{ mt: 1.5, mb: 0.5 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.75 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{
          width: size, height: size, flexShrink: 0, borderRadius: 1, overflow: 'hidden',
          border: '1px dashed', borderColor: 'divider', bgcolor: 'report.mist',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {shown
            ? <Box component="img" src={shown} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <Typography variant="caption" color="text.secondary">None</Typography>}
        </Box>
        <Stack spacing={0.75} alignItems="flex-start">
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" onClick={() => fileRef.current?.click()}>
              {shown ? 'Replace' : 'Choose image'}
            </Button>
            {shown && <Button size="small" color="error" onClick={() => onChange('')}>Remove</Button>}
          </Stack>
          <Typography variant="caption" color="text.secondary">
            A square passport photo reads best. Under {MAX_BYTES / 1024}KB.
          </Typography>
        </Stack>
      </Stack>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} />
      {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
    </Box>
  );
}
