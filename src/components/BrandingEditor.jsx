import { useRef, useState } from 'react';
import { Box, Button, Stack, TextField, Typography, Alert } from '@mui/material';
import api from '../api';
import { schoolLogoUrl } from '../branding';

/**
 * Logo and theme colour for one school. Used by the school administrator for
 * their own school and by the platform administrator for any school.
 */
export default function BrandingEditor({ school, onSaved, compact }) {
  const [colour, setColour] = useState(school.crest_colour || '#C9A227');
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const inputRef = useRef(null);

  const current = school.has_logo || school.logo_updated_at
    ? schoolLogoUrl(school.id, school.logo_updated_at) : null;

  function choose(f) {
    setError(''); setOk('');
    if (!f) return;
    if (f.size > 512 * 1024) { setError(`That image is ${Math.round(f.size / 1024)}KB. Please use one under 512KB.`); return; }
    setFile(f);
    const fr = new FileReader();
    fr.onload = () => setPreview(String(fr.result));
    fr.readAsDataURL(f);
  }

  async function save() {
    setBusy(true); setError(''); setOk('');
    try {
      const body = { crest_colour: colour };
      if (preview) body.logo = preview;
      const { data } = await api.put(`/schools/${school.id}/branding`, body);
      setOk('Branding updated'); setFile(null); setPreview(null);
      if (inputRef.current) inputRef.current.value = '';
      onSaved?.(data);
    } catch (e) { setError(e.response?.data?.error || 'Could not save branding'); }
    finally { setBusy(false); }
  }

  async function removeLogo() {
    setBusy(true); setError(''); setOk('');
    try {
      const { data } = await api.put(`/schools/${school.id}/branding`, { remove_logo: true });
      setOk('Logo removed'); setPreview(null); setFile(null);
      onSaved?.(data);
    } catch (e) { setError(e.response?.data?.error || 'Could not remove the logo'); }
    finally { setBusy(false); }
  }

  const shown = preview || current;
  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError('')}>{error}</Alert>}
      {ok && <Alert severity="success" sx={{ mb: 1.5 }} onClose={() => setOk('')}>{ok}</Alert>}
      <Stack direction={compact ? 'column' : 'row'} spacing={2} alignItems={compact ? 'stretch' : 'center'}>
        <Box sx={{ width: 88, height: 88, flexShrink: 0, borderRadius: '12px',
                   border: '1px dashed', borderColor: 'divider', display: 'flex',
                   alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                   bgcolor: shown ? 'background.paper' : (colour || 'primary.main') }}>
          {shown
            ? <Box component="img" src={shown} alt="" sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            : <Typography sx={{ color: '#fff', fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700 }}>
                {school.code}
              </Typography>}
        </Box>
        <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            <Button size="small" component="label" disabled={busy}>
              {shown ? 'Replace logo' : 'Upload logo'}
              <input ref={inputRef} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                onChange={(e) => choose(e.target.files?.[0])} />
            </Button>
            {current && <Button size="small" color="error" onClick={removeLogo} disabled={busy}>Remove</Button>}
          </Stack>
          <Typography variant="caption" color="text.secondary">
            <strong>PNG with a transparent background is recommended</strong> — roughly square,
            512×512 or larger, under 512KB. JPEG, WEBP, GIF and SVG are also accepted and are
            converted automatically for PDFs. Used on the sidebar, page headers, the merit list,
            report cards and as the watermark on exported documents.
            {file ? ` Selected: ${file.name}` : ''}
          </Typography>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <TextField size="small" label="Theme colour" value={colour} sx={{ width: 160 }}
              onChange={(e) => setColour(e.target.value)} placeholder="#C9A227" />
            <input type="color" aria-label="Pick theme colour"
              value={/^#[0-9a-fA-F]{6}$/.test(colour) ? colour : '#C9A227'}
              onChange={(e) => setColour(e.target.value)}
              style={{ width: 44, height: 38, border: 'none', background: 'none', cursor: 'pointer' }} />
            <Button variant="contained" size="small" onClick={save} disabled={busy}>
              {busy ? 'Saving…' : 'Save branding'}
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}
