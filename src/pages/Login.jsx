import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, TextField, Button, Alert, Link, MenuItem, ListItemText, Chip, Stack } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import { useAuth } from '../auth';
import api from '../api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [resent, setResent] = useState(false);
  const [schools, setSchools] = useState([]);
  const [schoolId, setSchoolId] = useState('');
  const [locked, setLocked] = useState(false);

  /* Public directory — identity only, no tenant data, no token required. */
  useEffect(() => {
    api.get('/auth/schools/public')
      .then((r) => setSchools(r.data))
      .catch(() => setSchools([]));
  }, []);

  const chosen = schools.find((s) => String(s.id) === String(schoolId));

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await login(email, password, schoolId);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not sign in');
      setUnverified(err.response?.data?.code === 'EMAIL_UNVERIFIED');
      setLocked(err.response?.data?.code === 'SCHOOL_LOCKED');
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
          <TextField
            select label="School" fullWidth required margin="normal"
            value={schoolId} onChange={(e) => { setSchoolId(e.target.value); setError(''); setLocked(false); }}
            helperText={chosen?.locked
              ? 'This school is currently locked — sign-in is suspended.'
              : 'Choose the school you belong to.'}
          >
            {schools.map((s) => (
              <MenuItem key={s.id} value={s.id} disabled={s.locked}>
                <Box sx={{ width: 22, height: 22, borderRadius: '6px', mr: 1.5, flexShrink: 0,
                           bgcolor: s.crest_colour || 'primary.main', color: '#fff', fontSize: 10,
                           display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                  {s.code}
                </Box>
                <ListItemText primary={s.name} sx={{ my: 0 }} />
                {s.locked && <Chip size="small" label="Locked" color="error" sx={{ ml: 1 }} />}
              </MenuItem>
            ))}
            <MenuItem value="__super__">
              <Box sx={{ width: 22, height: 22, borderRadius: '6px', mr: 1.5, flexShrink: 0,
                         bgcolor: 'secondary.main', color: '#fff', fontSize: 10,
                         display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                LX
              </Box>
              <ListItemText primary="Platform Console" secondary="Super administrator" sx={{ my: 0 }} />
            </MenuItem>
          </TextField>
          <TextField label="Email" type="email" fullWidth required margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField label="Password" type="password" fullWidth required margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" variant="contained" fullWidth size="large" sx={{ mt: 2 }}
            disabled={busy || !schoolId || !!chosen?.locked}>
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
