import { createTheme } from '@mui/material/styles';

/* ── Ledger palette ────────────────────────────────────────────────────
 * ink   text & dark surfaces      paper  background
 * gold  primary accent            sage   success
 * rust  error / danger            amber  warning
 * Every page inherits from here — no per-page colour overrides.
 */
const ink = '#1B2A4A';
const ink2 = '#2E3E5C';
const paper = '#FAF8F3';
const paperAlt = '#F1ECDF';
const slate = '#6B7A99';
const line = '#E1D9C4';
const gold = '#C9A227';
const gold2 = '#E4C766';
const sage = '#3E7C59';
const rust = '#B5493A';
const amber = '#B98324';

const theme = createTheme({
  palette: {
    primary: { main: gold, dark: '#A8871F', light: gold2, contrastText: '#231A00' },
    secondary: { main: ink, dark: '#132039', light: ink2, contrastText: '#FFFFFF' },
    success: { main: sage, light: '#DDEBE2', contrastText: '#FFFFFF' },
    error: { main: rust, light: '#F5DFDA', contrastText: '#FFFFFF' },
    warning: { main: amber, light: '#F3E4C6', contrastText: '#231A00' },
    info: { main: slate, light: '#E9EDF4', contrastText: '#FFFFFF' },
    background: { default: paper, paper: '#FFFFFF' },
    text: { primary: ink, secondary: slate, disabled: '#9AA6BF' },
    divider: line,
    ledger: { ink, ink2, paper, paperAlt, line, gold, gold2, sage, rust, amber, slate },
    grade: {
      a: gold, aBg: '#FBF3DA',
      b: sage, bBg: '#DDEBE2',
      c: amber, cBg: '#F3E4C6',
      d: slate, dBg: '#E9EDF4',
      e: rust, eBg: '#F5DFDA',
    },
  },

  typography: {
    fontFamily: '"Inter", system-ui, sans-serif',
    /* numerals, admission numbers and marks */
    mono: { fontFamily: '"IBM Plex Mono", ui-monospace, monospace' },
    h4: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600, letterSpacing: '-0.01em' },
    h5: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600, letterSpacing: '-0.01em' },
    h6: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    overline: { letterSpacing: '0.6px', fontWeight: 700, fontSize: 11 },
    button: { textTransform: 'none', fontWeight: 600 },
  },

  shape: { borderRadius: 12 },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: paper,
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(27,42,74,0.035) 1px, transparent 0)',
          backgroundSize: '22px 22px',
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: `1px solid ${line}`, backgroundImage: 'none' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, minHeight: 40 },
        containedPrimary: { color: '#231A00', '&:hover': { backgroundColor: gold2 } },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          textTransform: 'uppercase', letterSpacing: '0.5px',
          fontSize: 11, fontWeight: 700, color: slate,
          borderBottom: `1px solid ${line}`, backgroundColor: paperAlt,
        },
        body: { borderBottom: `1px solid ${line}`, fontSize: 13.5 },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiAlert: { styleOverrides: { root: { border: `1px solid ${line}`, borderRadius: 10 } } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 8, backgroundColor: '#FFFFFF' } } },
    MuiLinearProgress: { styleOverrides: { root: { backgroundColor: paperAlt, borderRadius: 999 } } },
    MuiDrawer: { styleOverrides: { paper: { borderRight: 'none' } } },
    MuiTooltip: { styleOverrides: { tooltip: { backgroundColor: ink, fontSize: 12 } } },
  },
});

export default theme;
