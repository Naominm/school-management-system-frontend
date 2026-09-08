import { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Alert, Stack, MenuItem, Chip,
  Table, TableHead, TableRow, TableCell, TableBody, LinearProgress,
  ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import api from '../api';
import SchoolHeader from '../components/SchoolHeader';

/**
 * What a message will cost to send, worked out the same way the gateway does.
 *
 * GSM-7 fits 160 characters, or 153 each once it splits; a character outside
 * that alphabet — a curly quote, an em dash, an emoji — drops the whole
 * message to UCS-2 at 70. A school pays per segment per recipient, so it is
 * shown before they press send rather than discovered on the bill.
 */
const GSM7 = "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?"
  + '¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';
const GSM7_EXT = '^{}\\[~]|€';

function segmentsFor(text) {
  const body = String(text || '');
  const gsm = [...body].every((ch) => GSM7.includes(ch) || GSM7_EXT.includes(ch));
  const units = gsm
    ? [...body].reduce((n, ch) => n + (GSM7_EXT.includes(ch) ? 2 : 1), 0)
    : body.length;
  const single = gsm ? 160 : 70;
  const multi = gsm ? 153 : 67;
  return {
    encoding: gsm ? 'GSM-7' : 'UCS-2',
    characters: units,
    segments: units === 0 ? 0 : (units <= single ? 1 : Math.ceil(units / multi)),
  };
}

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
  const [channel, setChannel] = useState('sms');
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
  const reach = chosen ? (channel === 'sms' ? chosen.sms : chosen.email) : 0;
  const size = segmentsFor(body);
  const configured = channel === 'sms' ? audiences?.sms_configured : audiences?.mailer_configured;

  async function send() {
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.post('/notifications/send', { audience, channel, subject, body });
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
      <SchoolHeader title="Notices" subtitle="Text or email parents and staff" />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {audiences && !configured && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {channel === 'sms' ? (
            <>
              SMS is not configured on this server, so notices will be recorded but not delivered.
              Set <code>SMS_PROVIDER=africastalking</code>, <code>AT_USERNAME</code>,{' '}
              <code>AT_API_KEY</code> and <code>AT_SENDER_ID</code> to send them.
            </>
          ) : (
            <>
              Email is not configured on this server, so notices will be recorded but not delivered.
              Set <code>SMTP_HOST</code>, <code>SMTP_USER</code> and <code>SMTP_PASS</code> to send them.
            </>
          )}
        </Alert>
      )}

      {result && (
        <Alert severity={result.sent ? 'success' : 'warning'} sx={{ mb: 2 }} onClose={() => setResult(null)}>
          {result.recipients} {result.recipients === 1 ? 'recipient' : 'recipients'} ·{' '}
          {result.sent} sent
          {result.not_sent ? ` · ${result.not_sent} not sent (${result.channel === 'sms' ? 'SMS' : 'email'} not configured)` : ''}
          {result.failed ? ` · ${result.failed} failed` : ''}
          {result.unusable ? ` · ${result.unusable} skipped (no usable ${result.channel === 'sms' ? 'number' : 'address'})` : ''}
          {result.billed_segments ? ` · ${result.billed_segments} SMS segments billed` : ''}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 2, maxWidth: 720 }}>
        <Stack spacing={2}>
          <ToggleButtonGroup exclusive size="small" value={channel}
            onChange={(_, v) => v && setChannel(v)}>
            <ToggleButton value="sms">Text message</ToggleButton>
            <ToggleButton value="email">Email</ToggleButton>
          </ToggleButtonGroup>

          <TextField select label="Send to" value={audience} onChange={(e) => setAudience(e.target.value)}
            helperText={chosen
              ? `${reach} ${reach === 1 ? 'recipient' : 'recipients'} with a ${channel === 'sms' ? 'phone number' : 'email address'} on file`
              : `Taken from the roster; someone with two children here receives one notice.${
                channel === 'sms' ? ' The parent phone is used, falling back to the emergency contact number.' : ''}`}>
            {options.map((o) => {
              const n = channel === 'sms' ? o.sms : o.email;
              return (
                <MenuItem key={o.key} value={o.key} disabled={!n}>
                  {o.label}
                  <Chip size="small" label={n} sx={{ ml: 1.5 }}
                    color={n ? 'default' : 'error'} variant="outlined" />
                </MenuItem>
              );
            })}
          </TextField>

          {channel === 'email' && (
            <TextField label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
          )}

          <TextField label="Message" value={body} onChange={(e) => setBody(e.target.value)}
            multiline minRows={channel === 'sms' ? 4 : 6} required
            helperText={channel === 'sms'
              ? `${size.characters} characters · ${size.encoding} · ${size.segments} segment${size.segments === 1 ? '' : 's'} each${
                reach ? ` · ${size.segments * reach} billed` : ''}${
                size.encoding === 'UCS-2' ? ' — a curly quote, dash or emoji halves what fits' : ''}`
              : ' '} />

          <Box>
            <Button variant="contained" startIcon={<SendIcon />} onClick={send}
              disabled={busy || !audience || !body.trim() || !reach || (channel === 'email' && !subject.trim())}>
              {busy ? 'Sending…' : `Send${reach ? ` to ${reach}` : ''}`}
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
              <TableCell>Via</TableCell>
              <TableCell>To</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {log.map((n) => (
              <TableRow key={n.id}>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{String(n.sent_at || '').slice(0, 16).replace('T', ' ')}</TableCell>
                <TableCell>
                  <Chip size="small" variant="outlined"
                    label={n.channel === 'sms' ? 'SMS' : 'Email'} />
                </TableCell>
                <TableCell>{n.recipient_phone || n.recipient_email}</TableCell>
                <TableCell>{n.subject}</TableCell>
                <TableCell>
                  <Chip size="small" label={STATUS[n.status]?.label || n.status}
                    color={STATUS[n.status]?.colour || 'default'}
                    title={n.error_message || undefined} />
                </TableCell>
              </TableRow>
            ))}
            {!log.length && (
              <TableRow><TableCell colSpan={5}>
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
