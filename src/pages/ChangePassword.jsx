import { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Alert } from '@mui/material';
import api from '../api';

export default function ChangePassword() {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [msg, setMsg] = useState(null);
  const mismatch = form.confirm && form.confirm !== form.new_password;

  async function submit(e) {
    e.preventDefault();
    try {
      await api.post('/auth/change-password', form);
      setMsg({ sev: 'success', text: 'Password updated.' });
      setForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      setMsg({ sev: 'error', text: err.response?.data?.error || 'Could not update password' });
    }
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Change password</Typography>
      <Paper sx={{ p: 3, maxWidth: 480 }}>
        {msg && <Alert severity={msg.sev} sx={{ mb: 2 }} onClose={() => setMsg(null)}>{msg.text}</Alert>}
        <form onSubmit={submit}>
          <TextField label="Current password" type="password" fullWidth margin="normal" required
            value={form.current_password} onChange={(e) => setForm((f) => ({ ...f, current_password: e.target.value }))} />
          <TextField label="New password (min 8 characters)" type="password" fullWidth margin="normal" required
            value={form.new_password} onChange={(e) => setForm((f) => ({ ...f, new_password: e.target.value }))} />
          <TextField label="Confirm new password" type="password" fullWidth margin="normal" required
            error={!!mismatch} helperText={mismatch ? 'Passwords do not match' : ' '}
            value={form.confirm} onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))} />
          <Button type="submit" variant="contained" disabled={!!mismatch || form.new_password.length < 8}>Update password</Button>
        </form>
      </Paper>
    </Box>
  );
}
