import { Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Stack, Divider } from '@mui/material';
import { useBranding, useAuthedImage, teacherSignatureUrl } from '../branding';
import GradeStamp from './GradeStamp';
import LearnerPhoto from './LearnerPhoto';
import { subjectCode, bandKey, rangeLabel } from '../reportFormat';

/**
 * The report card, on screen.
 *
 * Deliberately the same design as the printed page — the same spine, period
 * band, tiles, chart and descriptor table — so what a parent reads here and
 * what the school hands them are recognisably one document. Both are drawn
 * from the same server payload, so the numbers cannot drift apart.
 */

const bandColour = (grade) => ({
  EE: 'grade.EE', ME: 'grade.ME', AE: 'grade.AE', BE: 'grade.BE',
}[bandKey(grade)] || 'text.secondary');

/* ── Header ────────────────────────────────────────────────────────────── */

function Crest({ school, logoUrl }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, pt: 2, pb: 1 }}>
      {logoUrl
        ? <Box component="img" src={logoUrl} alt="" sx={{ width: 56, height: 56, objectFit: 'contain' }} />
        : <Box sx={{ width: 56, height: 56 }} />}
      <Box sx={{ flex: 1, textAlign: 'center' }}>
        <Typography sx={{ fontWeight: 600, fontSize: 16, color: 'report.petrol', letterSpacing: '0.02em' }}>
          {(school?.name || 'School').toUpperCase()}
        </Typography>
        {[school?.address && `Address: ${school.address}`,
          school?.phone && `Tel: ${school.phone}`,
          school?.email && `Email: ${school.email}`]
          .filter(Boolean)
          .map((line) => (
            <Typography key={line} sx={{ fontSize: 12 }}>{line}</Typography>
          ))}
      </Box>
      <Box sx={{ width: 56 }} />
    </Box>
  );
}

/* ── Learner block ─────────────────────────────────────────────────────── */

/**
 * A column per learning area, coloured by band. Plain SVG: it is a handful of
 * rectangles, and a charting library would be more weight than the picture.
 */
