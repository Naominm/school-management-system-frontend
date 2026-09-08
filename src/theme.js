import { createTheme } from '@mui/material/styles';

/* ── Report palette ────────────────────────────────────────────────────
 * Taken from the printed CBC report card, so a page on screen and the
 * document it produces are recognisably the same thing.
 *
 * cyan   primary — title bands, footer rule, active navigation
 * green  achievement — passing bands, positive deltas, the crest rule
 * ink    text          mist/cloud  table fills and page ground
 *
 * Every page inherits from here — no per-page colour overrides.
 */
const cyan = '#2BAADE';
const cyanDark = '#1D8CBA';
const cyanSoft = '#E6F5FB';
const green = '#28B24B';
const greenDark = '#34833A';
const greenSoft = '#E4F6E9';
const ink = '#131313';
const ink2 = '#333333';
const slate = '#818181';
const mist = '#F5F7FA';
const cloud = '#E4E5E7';
const amber = '#C77700';
const amberSoft = '#FCF0DC';
const rust = '#C0392B';
const rustSoft = '#FBE6E3';

/**
 * Build the theme, optionally overriding the accent with a school's colour.
 * A school that has chosen its own crest colour keeps it; everything else —
 * the achievement green, the neutrals, the type — stays constant so the
 * documents remain legible whatever accent a school picks.
 */
export function buildTheme(accent) {
  const brand = /^#[0-9a-fA-F]{6}$/.test(accent || '') ? accent : cyan;
  return createTheme({
    palette: {
      primary: { main: brand, dark: cyanDark, light: cyanSoft, contrastText: '#FFFFFF' },
      secondary: { main: green, dark: greenDark, light: greenSoft, contrastText: '#FFFFFF' },
      success: { main: green, light: greenSoft, dark: greenDark, contrastText: '#FFFFFF' },
      error: { main: rust, light: rustSoft, contrastText: '#FFFFFF' },
      warning: { main: amber, light: amberSoft, contrastText: '#FFFFFF' },
      info: { main: cyan, light: cyanSoft, contrastText: '#FFFFFF' },
      background: { default: '#FFFFFF', paper: '#FFFFFF' },
      text: { primary: ink, secondary: slate, disabled: '#A8ADB4' },
      divider: cloud,
      report: { cyan, cyanDark, cyanSoft, green, greenDark, greenSoft, ink, ink2, slate, mist, cloud },

      /* The four CBC performance families, and the A–E fallback for schools
       * still on a lettered scale. Keyed by the leading letters of a grade so
       * `grade[bandOf(g)]` resolves for either scheme. */
      grade: {
        EE: green, EEBg: greenSoft,
        ME: cyan, MEBg: cyanSoft,
        AE: amber, AEBg: amberSoft,
        BE: rust, BEBg: rustSoft,
        A: green, ABg: greenSoft,
        B: cyan, BBg: cyanSoft,
        C: amber, CBg: amberSoft,
        D: amber, DBg: amberSoft,
        E: rust, EBg: rustSoft,
      },
    },

    typography: {
      fontFamily: '"Poppins", system-ui, -apple-system, "Segoe UI", sans-serif',
      /* numerals, admission numbers and marks */
      mono: { fontFamily: '"IBM Plex Mono", ui-monospace, monospace' },
      h4: { fontWeight: 600, letterSpacing: '-0.01em' },
      h5: { fontWeight: 600, letterSpacing: '-0.01em' },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      overline: { letterSpacing: '0.6px', fontWeight: 600, fontSize: 11 },
      button: { textTransform: 'none', fontWeight: 500 },
    },

    shape: { borderRadius: 10 },

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { backgroundColor: mist },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: { border: `1px solid ${cloud}`, backgroundImage: 'none' },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 8, minHeight: 40 },
          containedPrimary: { color: '#FFFFFF', '&:hover': { backgroundColor: cyanDark } },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            textTransform: 'uppercase', letterSpacing: '0.5px',
            fontSize: 11, fontWeight: 600, color: slate,
            borderBottom: `1px solid ${cloud}`, backgroundColor: '#FFFFFF',
          },
          body: { borderBottom: `1px solid ${cloud}`, fontSize: 13.5, color: ink2 },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: { '&:nth-of-type(odd) td': { backgroundColor: mist } },
        },
      },
      MuiChip: { styleOverrides: { root: { fontWeight: 500, borderRadius: 6 } } },
      MuiAlert: { styleOverrides: { root: { border: `1px solid ${cloud}`, borderRadius: 10 } } },
      MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 8, backgroundColor: '#FFFFFF' } } },
      MuiLinearProgress: { styleOverrides: { root: { backgroundColor: mist, borderRadius: 999 } } },
      MuiDrawer: { styleOverrides: { paper: { borderRight: `1px solid ${cloud}` } } },
      MuiTooltip: { styleOverrides: { tooltip: { backgroundColor: ink, fontSize: 12 } } },
    },
  });
}

const theme = buildTheme();
export default theme;
