import { Box } from '@mui/material';

/**
 * Ledger grade stamp — a rotated, dashed-ring seal, the signature element of
 * the theme. Colour comes from the grade band so A–E read at a glance.
 * Bands follow the server's grading_scales: A/EE 80+, B 65+, C 50+, D 40+, E below.
 */
const BAND = {
  A:  { fg: 'grade.a', bg: 'grade.aBg' },
  EE: { fg: 'grade.a', bg: 'grade.aBg' },
  B:  { fg: 'grade.b', bg: 'grade.bBg' },
  C:  { fg: 'grade.c', bg: 'grade.cBg' },
  D:  { fg: 'grade.d', bg: 'grade.dBg' },
  E:  { fg: 'grade.e', bg: 'grade.eBg' },
};

export default function GradeStamp({ grade, size = 38, title }) {
  const key = String(grade || '').trim().toUpperCase();
  const band = BAND[key] || BAND[key[0]] || { fg: 'text.secondary', bg: 'background.default' };
  const empty = !key;

  return (
    <Box
      title={title || (empty ? 'No grade recorded' : `Grade ${key}`)}
      sx={{
        width: size, height: size, flexShrink: 0,
        borderRadius: '50%',
        border: '2px solid', borderColor: empty ? 'divider' : band.fg,
        borderStyle: empty ? 'dashed' : 'solid',
        color: empty ? 'text.disabled' : band.fg,
        bgcolor: empty ? 'transparent' : band.bg,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: (t) => t.typography.mono.fontFamily,
        fontWeight: 700,
        fontSize: size * 0.34,
        transform: 'rotate(-7deg)',
        position: 'relative',
        '&::after': {
          content: '""', position: 'absolute', inset: -4,
          border: '1px dashed currentColor', borderRadius: '50%', opacity: 0.35,
        },
      }}
    >
      {empty ? '—' : key}
    </Box>
  );
}
