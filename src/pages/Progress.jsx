import { useEffect, useState } from 'react';
import { Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Chip, LinearProgress, TableContainer } from '@mui/material';
import api from '../api';

export default function Progress() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/progress').then((r) => setData(r.data)).catch(() => setData({ students: [] }));
  }, []);

  if (!data) return <LinearProgress />;
  if (!data.students.length) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>Academic progress</Typography>
        <Typography color="text.secondary">No linked learner records found for your account yet.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Academic progress</Typography>
      {data.students.map((s) => {
        const periods = [...new Set(s.marks.map((m) => `${m.academic_year} · Term ${m.term}`))];
        return (
          <Paper key={s.id} sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6">{s.first_name} {s.last_name}</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {s.class_name || 'No class'} · Adm. {s.admission_number || '—'}
            </Typography>
            {periods.map((label) => {
              const rows = s.marks.filter((m) => `${m.academic_year} · Term ${m.term}` === label);
              const avg = rows.reduce((t, m) => t + m.percentage, 0) / rows.length;
              return (
                <Box key={label} sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {label} <Chip size="small" sx={{ ml: 1 }} label={`Average ${avg.toFixed(1)}%`} color={avg >= 50 ? 'success' : 'warning'} />
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Learning area</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Score</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>%</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Grade</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rows.map((m, i) => (
                          <TableRow key={i}>
                            <TableCell>{m.learning_area}</TableCell>
                            <TableCell>{m.score}/{m.total}</TableCell>
                            <TableCell>{m.percentage.toFixed(1)}</TableCell>
                            <TableCell>{m.grade || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              );
            })}
          </Paper>
        );
      })}
    </Box>
  );
}
