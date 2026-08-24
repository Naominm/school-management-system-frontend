import { useEffect, useState } from 'react';
import { Box, Paper, Typography, Tabs, Tab, List, ListItemButton, ListItemText, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Alert, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import api from '../api';
import { useAuth } from '../auth';

export default function Messages() {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [rows, setRows] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [composing, setComposing] = useState(null);
  const [reading, setReading] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    const [m, r] = await Promise.all([api.get('/messages'), api.get('/messaging/recipients')]);
    setRows(m.data); setRecipients(r.data.filter((x) => x.id !== user.id));
  }
  useEffect(() => { load().catch((e) => setError(e.response?.data?.error || 'Could not load messages')); }, []);

  const inbox = rows.filter((m) => m.recipient_id === user.id);
  const sent = rows.filter((m) => m.sender_id === user.id);
  const shown = tab === 0 ? inbox : sent;
  const nameOf = (id) => recipients.find((r) => r.id === id)?.full_name || (id === user.id ? 'Me' : `User #${id}`);

  async function open(m) {
    setReading(m);
    if (m.recipient_id === user.id && !m.is_read) {
      await api.post(`/messages/${m.id}/read`).catch(() => {});
      load();
    }
  }

  async function send() {
    try {
      await api.post('/messages', composing);
      setComposing(null); setTab(1); load();
    } catch (e) { setError(e.response?.data?.error || 'Could not send'); }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Messages</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setComposing({ recipient_id: '', subject: '', body: '' })}>
          Compose
        </Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Paper>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={`Inbox (${inbox.filter((m) => !m.is_read).length} unread)`} />
          <Tab label="Sent" />
        </Tabs>
        <List dense>
          {shown.map((m) => (
            <ListItemButton key={m.id} onClick={() => open(m)} sx={{ bgcolor: tab === 0 && !m.is_read ? 'action.hover' : undefined }}>
              <ListItemText
                primary={m.subject || '(no subject)'}
                secondary={`${tab === 0 ? 'From' : 'To'}: ${nameOf(tab === 0 ? m.sender_id : m.recipient_id)} · ${String(m.created_at).slice(0, 10)}`}
              />
              {tab === 0 && !m.is_read && <Chip size="small" label="New" color="secondary" />}
            </ListItemButton>
          ))}
          {!shown.length && <Typography color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>Nothing here yet.</Typography>}
        </List>
      </Paper>

      <Dialog open={!!reading} onClose={() => setReading(null)} fullWidth maxWidth="sm">
        <DialogTitle>{reading?.subject || '(no subject)'}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="caption" color="text.secondary">
            From {nameOf(reading?.sender_id)} · {String(reading?.created_at).slice(0, 16).replace('T', ' ')}
          </Typography>
          <Divider sx={{ my: 1.5 }} />
          <Typography sx={{ whiteSpace: 'pre-wrap' }}>{reading?.body}</Typography>
        </DialogContent>
        <DialogActions><Button onClick={() => setReading(null)}>Close</Button></DialogActions>
      </Dialog>

      <Dialog open={!!composing} onClose={() => setComposing(null)} fullWidth maxWidth="sm">
        <DialogTitle>New message</DialogTitle>
        <DialogContent dividers>
          {composing && (
            <>
              <TextField select label="To" fullWidth margin="dense" value={composing.recipient_id}
                onChange={(e) => setComposing((c) => ({ ...c, recipient_id: e.target.value }))}>
                {recipients.map((r) => <MenuItem key={r.id} value={r.id}>{r.full_name} · {r.role}</MenuItem>)}
              </TextField>
              <TextField label="Subject" fullWidth margin="dense" value={composing.subject}
                onChange={(e) => setComposing((c) => ({ ...c, subject: e.target.value }))} />
              <TextField label="Message" fullWidth margin="dense" multiline minRows={4} value={composing.body}
                onChange={(e) => setComposing((c) => ({ ...c, body: e.target.value }))} />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComposing(null)}>Cancel</Button>
          <Button variant="contained" onClick={send} disabled={!composing?.recipient_id || !composing?.body}>Send</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
