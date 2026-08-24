import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Paper, Typography, TextField, Button, Alert, MenuItem, Link } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import api from '../api';

export default function Register() {
  const [form, setForm] = useState({
    role: 'parent', full_name: '', email: '', admission_number: '',
    password: '', confirm_password: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const { data } = await api.post('/auth/register', form);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create the account');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', bgcolor: 'primary.main', p: 2 }}>
      <Paper sx={{ p: 4, width: '100%', maxWidth: 440 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <SchoolIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="h6">Create account</Typography>
            <Typography variant="caption" color="text.secondary">
              For parents and learners. Staff accounts are created by the school.
            </Typography>
          </Box>
        </Box>

        {result ? (
          <Alert severity="success">
            {result.message}
            {result.verification_url_dev && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" display="block" color="text.secondary">
                  No mail server configured — use this link to verify:
                </Typography>
                <Link href={result.verification_url_dev} sx={{ wordBreak: 'break-all', fontSize: 13 }}>
                  {result.verification_url_dev}
                </Link>
              </Box>
            )}
            <Box sx={{ mt: 2 }}>
              <Link component={RouterLink} to="/login" fontWeight={600}>Go to sign in</Link>
            </Box>
          </Alert>
        ) : (
          <>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <form onSubmit={submit}>
              <TextField select label="I am a" fullWidth margin="normal" value={form.role} onChange={set('role')}>
                <MenuItem value="parent">Parent / Guardian</MenuItem>
                <MenuItem value="learner">Learner</MenuItem>
              </TextField>
              {form.role === 'parent' ? (
                <TextField label="Full name" fullWidth required margin="normal" value={form.full_name} onChange={set('full_name')} />
              ) : (
                <TextField
                  label="Admission number" fullWidth required margin="normal"
                  helperText="Your account will be linked to your student record."
                  value={form.admission_number} onChange={set('admission_number')}
                />
              )}
              <TextField label="Email" type="email" fullWidth required margin="normal" value={form.email} onChange={set('email')} />
              <TextField label="Password (min 8 characters)" type="password" fullWidth required margin="normal" value={form.password} onChange={set('password')} />
              <TextField
                label="Confirm password" type="password" fullWidth required margin="normal"
                value={form.confirm_password} onChange={set('confirm_password')}
                error={!!form.confirm_password && form.confirm_password !== form.password}
                helperText={form.confirm_password && form.confirm_password !== form.password ? 'Passwords do not match' : ' '}
              />
              <Button type="submit" variant="contained" fullWidth size="large" sx={{ mt: 1 }} disabled={busy}>
                {busy ? 'Creating…' : 'Create account'}
              </Button>
            </form>
            <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
              Already registered?{' '}
              <Link component={RouterLink} to="/login" fontWeight={600}>Sign in</Link>
            </Typography>
          </>
        )}
      </Paper>
    </Box>
  );
}
