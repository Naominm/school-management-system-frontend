import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, TextField, Button, Alert, Link, Collapse, Divider } from '@mui/material';
import FamilyIcon from '@mui/icons-material/FamilyRestroom';
import api from '../api';
import { useAuth } from '../auth';

/**
 * A parent turns on the account their school made for them.
 *
 * The code came by text, by email, or on a slip from the office; with it and
 * the phone or email the school recorded, the parent chooses a password. The
 * same page takes a new code for a forgotten password, so a parent has one
 * place to go whatever went wrong.
 */
export default function Activate() {
  const { startSession } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: '', code: '', password: '', confirm_password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);
  const [requested, setRequested] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const mismatch = Boolean(form.confirm_password) && form.confirm_password !== form.password;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/auth/guardian/activate', form);
      const { landing } = startSession(data);
      navigate(landing, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not activate the account');
    } finally {
      setBusy(false);
    }
  }

  async function requestCode() {
    setBusy(true);
    setError('');
    try {
      await api.post('/auth/guardian/request-code', { identifier: form.identifier });
      setRequested(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not request a code');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', bgcolor: 'report.petrol', p: 2 }}>
      <Paper sx={{ p: { xs: 3, sm: 4 }, width: '100%', maxWidth: 420 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <FamilyIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="h6">Parent account</Typography>
            <Typography variant="caption" color="text.secondary">
              Activate the account your school set up, or reset your password
            </Typography>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={submit}>
          <TextField
            label="Phone number or email" fullWidth required margin="normal"
            helperText="The one your school has on record for you."
            autoComplete="username" autoCapitalize="none" spellCheck={false}
            value={form.identifier} onChange={set('identifier')}
          />
          <TextField
            label="Code" fullWidth required margin="normal" placeholder="ABCD-2345"
            autoComplete="one-time-code"
            inputProps={{
              autoCapitalize: 'characters', spellCheck: false,
              style: { textTransform: 'uppercase', letterSpacing: '0.18em', fontFamily: 'ui-monospace, Menlo, Consolas, monospace' },
            }}
            value={form.code} onChange={set('code')}
          />
          <TextField
            label="New password (min 8 characters)" type="password" fullWidth required margin="normal"
            autoComplete="new-password"
            value={form.password} onChange={set('password')}
          />
          <TextField
            label="Confirm password" type="password" fullWidth required margin="normal"
            autoComplete="new-password"
            value={form.confirm_password} onChange={set('confirm_password')}
            error={mismatch} helperText={mismatch ? 'Passwords do not match' : ' '}
          />
          <Button type="submit" variant="contained" fullWidth size="large" sx={{ mt: 1 }} disabled={busy || mismatch}>
            {busy ? 'Please wait…' : 'Activate and sign in'}
          </Button>
        </form>

        <Divider sx={{ my: 2.5 }} />

        {requested ? (
          <Alert severity="success">
            If that phone number or email belongs to a parent account, a new code is on its way by text and email.
            It can take a minute to arrive.
          </Alert>
        ) : (
          <>
            <Button size="small" onClick={() => setAsking((v) => !v)}>
              No code, or forgot your password?
            </Button>
            <Collapse in={asking}>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1.5 }}>
                Enter your phone number or email above and we will send a new code to it. If your school has no
                phone or email for you, ask the office for an activation slip.
              </Typography>
              <Button variant="outlined" fullWidth disabled={busy || !form.identifier.trim()} onClick={requestCode}>
                Send me a new code
              </Button>
            </Collapse>
          </>
        )}

        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          Already activated?{' '}
          <Link component={RouterLink} to="/login" fontWeight={600}>Sign in</Link>
        </Typography>
      </Paper>
    </Box>
  );
}