function SubjectChart({ marks, height = 96 }) {
  if (!marks.length) return null;
  const w = 100;                       // viewBox units; the SVG scales to fit
  const slot = w / marks.length;
  const barW = Math.min(slot * 0.6, 6);
  const plot = 78;                     // leaves room for the subject codes

  return (
    <Box sx={{ flex: 1, minWidth: 200 }}>
      <svg viewBox={`0 0 ${w} 100`} width="100%" height={height} preserveAspectRatio="none" role="img"
        aria-label="Performance by learning area">
        {[25, 50, 75, 100].map((p) => (
          <line key={p} x1={0} x2={w} y1={plot - (p / 100) * plot} y2={plot - (p / 100) * plot}
            stroke="#E4E5E7" strokeWidth={0.4} vectorEffect="non-scaling-stroke" />
        ))}
        {marks.map((m, i) => {
          const pct = Math.max(0, Math.min(100, m.percentage ?? 0));
          const h = (pct / 100) * plot;
          return (
            <rect key={m.id ?? i} x={slot * i + (slot - barW) / 2} y={plot - h} width={barW} height={h}
              fill={{ EE: '#B07D1A', ME: '#0F6E7E', AE: '#C1651A', BE: '#A32E2E',
              A: '#B07D1A', B: '#0F6E7E', C: '#C1651A', D: '#C1651A', E: '#A32E2E' }[bandKey(m.grade)] || '#818181'}>
              <title>{`${m.learning_area}: ${pct.toFixed(0)}%`}</title>
            </rect>
          );
        })}
        <line x1={0} x2={w} y1={plot} y2={plot} stroke="#818181" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
      </svg>
      <Box sx={{ display: 'flex', mt: 0.25 }}>
        {marks.map((m, i) => (
          <Typography key={m.id ?? i} noWrap
            sx={{ flex: 1, textAlign: 'center', fontSize: 8.5, color: 'text.secondary' }}>
            {subjectCode(m.learning_area)}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

/* ── Tiles ─────────────────────────────────────────────────────────────── */

function Tile({ label, value, accent }) {
  return (
    <Box sx={{ flex: 1, minWidth: 120, bgcolor: 'report.mist', borderRadius: 1, py: 1, px: 1.5, textAlign: 'center' }}>
      <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 15, fontWeight: 600, color: accent || 'text.primary', mt: 0.25 }}>
        {value}
      </Typography>
    </Box>
  );
}

function Tiles({ student }) {
  const level = student.performance_level;
  return (
    <Stack direction="row" spacing={1.25} sx={{ flexWrap: 'wrap', gap: 1.25 }}>
      <Tile label="Performance level" accent={level ? bandColour(level.grade) : undefined}
        value={level ? `${level.grade} (${level.band})` : '—'} />
      <Tile label="Total marks"
        value={student.total_marks?.out_of ? `${Math.round(student.total_marks.scored)}/${Math.round(student.total_marks.out_of)}` : '—'} />
      {student.total_points
        ? <Tile label="Total points" value={`${student.total_points.scored}/${student.total_points.out_of}`} />
        : <Tile label="Average" value={student.average_percentage != null ? `${student.average_percentage.toFixed(1)}%` : '—'} />}
      {student.mean_points != null
        ? <Tile label="Mean points" value={String(student.mean_points)} />
        : <Tile label="Position" value={student.position ? `${student.position} of ${student.position_of}` : '—'} />}
    </Stack>
  );
}

/* ── Movement ──────────────────────────────────────────────────────────── */

/** Change since the previous term, in percentage points. */
function Dev({ value }) {
  if (value == null) return <Typography component="span" sx={{ fontSize: 13, color: 'text.disabled' }}>—</Typography>;
  const flat = Math.abs(value) < 0.5;
  return (
    <Typography component="span" sx={{
      fontSize: 13, fontWeight: 500,
      color: flat ? 'text.secondary' : (value > 0 ? 'success.main' : 'error.main'),
    }}>
      {flat ? '0' : `${value > 0 ? '+' : ''}${value.toFixed(0)}`}
    </Typography>
  );
}

/* ── Remarks ───────────────────────────────────────────────────────────── */

function Remark({ title, staff, text }) {
  const sig = useAuthedImage(staff?.has_signature ? teacherSignatureUrl(staff.id, staff.signature_updated_at) : null);
  return (
    <Box sx={{ flex: 1, minWidth: 260 }}>
      <Box sx={{ bgcolor: 'report.mist', px: 1.5, py: 0.75, borderRadius: 1 }}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>
          {[title, staff?.name].filter(Boolean).join(': ')}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: 12.5, mt: 1, minHeight: 48 }}>
        {text || 'No remark recorded for this period.'}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mt: 1 }}>
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Signature:</Typography>
        {sig
          ? <Box component="img" src={sig} alt="" sx={{ height: 28, objectFit: 'contain' }} />
          : <Box sx={{ flex: 1, maxWidth: 160, borderBottom: '1px solid', borderColor: 'divider', mb: 0.5 }} />}
      </Box>
    </Box>
  );
}

/* ── Grade descriptors ─────────────────────────────────────────────────── */

