import { useRef, useState } from 'react';
import { Box, Button, Stack, Typography, Alert, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import api from '../api';
import { useAuthedImage, teacherSignatureUrl } from '../branding';

const MAX_BYTES = 256 * 1024;

/**
 * A teacher's signature, printed beside their remark on every report card.
 *
 * A scan or photo of a signature on white paper works; the card sizes it to
 * a 70×20pt strip. Without one, the card prints a ruled line to sign by hand,
 * so this is a convenience rather than a requirement.
 */
export default function SignatureUpload({ teacher, onChange }) {
  const fileRef = useRef(null);
  const [version, setVersion] = useState(teacher.signature_updated_at || null);
  const [has, setHas] = useState(Boolean(teacher.has_signature ?? teacher.signature_updated_at));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const src = useAuthedImage(has ? teacherSignatureUrl(teacher.id, version) : null);

  async function send(body, after) {
    setBusy(true);
    setError('');
    try {
      const { data } = await api.put(`/teachers/${teacher.id}/signature`, body);
      after(data);
      onChange?.(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not save that signature');
    } finally { setBusy(false); }
  }

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError(`That image is ${Math.round(file.size / 1024)}KB. Please use one under ${MAX_BYTES / 1024}KB.`);
      return;
    }
    const dataUrl = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(new Error('Could not read that file'));
      r.readAsDataURL(file);
    }).catch((err) => { setError(err.message); return null; });
    if (!dataUrl) return;
    await send({ signature: dataUrl }, (d) => { setHas(true); setVersion(d.signature_updated_at); });
  }

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{
          width: 160, height: 52, flexShrink: 0, border: '1px dashed', borderColor: 'divider',
          borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: 'report.mist', overflow: 'hidden',
        }}>
          {src
            ? <Box component="img" src={src} alt="" sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            : <Typography variant="caption" color="text.secondary">No signature</Typography>}
        </Box>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" disabled={busy} onClick={() => fileRef.current?.click()}>
            {has ? 'Replace' : 'Upload signature'}
          </Button>
          {has && (
            <Button size="small" color="error" disabled={busy}
              onClick={() => send({ remove_signature: true }, () => { setHas(false); setVersion(null); })}>
              Remove
            </Button>
          )}
        </Stack>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        A scan or photo on white paper, wider than it is tall. PNG or JPEG, under {MAX_BYTES / 1024}KB.
      </Typography>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} />
      {error && <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>}
    </Box>
  );
}

/** The same control in a dialog, for a list where each row opens its own. */
export function SignatureDialog({ teacher, onClose }) {
  return (
    <Dialog open={!!teacher} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Signature — {teacher?.full_name}</DialogTitle>
      <DialogContent dividers>
        {teacher && <SignatureUpload teacher={teacher} />}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Done</Button></DialogActions>
    </Dialog>
  );
}
