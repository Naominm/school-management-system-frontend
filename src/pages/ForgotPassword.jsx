import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Paper, Typography, TextField, Button, Alert, Link } from '@mui/material';
import api from '../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);

  async function submit(e) {
    e.preventDefault();
    const { data } = await api.post('/auth/forgot-password', { email });
    setResult(data);
  }

  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', bgcolor: 'primary.main', p: 2 }}>
      <Paper sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h6" gutterBottom>Reset password</Typography>
        {result ? (
          <Alert severity="success">
            If an account exists for that address, a reset link has been sent.
            {result.reset_token_dev && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  No mail server configured — use this link:
                </Typography>
                <Link component={RouterLink} to={`/reset-password/${result.reset_token_dev}`} sx={{ fontSize: 13 }}>
                  Reset password now
                </Link>
              </Box>
            )}
          </Alert>
        ) : (
          <form onSubmit={submit}>
            <TextField label="Work email" type="email" fullWidth required margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button type="submit" variant="contained" fullWidth size="large" sx={{ mt: 1 }}>Send reset link</Button>
          </form>
        )}
        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          <Link component={RouterLink} to="/login" fontWeight={600}>← Back to sign in</Link>
        </Typography>
      </Paper>
    </Box>
  );
}