function Descriptors({ scale, bands }) {
  if (!scale?.length) return null;
  const families = (bands || [])
    .map((b) => ({ ...b, span: scale.filter((g) => b.grades.includes(g.grade)).length }))
    .filter((b) => b.span > 0);
  const usesPoints = scale.some((g) => g.points > 0);

  const rows = [
    ['Level', families.length
      ? families.map((b) => ({ text: b.label, span: b.span }))
      : scale.map((g) => ({ text: g.remark || g.grade, span: 1 }))],
    ['Performance', scale.map((g) => ({ text: g.grade, span: 1 }))],
    ...(usesPoints ? [['Points', scale.map((g) => ({ text: String(g.points), span: 1 }))]] : []),
    ['Range (%)', scale.map((g) => ({ text: rangeLabel(g.min_percentage, g.max_percentage), span: 1 }))],
  ];

  return (
    <Box>
      <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: 'report.petrol', mb: 0.75 }}>
        GRADE DESCRIPTORS
      </Typography>
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{
          minWidth: 560,
          '& td': { fontSize: 11.5, textAlign: 'center', py: 0.5, border: '1px solid', borderColor: 'divider' },
          '& tr:nth-of-type(odd) td': { bgcolor: 'transparent' },
        }}>
          <TableBody>
            {rows.map(([name, cells]) => (
              <TableRow key={name}>
                <TableCell sx={{ bgcolor: 'report.mist', fontWeight: 600, textAlign: 'left !important', width: 112 }}>
                  {name}
                </TableCell>
                {cells.map((c, i) => (
                  <TableCell key={`${name}-${i}`} colSpan={c.span}>{c.text}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
}

/* ── The card ──────────────────────────────────────────────────────────── */

export default function ReportCardView({ card, student, headerRight }) {
  const { logoUrl } = useBranding();
  const school = card?.school;
  const period = ['Academic Report Form', student.class_name, `Term ${card.term}`, `(${card.academic_year})`]
    .filter(Boolean).join('  -  ');

  return (
    <Paper sx={{ overflow: 'hidden', position: 'relative' }}>
      {/* The spine, as on the printed page. */}
      <Box sx={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 8,
        background: (t) => `linear-gradient(180deg, ${t.palette.report.gold} 0 64px, ${t.palette.report.petrol} 64px 100%)`,
      }} />
      <Box sx={{ pl: 2 }}>
        <Crest school={school} logoUrl={logoUrl} />

        <Box sx={{ bgcolor: 'report.petrol', py: 0.75, px: 2 }}>
          <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: 13, textAlign: 'center', letterSpacing: '0.02em' }}>
            {period.toUpperCase()}
          </Typography>
        </Box>

        <Box sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
            <LearnerPhoto student={student} size={96} />
            <Box sx={{ minWidth: 180 }}>
              <Typography sx={{ fontWeight: 600, fontSize: 15 }}>
                {`${student.first_name} ${student.last_name}`.toUpperCase()}
              </Typography>
              <Typography sx={{ fontSize: 12.5, mt: 0.5 }}>
                <Box component="span" sx={{ color: 'report.petrol', fontWeight: 600 }}>ADMNO: </Box>
                {student.admission_number || '—'}
              </Typography>
              <Typography sx={{ fontSize: 12.5 }}>
                <Box component="span" sx={{ color: 'report.petrol', fontWeight: 600 }}>GRADE: </Box>
                {student.class_name || 'No class'}
              </Typography>
              {student.position && (
                <Typography sx={{ fontSize: 12.5 }}>
                  <Box component="span" sx={{ color: 'report.petrol', fontWeight: 600 }}>POSITION: </Box>
                  {student.position} of {student.position_of}
                </Typography>
              )}
              {headerRight}
            </Box>
            <SubjectChart marks={student.marks} />
          </Stack>

          <Box sx={{ mt: 2 }}><Tiles student={student} /></Box>

          <Box sx={{ mt: 2, overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 640 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Learning areas</TableCell>
                  <TableCell align="center">Marks</TableCell>
                  <TableCell align="center">Dev.</TableCell>
                  <TableCell align="center">Grade</TableCell>
                  <TableCell>Comment</TableCell>
                  <TableCell>Teacher</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {student.marks.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell sx={{ fontWeight: 500 }}>{m.learning_area}</TableCell>
                    <TableCell align="center">{m.percentage != null ? `${m.percentage.toFixed(0)}%` : '—'}</TableCell>
                    <TableCell align="center"><Dev value={m.dev} /></TableCell>
                    <TableCell align="center"><GradeStamp grade={m.grade} size={32} /></TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{m.remarks || '—'}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{m.teacher || '—'}</TableCell>
                  </TableRow>
                ))}
                {!student.marks.length && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography color="text.secondary" sx={{ py: 1 }}>No marks recorded for this period.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>

          {student.group_averages?.length > 0 && (
            <Stack direction="row" spacing={1.25} sx={{ mt: 2, flexWrap: 'wrap', gap: 1.25 }}>
              {student.group_averages.map((g) => (
                <Tile key={g.group} label={g.group}
                  value={g.average != null ? g.average.toFixed(1) : '—'} accent="report.petrol" />
              ))}
            </Stack>
          )}

          <Divider sx={{ my: 2 }} />

          <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', gap: 3 }}>
            <Remark title="Class Teacher Remarks" staff={student.class_teacher}
              text={student.comments?.class_teacher_comment} />
            <Remark title="Principal Remarks" staff={student.headteacher}
              text={student.comments?.headteacher_comment} />
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Descriptors scale={card.grading_scale} bands={card.bands} />

          <Typography sx={{ fontSize: 11.5, color: 'text.secondary', mt: 2 }}>
            Verification code <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {student.verification_code}
            </Box>
            {school?.motto ? ` · ${school.motto}` : ''}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
