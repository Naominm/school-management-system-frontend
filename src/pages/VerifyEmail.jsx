import { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { Box, Paper, Typography, Alert, Link, CircularProgress } from '@mui/material';
import api from '../api';

export default function VerifyEmail() {
  const { token } = useParams();
  const [state, setState] = useState({ busy: true, ok: false, error: '' });

  useEffect(() => {
    api.post(`/auth/verify-email/${token}`)
      .then(() => setState({ busy: false, ok: true, error: '' }))
      .catch((err) => setState({ busy: false, ok: false, error: err.response?.data?.error || 'Verification failed' }));
  }, [token]);

  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', bgcolor: 'primary.main', p: 2 }}>
      <Paper sx={{ p: 4, width: '100%', maxWidth: 400, textAlign: 'center' }}>
        {state.busy ? (
          <>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Verifying your email…</Typography>
          </>
        ) : state.ok ? (
          <Alert severity="success">
            Email verified — your account is active.
            <Box sx={{ mt: 2 }}>
              <Link component={RouterLink} to="/login" fontWeight={600}>Sign in</Link>
            </Box>
          </Alert>
        ) : (
          <Alert severity="error">
            {state.error}
            <Box sx={{ mt: 2 }}>
              <Link component={RouterLink} to="/login" fontWeight={600}>Back to sign in</Link>
            </Box>
          </Alert>
        )}
      </Paper>
    </Box>
  );
}
