import { useEffect, useState } from 'react';
import { Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, TableContainer } from '@mui/material';
import api from '../api';

export default function Fees() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [paying, setPaying] = useState(null);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const [f, s] = await Promise.all([api.get('/fees'), api.get('/students')]);
    setFees(f.data); setStudents(s.data);
  }
  useEffect(() => { load().catch(() => {}); }, []);

  const studentName = (id) => {
    const s = students.find((x) => x.id === id);
    return s ? `${s.last_name} ${s.first_name}` : `#${id}`;
  };

  async function pay() {
    try {
      await api.post(`/fees/${paying.id}/pay`, { amount: Number(amount), reference });
      setPaying(null); setAmount(''); setReference('');
      load();
    } catch (e) { setError(e.response?.data?.error || 'Payment failed'); }
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Fees</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Learner', 'Type', 'Billed', 'Paid', 'Balance', 'Term', 'Status', ''].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {fees.map((f) => (
              <TableRow key={f.id} hover>
                <TableCell>{studentName(f.student_id)}</TableCell>
                <TableCell>{f.fee_type}</TableCell>
                <TableCell>{Number(f.amount).toLocaleString()}</TableCell>
                <TableCell>{Number(f.amount_paid).toLocaleString()}</TableCell>
                <TableCell>{Number(f.balance).toLocaleString()}</TableCell>
                <TableCell>{f.term ?? '—'}</TableCell>
                <TableCell><Chip size="small" label={f.paid ? 'Cleared' : 'Outstanding'} color={f.paid ? 'success' : 'warning'} /></TableCell>
                <TableCell align="right">
                  {!f.paid && <Button size="small" variant="outlined" onClick={() => setPaying(f)}>Record payment</Button>}
                </TableCell>
              </TableRow>
            ))}
            {!fees.length && <TableRow><TableCell colSpan={8}><Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>No fee records — create them under the Fees resource via the API or admin tools.</Typography></TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!paying} onClose={() => setPaying(null)} fullWidth maxWidth="xs">
        <DialogTitle>Record payment — {paying && studentName(paying.student_id)}</DialogTitle>
        <DialogContent dividers>
          <TextField label="Amount" type="number" fullWidth margin="dense" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <TextField label="Reference (receipt / txn no.)" fullWidth margin="dense" value={reference} onChange={(e) => setReference(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaying(null)}>Cancel</Button>
          <Button variant="contained" onClick={pay} disabled={!amount || Number(amount) <= 0}>Save payment</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
