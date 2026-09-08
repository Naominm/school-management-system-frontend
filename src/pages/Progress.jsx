import { useEffect, useMemo, useState } from 'react';
import {
  Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  LinearProgress, Stack, Divider, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import api from '../api';
import GradeStamp from '../components/GradeStamp';
import SchoolHeader from '../components/SchoolHeader';
import { useAuthedImage, studentPhotoUrl } from '../branding';
import { subjectCode, bandKey } from '../reportFormat';

/**
 * Academic performance over time, for a learner or their parent.
 *
 * The report card shows one period in full; this shows the shape of several —
 * which subjects are climbing, which are slipping, and how each term's
 * average compares with the last. It carries the card's design so the two
 * read as the same document seen at two ranges.
 */

const BAND_HEX = { EE: '#28B24B', ME: '#2BAADE', AE: '#C77700', BE: '#C0392B' };
const bandHex = (grade) => BAND_HEX[bandKey(grade)] || '#818181';

/** Newest first, the way the API returns them. */
const periodKey = (m) => `${m.academic_year} · Term ${m.term}`;

/* ── Pieces ────────────────────────────────────────────────────────────── */

function Photo({ student, size = 72 }) {
  const src = useAuthedImage(student.has_photo ? studentPhotoUrl(student.id, student.photo_updated_at) : null);
  const initials = `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.toUpperCase();
  return (
    <Box sx={{
      width: size, height: size, flexShrink: 0, borderRadius: 1, overflow: 'hidden',
      border: '1px solid', borderColor: 'divider', bgcolor: 'report.mist',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {src
        ? <Box component="img" src={src} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <Typography sx={{ fontSize: size * 0.32, fontWeight: 600, color: 'primary.main' }}>{initials || '—'}</Typography>}
    </Box>
  );
}

function Tile({ label, value, accent }) {
  return (
    <Box sx={{ flex: 1, minWidth: 116, bgcolor: 'report.mist', borderRadius: 1, py: 1, px: 1.5, textAlign: 'center' }}>
      <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 15, fontWeight: 600, color: accent || 'text.primary', mt: 0.25 }}>{value}</Typography>
    </Box>
  );
}

/**
 * Each term's average as a point on a line — the one view that answers
 * "is this learner improving?" without reading every table.
 */
function TrendLine({ points, height = 110 }) {
  if (points.length < 2) return null;
  const w = 100;
  const step = w / (points.length - 1);
  const y = (pct) => 88 - (pct / 100) * 78;
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${(i * step).toFixed(2)},${y(p.average).toFixed(2)}`).join(' ');

  return (
    <Box>
      <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: 'report.greenDark', mb: 0.5 }}>
        AVERAGE BY PERIOD
      </Typography>
      <svg viewBox={`0 0 ${w} 100`} width="100%" height={height} preserveAspectRatio="none" role="img"
        aria-label="Average percentage by term">
        {[25, 50, 75, 100].map((p) => (
          <line key={p} x1={0} x2={w} y1={y(p)} y2={y(p)} stroke="#E4E5E7" strokeWidth={0.4}
            vectorEffect="non-scaling-stroke" />
        ))}
        <path d={path} fill="none" stroke="#2BAADE" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <circle key={p.label} cx={i * step} cy={y(p.average)} r={1.6} fill="#28B24B">
            <title>{`${p.label}: ${p.average.toFixed(1)}%`}</title>
          </circle>
        ))}
      </svg>
      <Box sx={{ display: 'flex' }}>
        {points.map((p) => (
          <Typography key={p.label} noWrap
            sx={{ flex: 1, textAlign: 'center', fontSize: 9.5, color: 'text.secondary' }}>
            {p.label.replace(' · Term ', ' T')}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

/** The subjects of one period, coloured by band. */
function SubjectChart({ marks, height = 96 }) {
  if (!marks.length) return null;
  const w = 100;
  const slot = w / marks.length;
  const barW = Math.min(slot * 0.6, 6);
  const plot = 78;
  return (
    <Box sx={{ flex: 1, minWidth: 220 }}>
      <svg viewBox={`0 0 ${w} 100`} width="100%" height={height} preserveAspectRatio="none" role="img"
        aria-label="Performance by learning area">
        {[25, 50, 75, 100].map((p) => (
          <line key={p} x1={0} x2={w} y1={plot - (p / 100) * plot} y2={plot - (p / 100) * plot}
            stroke="#E4E5E7" strokeWidth={0.4} vectorEffect="non-scaling-stroke" />
        ))}
        {marks.map((m, i) => {
          const pct = Math.max(0, Math.min(100, m.percentage ?? 0));
          return (
            <rect key={`${m.learning_area}-${i}`} x={slot * i + (slot - barW) / 2} y={plot - (pct / 100) * plot}
              width={barW} height={(pct / 100) * plot} fill={bandHex(m.grade)}>
              <title>{`${m.learning_area}: ${pct.toFixed(0)}%`}</title>
            </rect>
          );
        })}
        <line x1={0} x2={w} y1={plot} y2={plot} stroke="#818181" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
      </svg>
      <Box sx={{ display: 'flex', mt: 0.25 }}>
        {marks.map((m, i) => (
          <Typography key={`${m.learning_area}-code-${i}`} noWrap
            sx={{ flex: 1, textAlign: 'center', fontSize: 8.5, color: 'text.secondary' }}>
            {subjectCode(m.learning_area)}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

/* ── One learner ───────────────────────────────────────────────────────── */

function LearnerProgress({ student, scale }) {
  /* Periods newest first, each with its marks and average. */
  const periods = useMemo(() => {
    const byPeriod = new Map();
    for (const m of student.marks) {
      const k = periodKey(m);
      if (!byPeriod.has(k)) byPeriod.set(k, []);
      byPeriod.get(k).push(m);
    }
    return [...byPeriod].map(([label, marks]) => ({
      label,
      marks,
      average: marks.reduce((t, m) => t + m.percentage, 0) / marks.length,
    }));
  }, [student.marks]);

  const [selected, setSelected] = useState(periods[0]?.label);
  const period = periods.find((p) => p.label === selected) || periods[0];

  if (!periods.length) {
    return (
      <Paper sx={{ p: 3, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Photo student={student} />
          <Box>
            <Typography variant="h6">{student.first_name} {student.last_name}</Typography>
            <Typography variant="body2" color="text.secondary">
              No marks recorded yet.
            </Typography>
          </Box>
        </Stack>
      </Paper>
    );
  }

  const band = scale.find((g) => period.average >= g.min_percentage && period.average <= g.max_percentage);
  const best = [...period.marks].sort((a, b) => b.percentage - a.percentage)[0];
  const weakest = [...period.marks].sort((a, b) => a.percentage - b.percentage)[0];

  /* Movement per subject against the period immediately after this one in the
   * list — the list is newest first, so that is the previous term. */
  const older = periods[periods.indexOf(period) + 1];
  const previous = new Map((older?.marks || []).map((m) => [m.learning_area, m.percentage]));

  const groups = new Map();
  for (const m of period.marks) {
    if (!m.subject_group) continue;
    const g = groups.get(m.subject_group) || { sum: 0, n: 0 };
    g.sum += m.percentage; g.n += 1;
    groups.set(m.subject_group, g);
  }

  return (
    <Paper sx={{ p: 3, mb: 2 }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap', gap: 2 }}>
        <Photo student={student} />
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography variant="h6">{student.first_name} {student.last_name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {student.class_name || 'No class'} · Adm. {student.admission_number || '—'}
          </Typography>
        </Box>
        <ToggleButtonGroup size="small" exclusive value={period.label}
          onChange={(_, v) => v && setSelected(v)}>
          {periods.map((p) => (
            <ToggleButton key={p.label} value={p.label} sx={{ fontSize: 12 }}>
              {p.label.replace(' · Term ', ' T')}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      <Stack direction="row" spacing={1.25} sx={{ mt: 2, flexWrap: 'wrap', gap: 1.25 }}>
        <Tile label="Average" value={`${period.average.toFixed(1)}%`} accent={bandHex(band?.grade)} />
        {band && <Tile label="Performance level" value={band.grade} accent={bandHex(band.grade)} />}
        <Tile label="Learning areas" value={String(period.marks.length)} />
        <Tile label="Strongest" value={best ? subjectCode(best.learning_area) : '—'} accent="report.greenDark" />
        <Tile label="Needs work" value={weakest ? subjectCode(weakest.learning_area) : '—'} accent="warning.main" />
      </Stack>

      <Stack direction="row" spacing={3} sx={{ mt: 2, flexWrap: 'wrap', gap: 3 }}>
        <SubjectChart marks={period.marks} />
        <Box sx={{ flex: 1, minWidth: 220 }}>
          <TrendLine points={[...periods].reverse()} />
        </Box>
      </Stack>

      {groups.size > 0 && (
        <Stack direction="row" spacing={1.25} sx={{ mt: 2, flexWrap: 'wrap', gap: 1.25 }}>
          {[...groups].map(([name, g]) => (
            <Tile key={name} label={name} value={(g.sum / g.n).toFixed(1)} accent="report.greenDark" />
          ))}
        </Stack>
      )}

      <Divider sx={{ my: 2 }} />

      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 560 }}>
          <TableHead>
            <TableRow>
              <TableCell>Learning area</TableCell>
              <TableCell align="center">Score</TableCell>
              <TableCell align="center">%</TableCell>
              <TableCell align="center">Dev.</TableCell>
              <TableCell align="center">Grade</TableCell>
              <TableCell>Comment</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {period.marks.map((m, i) => {
              const was = previous.get(m.learning_area);
              const dev = was == null ? null : m.percentage - was;
              return (
                <TableRow key={`${m.learning_area}-${i}`}>
                  <TableCell sx={{ fontWeight: 500 }}>{m.learning_area}</TableCell>
                  <TableCell align="center">{m.score}/{m.total}</TableCell>
                  <TableCell align="center">{m.percentage.toFixed(1)}</TableCell>
                  <TableCell align="center" sx={{
                    color: dev == null ? 'text.disabled'
                      : (Math.abs(dev) < 0.5 ? 'text.secondary' : (dev > 0 ? 'success.main' : 'error.main')),
                    fontWeight: 500,
                  }}>
                    {dev == null ? '—' : `${dev > 0 ? '+' : ''}${dev.toFixed(0)}`}
                  </TableCell>
                  <TableCell align="center"><GradeStamp grade={m.grade} size={32} /></TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {m.remarks || scale.find((g) => g.grade === m.grade)?.remark || '—'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function Progress() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/progress').then((r) => setData(r.data)).catch(() => setData({ students: [] }));
  }, []);

  if (!data) return <LinearProgress />;

  return (
    <Box>
      <SchoolHeader title="Academic performance" />
      {!data.students.length ? (
        <Typography color="text.secondary">No linked learner records found for your account yet.</Typography>
      ) : (
        data.students.map((s) => (
          <LearnerProgress key={s.id} student={s} scale={data.grading_scale || []} />
        ))
      )}
    </Box>
  );
}
