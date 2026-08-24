import { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box, LinearProgress, Stack } from '@mui/material';
import api from '../api';
import { useAuth } from '../auth';
import TeacherDashboard from './TeacherDashboard';

function Stat({ title, value, sub }) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="overline" color="text.secondary">{title}</Typography>
      <Typography variant="h4" fontWeight={700} color="primary.main">{value}</Typography>
      {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
    </Paper>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const staff = ['admin', 'staff'].includes(user?.role);
  if (user?.role === 'teacher') return <TeacherDashboard />;

  useEffect(() => {
    if (staff) api.get('/analytics').then((r) => setData(r.data)).catch(() => setData(null));
  }, [staff]);

  if (!staff) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>Welcome, {user?.full_name}</Typography>
        <Typography color="text.secondary">
          Use the menu to view announcements, timetables, assignments and report cards.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Dashboard</Typography>
      {!data ? <LinearProgress /> : (
        <>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}><Stat title="Students" value={data.totals.students} sub="Active" /></Grid>
            <Grid item xs={6} md={3}><Stat title="Teachers" value={data.totals.teachers} sub="Active" /></Grid>
            <Grid item xs={6} md={3}><Stat title="Classes" value={data.totals.classes} /></Grid>
            <Grid item xs={6} md={3}><Stat title="Learning areas" value={data.totals.learning_areas} /></Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Fees</Typography>
                <Stack direction="row" spacing={4}>
                  <Box>
                    <Typography variant="overline" color="text.secondary">Billed</Typography>
                    <Typography variant="h5" fontWeight={700}>{Number(data.fees.billed).toLocaleString()}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="overline" color="text.secondary">Collected</Typography>
                    <Typography variant="h5" fontWeight={700} color="primary.main">{Number(data.fees.collected).toLocaleString()}</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Class sizes</Typography>
                {data.class_sizes.map((c) => (
                  <Box key={c.name} sx={{ mb: 1.2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{c.name}</Typography>
                      <Typography variant="body2" fontWeight={600}>{c.students}</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={Math.min(100, c.students)} sx={{ height: 6, borderRadius: 3 }} />
                  </Box>
                ))}
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
