import { useRef, useState } from 'react';
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Alert, Box, Chip,
  Table, TableHead, TableRow, TableCell, TableBody,
} from '@mui/material';
import UploadIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import { exportCsv } from '../exportCsv';
import api from '../api';

const TEMPLATE_COLUMNS = [
  { key: 'admission_number', label: 'admission_number' },
  { key: 'parent_name', label: 'parent_name' },
  { key: 'phone', label: 'phone' },
  { key: 'email', label: 'email' },
  { key: 'relationship', label: 'relationship' },
];
const TEMPLATE_EXAMPLE = [
  { admission_number: 'ADM-100', parent_name: 'Jane Kamau', phone: '0712345678', email: 'jane.kamau@example.com', relationship: 'Mother' },
  { admission_number: 'ADM-100', parent_name: 'Peter Kamau', phone: '0722345678', email: '', relationship: 'Father' },
  { admission_number: 'ADM-101', parent_name: 'Jane Kamau', phone: '0712345678', email: 'jane.kamau@example.com', relationship: 'Mother' },
];

/**
 * Parents from a spreadsheet, matched to learners by admission number.
 *
 * One row per parent per learner: two guardians are two rows, and a parent
 * with several children repeats their phone or email on each child's row and
 * still gets one account. Nothing is sent to parents on import — codes go out
 * from the Parents page when the school is ready.
 */
export default function ImportParents({ onImported }) {
  const fileRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const csv = await file.text();
      const { data } = await api.post('/guardians/import', { csv });
      setResult(data);
      onImported?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not import that file');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => setOpen(true)}>Import CSV</Button>
      <Dialog open={open} onClose={() => !busy && setOpen(false)} maxWidth="sm">
        <DialogTitle>Import parents</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 1 }}>
            One row for each parent of each learner, matched by <strong>admission_number</strong>. Each parent needs a
            <strong> phone</strong> or <strong>email</strong> — it is how they sign in. A parent with several children
            repeats the same phone or email on each child&apos;s row and gets one account.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Nothing is sent on import. When you are ready, send codes or print slips from this page. Importing the same
            file again adds nothing twice.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button startIcon={<DownloadIcon />} onClick={() => exportCsv('parents-template', TEMPLATE_COLUMNS, TEMPLATE_EXAMPLE)}>
              Download template
            </Button>
            <Button variant="contained" startIcon={<UploadIcon />} disabled={busy} onClick={() => fileRef.current?.click()}>
              {busy ? 'Importing…' : 'Choose CSV file'}
            </Button>
          </Box>
          <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={pick} />

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

          {result && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                <Chip color="success" label={`${result.linked} linked`} />
                {!!result.accounts_created && <Chip color="primary" label={`${result.accounts_created} new parent account(s)`} />}
                {!!result.already_linked && <Chip label={`${result.already_linked} already linked`} />}
                {!!result.errors.length && <Chip color="error" label={`${result.errors.length} row(s) not imported`} />}
              </Box>
              <Alert severity={result.learners_without_parent ? 'warning' : 'success'} sx={{ mb: result.errors.length ? 1.5 : 0 }}>
                {result.learners_without_parent
                  ? `${result.learners_without_parent} learner(s) still have no parent linked.`
                  : 'Every learner now has a parent linked.'}
              </Alert>
              {!!result.errors.length && (
                <Box sx={{ overflowX: 'auto', maxHeight: 260 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Row</TableCell>
                        <TableCell>Admission no.</TableCell>
                        <TableCell>Why</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.errors.map((e) => (
                        <TableRow key={`${e.row}-${e.reason}`}>
                          <TableCell>{e.row}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{e.admission_number || '—'}</TableCell>
                          <TableCell>{e.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={busy}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
