import { useRef, useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Alert, Table, TableHead, TableRow, TableCell, TableBody, Box, Chip } from '@mui/material';
import UploadIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import PhotoIcon from '@mui/icons-material/AddAPhoto';
import { exportCsv } from '../exportCsv';
import api from '../api';

const TEMPLATE_COLUMNS = [
  { key: 'admission_number', label: 'admission_number' },
  { key: 'first_name', label: 'first_name' },
  { key: 'last_name', label: 'last_name' },
  { key: 'class', label: 'class' },
  { key: 'parent_email', label: 'parent_email' },
  { key: 'gender', label: 'gender' },
  { key: 'date_of_birth', label: 'date_of_birth' },
  { key: 'address', label: 'address' },
  { key: 'emergency_contact', label: 'emergency_contact' },
  { key: 'emergency_phone', label: 'emergency_phone' },
];
const TEMPLATE_EXAMPLE = [{
  admission_number: 'ADM-100', first_name: 'Wanjiru', last_name: 'Kamau',
  class: 'Grade 4 Blue', parent_email: 'parent@example.com', gender: 'F',
  date_of_birth: '2015-03-14', address: 'Nairobi',
  emergency_contact: 'Jane Kamau', emergency_phone: '0712345678',
}];

/** '651.jpg' → '651'. The photographer names files after the admission number. */
const admissionFromFilename = (name) => String(name).replace(/\.[^.]+$/, '').trim();

const readAsDataUrl = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result));
  r.onerror = () => reject(new Error(`${file.name} could not be read`));
  r.readAsDataURL(file);
});

export default function ImportStudents({ onImported }) {
  const fileRef = useRef(null);
  const photoRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [photoResult, setPhotoResult] = useState(null);
  const [error, setError] = useState('');

  /**
   * Attach a folder of photographs in one go, matched to learners by the
   * admission number in each file name — which is how a school photographer
   * hands them over. Files are read here and sent as one request.
   */
  async function handlePhotos(e) {
    const files = [...(e.target.files || [])];
    e.target.value = '';
    if (!files.length) return;
    if (files.length > 200) {
      setError(`That is ${files.length} photos. Please import at most 200 at a time.`);
      return;
    }
    setBusy(true); setError('');
    try {
      const photos = [];
      const unreadable = [];
      for (const file of files) {
        try {
          photos.push({
            admission_number: admissionFromFilename(file.name),
            name: file.name,
            photo: await readAsDataUrl(file),
          });
        } catch { unreadable.push(file.name); }
      }
      const { data } = await api.post('/students/photos/import', { photos });
      setPhotoResult({ ...data, errors: [...(data.errors || []), ...unreadable.map((n) => ({ name: n, reason: 'unreadable file' }))] });
      onImported?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Photo import failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) {
      setError('Please choose a .csv file. In Excel: File → Save As → CSV (Comma delimited).');
      return;
    }
    setBusy(true); setError('');
    try {
      const csv = await file.text();
      const { data } = await api.post('/students/import', { csv });
      setResult(data);
      onImported?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Import failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="outlined" startIcon={<DownloadIcon />}
        onClick={() => exportCsv('students-template', TEMPLATE_COLUMNS, TEMPLATE_EXAMPLE)}>
        Template
      </Button>
      <Button variant="outlined" startIcon={<UploadIcon />} disabled={busy}
        onClick={() => fileRef.current?.click()}>
        {busy ? 'Importing…' : 'Import CSV'}
      </Button>
      <Button variant="outlined" startIcon={<PhotoIcon />} disabled={busy}
        onClick={() => photoRef.current?.click()}>
        Import photos
      </Button>
      <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={handleFile} />
      <input ref={photoRef} type="file" accept="image/*" multiple hidden onChange={handlePhotos} />

      <Dialog open={!!photoResult} onClose={() => setPhotoResult(null)} fullWidth maxWidth="sm">
        <DialogTitle>Photos attached</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip color="success" label={`${photoResult?.attached ?? 0} attached`} />
            {!!photoResult?.unmatched?.length
              && <Chip color="warning" label={`${photoResult.unmatched.length} no matching learner`} />}
            {!!photoResult?.errors?.length
              && <Chip color="error" label={`${photoResult.errors.length} rejected`} />}
          </Box>
          <Typography variant="body2" color="text.secondary">
            Photos are matched to learners by the admission number in the file name — a photo of
            learner 651 should be named <strong>651.jpg</strong>.
          </Typography>
          {!!photoResult?.unmatched?.length && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              No learner has these admission numbers: {photoResult.unmatched.join(', ')}
            </Alert>
          )}
          {!!photoResult?.errors?.length && (
            <Table size="small" sx={{ mt: 2 }}>
              <TableHead><TableRow><TableCell>File</TableCell><TableCell>Reason</TableCell></TableRow></TableHead>
              <TableBody>
                {photoResult.errors.map((x, i) => (
                  <TableRow key={i}><TableCell>{x.name}</TableCell><TableCell>{x.reason}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setPhotoResult(null)}>Close</Button></DialogActions>
      </Dialog>

      {error && (
        <Dialog open onClose={() => setError('')} fullWidth maxWidth="xs">
          <DialogContent><Alert severity="error">{error}</Alert></DialogContent>
          <DialogActions><Button onClick={() => setError('')}>Close</Button></DialogActions>
        </Dialog>
      )}

      <Dialog open={!!result} onClose={() => setResult(null)} fullWidth maxWidth="sm">
        <DialogTitle>Import complete</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: result?.errors?.length ? 2 : 0 }}>
            <Chip color="success" label={`${result?.created ?? 0} created`} />
            <Chip label={`${result?.skipped ?? 0} skipped (already exist)`} />
            {!!result?.classes_created && <Chip color="primary" label={`${result.classes_created} new class(es)`} />}
            {!!result?.errors?.length && <Chip color="error" label={`${result.errors.length} error(s)`} />}
          </Box>
          {!!result?.errors?.length && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Row</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Problem</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.errors.map((e, i) => (
                  <TableRow key={i}>
                    <TableCell>{e.row}</TableCell>
                    <TableCell><Typography variant="body2">{e.reason}</Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions><Button variant="contained" onClick={() => setResult(null)}>Done</Button></DialogActions>
      </Dialog>
    </>
  );
}
