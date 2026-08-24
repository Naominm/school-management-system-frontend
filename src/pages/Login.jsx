import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, TextField, Button, Alert, Link } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import { useAuth } from '../auth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [resent, setResent] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not sign in');
      setUnverified(err.response?.data?.code === 'EMAIL_UNVERIFIED');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', bgcolor: 'primary.main', p: 2 }}>
      <Paper sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <SchoolIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="h6">School Manager</Typography>
            <Typography variant="caption" color="text.secondary">Sign in to continue</Typography>
          </Box>
        </Box>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {unverified && (
          <Alert severity="info" sx={{ mb: 2 }}
            action={!resent && (
              <Button size="small" onClick={async () => {
                const api = (await import('../api')).default;
                const { data } = await api.post('/auth/resend-verification', { email });
                setResent(true);
                if (data.verification_url_dev) window.open(data.verification_url_dev, '_blank');
              }}>Resend</Button>
            )}
          >
            {resent ? 'Verification email sent — check your inbox.' : 'Need a new verification link?'}
          </Alert>
        )}
        <form onSubmit={submit}>
          <TextField label="Email" type="email" fullWidth required margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField label="Password" type="password" fullWidth required margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" variant="contained" fullWidth size="large" sx={{ mt: 2 }} disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          No account?{' '}
          <Link component={RouterLink} to="/register" fontWeight={600}>Create one</Link>
          {' · '}
          <Link component={RouterLink} to="/forgot-password" fontWeight={600}>Forgot password?</Link>
        </Typography>
      </Paper>
    </Box>
  );
}
