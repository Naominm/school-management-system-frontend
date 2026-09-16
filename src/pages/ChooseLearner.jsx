import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, Alert, Chip, LinearProgress, ButtonBase, Avatar,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import api from '../api';
import { useAuth } from '../auth';
import { schoolLogoUrl } from '../branding';

/**
 * A parent chooses whose records to open.
 *
 * Learners are grouped by school, because a parent may have children at more
 * than one and each school's pages carry that school's name and crest. Only
 * the chosen learner's records are readable until the parent chooses again.
 */
export default function ChooseLearner() {
  const { user, chooseLearner, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    api.get('/auth/guardian/learners')
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.error || 'Could not load your learners'));
  }, []);

  const schools = useMemo(() => {
    const groups = new Map();
    for (const l of data?.learners || []) {
      if (!groups.has(l.school.id)) groups.set(l.school.id, { school: l.school, learners: [] });
      groups.get(l.school.id).learners.push(l);
    }
    return [...groups.values()];
  }, [data]);

  async function choose(learner) {
    setBusyId(learner.id);
    setError('');
    try {
      await chooseLearner(learner.id);
      navigate('/', { replace: true });
    } catch (e) {
      setError(e.response?.data?.error || 'Could not open that learner');
      setBusyId(null);
    }
  }

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'report.petrol', py: { xs: 3, sm: 6 }, px: 2 }}>
      <Box sx={{ maxWidth: 640, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3, color: '#fff' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h5" sx={{ color: '#fff' }}>
              Welcome{user?.full_name ? `, ${user.full_name}` : ''}
            </Typography>
            <Typography sx={{ color: 'report.onPetrolMuted', mt: 0.5 }}>
              Choose whose records you would like to see.
            </Typography>
          </Box>
          <Button size="small" startIcon={<LogoutIcon />} sx={{ color: 'report.onPetrol', flexShrink: 0 }}
            onClick={() => { logout(); navigate('/login', { replace: true }); }}>
            Sign out
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {!data && !error && <LinearProgress />}

        {data && !data.learners.length && (
          <Paper sx={{ p: 3 }}>
            <Typography>No learners are linked to your account at the moment.</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Contact your child&apos;s school to have them linked.
            </Typography>
          </Paper>
        )}

        {schools.map(({ school, learners }) => {
          /* A school can close its parent portal, and a locked school is
             unavailable to everyone. Either way there is nothing to open. */
          const closed = school.locked || school.portal_open === false;
          return (
          <Paper key={school.id} sx={{ mb: 2, overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              {school.has_logo ? (
                <Box component="img" src={schoolLogoUrl(school.id, school.logo_updated_at)} alt=""
                  sx={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }} />
              ) : (
                <Avatar variant="rounded" sx={{ width: 36, height: 36, fontSize: 12, bgcolor: 'report.petrol' }}>
                  {school.code?.slice(0, 3) || 'SC'}
                </Avatar>
              )}
              <Typography sx={{ fontWeight: 600, flex: 1, minWidth: 0 }} noWrap>{school.name}</Typography>
              {closed && <Chip size="small" label={school.locked ? 'Unavailable' : 'Portal closed'} />}
            </Box>

            {learners.map((l) => {
              const current = data.current === l.id;
              return (
                <ButtonBase
                  key={l.id}
                  disabled={closed || busyId != null}
                  onClick={() => (current ? navigate('/', { replace: true }) : choose(l))}
                  sx={{
                    width: '100%', textAlign: 'left', justifyContent: 'flex-start', gap: 1.5, px: 2, py: 1.5,
                    borderTop: 1, borderColor: 'divider', '&:first-of-type': { borderTop: 0 },
                    '&:hover': { bgcolor: 'action.hover' },
                    opacity: closed ? 0.55 : 1,
                  }}
                >
                  <Avatar sx={{ bgcolor: 'report.mist', color: 'primary.main', fontWeight: 600, fontSize: 15 }}>
                    {`${l.first_name?.[0] || ''}${l.last_name?.[0] || ''}`.toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600 }} noWrap>{l.first_name} {l.last_name}</Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {[l.class_name, l.admission_number && `Adm. ${l.admission_number}`].filter(Boolean).join(' · ') || '—'}
                    </Typography>
                  </Box>
                  {current && <Chip size="small" color="primary" label="Viewing" />}
                  {busyId === l.id && <Typography variant="caption" color="text.secondary">Opening…</Typography>}
                </ButtonBase>
              );
            })}
            {closed && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 2, pb: 1.5 }}>
                {school.locked
                  ? "This school's records are unavailable at the moment."
                  : 'This school does not offer parent sign-in. Contact the school office for reports.'}
              </Typography>
            )}
          </Paper>
          );
        })}
      </Box>
    </Box>
  );
}
