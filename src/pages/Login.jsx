import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, TextField, Button, Alert, Link } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import { useAuth } from '../auth';

/**
 * Sign in with an email and a password.
 *
 * There is no school picker: an email is unique across the platform, so it
 * already says which school an account belongs to and which side of the
 * system that person works on. The server resolves both after the password
 * checks out — deliberately after, so that nobody can probe which school an
 * address belongs to without being able to sign in as it.
 */
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [resent, setResent] = useState(false);
  const [locked, setLocked] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setUnverified(false);
    setLocked(false);
    try {
      // The server says where this account belongs: the console for a platform
      // administrator, the password form for anyone owing a change, otherwise
      // their dashboard.
      const { landing } = await login(email, password);
      navigate(landing, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not sign in');
      setUnverified(err.response?.data?.code === 'EMAIL_UNVERIFIED');
      setLocked(err.response?.data?.code === 'SCHOOL_LOCKED');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', bgcolor: 'report.petrol', p: 2 }}>
      <Paper sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <SchoolIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="h6">School Manager</Typography>
            <Typography variant="caption" color="text.secondary">Sign in to continue</Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} icon={locked ? false : undefined}>
            {locked && <strong>This school is locked. </strong>}
            {error}
            {locked && (
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                Your records are safe. Access is restored by the platform administrator.
              </Typography>
            )}
          </Alert>
        )}

        {unverified && (
          <Alert
            severity="info" sx={{ mb: 2 }}
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
          <TextField
            label="Email" type="email" fullWidth required margin="normal"
            autoComplete="username" autoFocus
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Password" type="password" fullWidth required margin="normal"
            autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)}
          />
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
