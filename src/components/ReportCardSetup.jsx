import { useEffect, useState } from 'react';
import {
  Box, Button, Stack, Typography, Alert, Table, TableHead, TableRow, TableCell, TableBody, Chip,
} from '@mui/material';
import api from '../api';
import { rangeLabel } from '../reportFormat';

/**
 * The two settings a report card needs beyond marks: the scale it is graded
 * against, and how learning areas group into strands.
 *
 * Both have one-click defaults — the eight CBC performance bands, and a
 * grouping matched from subject names — because typing eight bands and
 * tagging every subject by hand is the kind of setup that never gets done,
 * and a card without them loses its points tiles and strand averages.
 */
export default function ReportCardSetup() {
  const [scale, setScale] = useState([]);
  const [areas, setAreas] = useState([]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  async function refresh() {
    const [s, a] = await Promise.all([
      api.get('/grading-scales').catch(() => ({ data: [] })),
      api.get('/learning-areas').catch(() => ({ data: [] })),
    ]);
    setScale(s.data);
    setAreas(a.data);
  }

  useEffect(() => { refresh(); }, []);

  async function run(what, request, message) {
    setBusy(what); setError(''); setOk('');
    try {
      const { data } = await request();
      setOk(message(data));
      await refresh();
    } catch (e) {
      setError(e.response?.data?.error || 'That did not work. Please try again.');
    } finally { setBusy(''); }
  }

  const usesPoints = scale.some((g) => g.points > 0);
  const ungrouped = areas.filter((a) => !a.subject_group);

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError('')}>{error}</Alert>}
      {ok && <Alert severity="success" sx={{ mb: 1.5 }} onClose={() => setOk('')}>{ok}</Alert>}

      <Typography variant="subtitle2" gutterBottom>Grading scale</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        The bands printed in the grade descriptors on every report card. CBC bands carry points,
        which is what the Total Points and Mean Points tiles add up.
        {!usesPoints && scale.length > 0 && ' Your current scale carries no points, so those tiles are left off the card.'}
      </Typography>

      {scale.length > 0 && (
        <Box sx={{ overflowX: 'auto', mb: 1.5 }}>
          <Table size="small" sx={{ minWidth: 480 }}>
            <TableHead>
              <TableRow>
                <TableCell>Grade</TableCell>
                <TableCell align="center">Range</TableCell>
                <TableCell align="center">Points</TableCell>
                <TableCell>Remark</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scale.map((g) => (
                <TableRow key={g.id ?? g.grade}>
                  <TableCell sx={{ fontWeight: 600 }}>{g.grade}</TableCell>
                  <TableCell align="center">{rangeLabel(g.min_percentage, g.max_percentage)}%</TableCell>
                  <TableCell align="center">{g.points || '—'}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{g.remark || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      <Button variant="outlined" disabled={busy === 'cbc'}
        onClick={() => run('cbc',
          () => api.post('/grading-scales/apply-cbc'),
          (d) => `Applied the ${d.applied} CBC performance bands.`)}>
        {busy === 'cbc' ? 'Applying…' : 'Apply the CBC performance bands'}
      </Button>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
        Replaces this school&apos;s scale with EE1–BE2 (85–100 down to 0–12), each carrying 8 to 1 points.
        Marks already recorded are re-graded against the new bands when a card is next drawn.
      </Typography>

      <Typography variant="subtitle2" sx={{ mt: 3 }} gutterBottom>Learning area groups</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Subjects are averaged by strand — STEM, Languages, Social Sciences, Art and Sport Science —
        in the row under the marks table. Ungrouped subjects still appear in the table; they are
        simply left out of that row.
      </Typography>

      <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
        {areas.map((a) => (
          <Chip key={a.id} size="small" label={a.subject_group ? `${a.name} · ${a.subject_group}` : a.name}
            color={a.subject_group ? 'primary' : 'default'}
            variant={a.subject_group ? 'filled' : 'outlined'} />
        ))}
        {!areas.length && <Typography variant="body2" color="text.secondary">No learning areas yet.</Typography>}
      </Stack>

      <Button variant="outlined" disabled={busy === 'group' || !ungrouped.length}
        onClick={() => run('group',
          () => api.post('/learning-areas/group'),
          (d) => (d.grouped
            ? `Grouped ${d.grouped} learning ${d.grouped === 1 ? 'area' : 'areas'}.${d.ungrouped ? ` ${d.ungrouped} could not be matched by name — set those on the learning area itself.` : ''}`
            : 'None of the remaining learning areas could be matched by name.'))}>
        {busy === 'group' ? 'Sorting…' : `Group ${ungrouped.length || ''} remaining ${ungrouped.length === 1 ? 'subject' : 'subjects'}`.replace(/\s+/g, ' ')}
      </Button>
    </Box>
  );
}
