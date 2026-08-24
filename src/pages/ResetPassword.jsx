import { useState } from 'react';
import { Link as RouterLink, useParams, useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, TextField, Button, Alert, Link } from '@mui/material';
import api from '../api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const mismatch = confirm && confirm !== pw;

  async function submit(e) {
    e.preventDefault();
    try {
      await api.post(`/auth/reset-password/${token}`, { new_password: pw });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed');
    }
  }

  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', bgcolor: 'primary.main', p: 2 }}>
      <Paper sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h6" gutterBottom>Set a new password</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={submit}>
          <TextField label="New password (min 8 characters)" type="password" fullWidth required margin="normal" value={pw} onChange={(e) => setPw(e.target.value)} />
          <TextField label="Confirm password" type="password" fullWidth required margin="normal"
            error={!!mismatch} helperText={mismatch ? 'Passwords do not match' : ' '}
            value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <Button type="submit" variant="contained" fullWidth size="large" disabled={!!mismatch || pw.length < 8}>Update password</Button>
        </form>
        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          <Link component={RouterLink} to="/login" fontWeight={600}>← Back to sign in</Link>
        </Typography>
      </Paper>
    </Box>
  );
}
