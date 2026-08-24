import { useEffect, useState } from 'react';
import { Box, Grid, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Chip, LinearProgress, TableContainer } from '@mui/material';
import api from '../api';

function Stat({ title, value }) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="overline" color="text.secondary">{title}</Typography>
      <Typography variant="h4" fontWeight={700} color="primary.main">{value}</Typography>
    </Paper>
  );
}

export default function TeacherDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/teacher/dashboard').then((r) => setData(r.data)).catch(() => setData(null));
  }, []);

  if (!data) return <LinearProgress />;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Teacher dashboard
        {data.current_period && (
          <Chip size="small" label={data.current_period.name} sx={{ ml: 1.5 }} color="secondary" variant="outlined" />
        )}
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}><Stat title="Marks recorded (this period)" value={data.stats.marks_recorded_this_period} /></Grid>
        <Grid item xs={12} md={4}><Stat title="Assignments created" value={data.stats.assignments_created} /></Grid>
        <Grid item xs={12} md={4}><Stat title="Attendance records today" value={data.stats.attendance_records_today} /></Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Class teacher of</Typography>
            {data.class_teacher_of.length ? data.class_teacher_of.map((c) => (
              <Chip key={c.id} label={c.name} sx={{ mr: 1, mb: 1 }} color="primary" />
            )) : <Typography color="text.secondary">No class assigned yet.</Typography>}
          </Paper>
        </Grid>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>My teaching assignments</Typography>
            {data.subject_assignments.length ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Class</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Learning area</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.subject_assignments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.class_name}</TableCell>
                        <TableCell>{a.learning_area_name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : <Typography color="text.secondary">No subject assignments yet — the school office assigns these.</Typography>}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
