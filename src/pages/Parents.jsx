import { useEffect, useState } from 'react';
import { Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Chip, Button, TableContainer, Alert } from '@mui/material';
import { exportCsv } from '../exportCsv';
import api from '../api';

export default function Parents() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/parents').then((r) => setRows(r.data)).catch((e) => setError(e.response?.data?.error || 'Could not load parents'));
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Parents & guardians</Typography>
        <Button variant="outlined" onClick={() => exportCsv('parents', [
          { key: 'full_name', label: 'Name' }, { key: 'email', label: 'Email' },
        ], rows)}>Export CSV</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Linked learners</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell>{p.full_name}</TableCell>
                <TableCell>{p.email}</TableCell>
                <TableCell>
                  {p.students.length ? p.students.map((s) => (
                    <Chip key={s.id} size="small" sx={{ mr: 0.5, mb: 0.5 }} label={`${s.first_name} ${s.last_name} (${s.admission_number || '—'})`} />
                  )) : <Typography variant="body2" color="text.secondary">None linked</Typography>}
                </TableCell>
                <TableCell><Chip size="small" label={p.active ? 'Active' : 'Inactive'} color={p.active ? 'success' : 'default'} /></TableCell>
              </TableRow>
            ))}
            {!rows.length && <TableRow><TableCell colSpan={4}><Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>No parent accounts yet — parents register from the sign-in page.</Typography></TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
