import { Box } from '@mui/material';
import { bandKey } from '../reportFormat';

/**
 * Grade stamp — a rotated, dashed-ring seal, the signature element of the
 * theme. Colour comes from the performance family, so a card reads at a
 * glance: green exceeding, cyan meeting, amber approaching, red below.
 *
 * Keyed by the leading letters of a grade, which covers both the CBC bands
 * (EE1, ME2 …) and the lettered A–E scales some schools still use.
 */
const BAND = {
  EE: { fg: 'grade.EE', bg: 'grade.EEBg' },
  ME: { fg: 'grade.ME', bg: 'grade.MEBg' },
  AE: { fg: 'grade.AE', bg: 'grade.AEBg' },
  BE: { fg: 'grade.BE', bg: 'grade.BEBg' },
  A:  { fg: 'grade.A', bg: 'grade.ABg' },
  B:  { fg: 'grade.B', bg: 'grade.BBg' },
  C:  { fg: 'grade.C', bg: 'grade.CBg' },
  D:  { fg: 'grade.D', bg: 'grade.DBg' },
  E:  { fg: 'grade.E', bg: 'grade.EBg' },
};

/** 'EE1' → EE, 'B+' → B. Two letters first, so EE never reads as E. */
const bandOf = (key) => BAND[bandKey(key)] || BAND[key[0]] || null;

export default function GradeStamp({ grade, size = 38, title }) {
  const key = String(grade || '').trim().toUpperCase();
  const band = bandOf(key) || { fg: 'text.secondary', bg: 'background.default' };
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
        fontSize: size * 0.3,
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
