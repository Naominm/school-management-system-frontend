import { useRef, useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Alert, Table, TableHead, TableRow, TableCell, TableBody, Box, Chip } from '@mui/material';
import UploadIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
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

export default function ImportStudents({ onImported }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

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
      <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={handleFile} />

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
