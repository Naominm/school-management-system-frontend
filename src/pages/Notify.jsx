import { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Alert, Stack, MenuItem, Chip,
  Table, TableHead, TableRow, TableCell, TableBody, LinearProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import api from '../api';
import SchoolHeader from '../components/SchoolHeader';

/**
 * Send a notice to parents or staff, and see what became of it.
 *
 * The audience is chosen by name — the parents of a class, all parents, all
 * staff — and the addresses behind it are resolved on the server from the
 * roster. Nobody pastes an address list, and a notice cannot be aimed outside
 * the school.
 */

const STATUS = {
  sent: { label: 'Sent', colour: 'success' },
  not_sent: { label: 'Not sent', colour: 'warning' },
  failed: { label: 'Failed', colour: 'error' },
};

export default function Notify() {
  const [audiences, setAudiences] = useState(null);
  const [audience, setAudience] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [log, setLog] = useState([]);

  async function loadLog() {
    const { data } = await api.get('/notifications').catch(() => ({ data: [] }));
    setLog(data.slice(0, 40));
  }

  useEffect(() => {
    api.get('/notifications/audiences')
      .then((r) => setAudiences(r.data))
      .catch((e) => setError(e.response?.data?.error || 'Could not load the audiences'));
    loadLog();
  }, []);

  const options = audiences ? [...audiences.groups, ...audiences.classes] : [];
  const chosen = options.find((o) => o.key === audience);

  async function send() {
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.post('/notifications/send', { audience, subject, body });
      setResult(data);
      setSubject('');
      setBody('');
      await loadLog();
    } catch (e) {
      setError(e.response?.data?.error || 'Could not send that notice');
    } finally {
      setBusy(false);
    }
  }

  if (!audiences && !error) return <LinearProgress />;

  return (
    <Box>
      <SchoolHeader title="Notices" subtitle="Email parents and staff" />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {audiences && !audiences.mailer_configured && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Email is not configured on this server, so notices will be recorded but not delivered.
          Set <code>SMTP_HOST</code>, <code>SMTP_USER</code> and <code>SMTP_PASS</code> to send them.
        </Alert>
      )}

      {result && (
        <Alert severity={result.sent ? 'success' : 'warning'} sx={{ mb: 2 }} onClose={() => setResult(null)}>
          {result.recipients} {result.recipients === 1 ? 'recipient' : 'recipients'} ·{' '}
          {result.sent} sent
          {result.not_sent ? ` · ${result.not_sent} not sent (email not configured)` : ''}
          {result.failed ? ` · ${result.failed} failed` : ''}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 2, maxWidth: 720 }}>
        <Stack spacing={2}>
          <TextField select label="Send to" value={audience} onChange={(e) => setAudience(e.target.value)}
            helperText={chosen
              ? `${chosen.count} ${chosen.count === 1 ? 'address' : 'addresses'} on file`
              : 'Addresses are taken from the roster; a parent with two children receives one notice.'}>
            {options.map((o) => (
              <MenuItem key={o.key} value={o.key} disabled={!o.count}>
                {o.label}
                <Chip size="small" label={o.count} sx={{ ml: 1.5 }}
                  color={o.count ? 'default' : 'error'} variant="outlined" />
              </MenuItem>
            ))}
          </TextField>

          <TextField label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
          <TextField label="Message" value={body} onChange={(e) => setBody(e.target.value)}
            multiline minRows={5} required />

          <Box>
            <Button variant="contained" startIcon={<SendIcon />} onClick={send}
              disabled={busy || !audience || !subject.trim() || !body.trim() || !chosen?.count}>
              {busy ? 'Sending…' : `Send${chosen?.count ? ` to ${chosen.count}` : ''}`}
            </Button>
          </Box>
        </Stack>
      </Paper>

      <Typography variant="subtitle2" gutterBottom>Recently sent</Typography>
      <Paper sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 560 }}>
          <TableHead>
            <TableRow>
              <TableCell>When</TableCell>
              <TableCell>To</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {log.map((n) => (
              <TableRow key={n.id}>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{String(n.sent_at || '').slice(0, 16).replace('T', ' ')}</TableCell>
                <TableCell>{n.recipient_email}</TableCell>
                <TableCell>{n.subject}</TableCell>
                <TableCell>
                  <Chip size="small" label={STATUS[n.status]?.label || n.status}
                    color={STATUS[n.status]?.colour || 'default'}
                    title={n.error_message || undefined} />
                </TableCell>
              </TableRow>
            ))}
            {!log.length && (
              <TableRow><TableCell colSpan={4}>
                <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No notices sent yet.
                </Typography>
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
