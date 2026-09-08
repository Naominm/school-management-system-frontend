import { createTheme } from '@mui/material/styles';

/* ── Brand palette ─────────────────────────────────────────────────────
 * One identity for the product and everything it prints.
 *
 * petrol  structure — the sidebar, title bands, the spine, headline figures
 * teal    interaction — buttons, links, active states, a sound pass
 * gold    achievement — distinction, the crest rule, the motto blocks
 * ink     text          mist/cloud  table fills and page ground
 *
 * Every page inherits from here. There is no per-school override: a school
 * shows its identity through its crest, not by recolouring the product, so a
 * document produced by one school is recognisable as the same document a
 * parent at another school receives.
 */
const petrol = '#023B4A';
const petrolDeep = '#012B37';
const ink = '#131313';
const ink2 = '#333333';
const slate = '#818181';
/* Text on the petrol ground. Contrast measured against the lighter end of
 * the gradient, which is the worst case. */
const onPetrol = '#E8F1F4';        // primary text     10.6:1  AAA
const onPetrolMuted = '#B3C9D1';   // labels and icons  7.1:1  AAA
const onPetrolFaint = '#8FAEB9';   // captions, roles   5.2:1  AA

const mist = '#F5F7FA';
const cloud = '#E4E5E7';
/* The performance ramp, matching the printed bands exactly: gold marks
 * distinction, teal a sound pass, ochre and clay the two below it. */
const gold = '#B07D1A';
const goldSoft = '#F7EEDA';
const teal = '#0F6E7E';
const tealSoft = '#E2F0F2';
const ochre = '#C1651A';
const ochreSoft = '#FBEADC';
const clay = '#A32E2E';
const claySoft = '#F7E4E4';



/** Build the theme. One brand, no arguments — see the note above. */
export function buildTheme() {
  return createTheme({
    palette: {
      /* teal, not petrol, carries interaction: petrol is the structural dark
       * and would make every button read as near-black. teal is 5.91:1 on
       * white, so it works as a link, a label and an icon alike. */
      primary: { main: teal, dark: petrol, light: tealSoft, contrastText: '#FFFFFF' },
      secondary: { main: gold, dark: '#8C6215', light: goldSoft, contrastText: '#FFFFFF' },
      success: { main: teal, light: tealSoft, dark: petrol, contrastText: '#FFFFFF' },
      error: { main: clay, light: claySoft, contrastText: '#FFFFFF' },
      warning: { main: ochre, light: ochreSoft, contrastText: '#FFFFFF' },
      info: { main: petrol, light: tealSoft, contrastText: '#FFFFFF' },
      background: { default: '#FFFFFF', paper: '#FFFFFF' },
      text: { primary: ink, secondary: slate, disabled: '#A8ADB4' },
      divider: cloud,
      report: {
        ink, ink2, slate, mist, cloud,
        petrol, petrolDeep, onPetrol, onPetrolMuted, onPetrolFaint,
        gold, goldSoft, teal, tealSoft, ochre, ochreSoft, clay, claySoft,
      },

      /* The four CBC performance families, and the A–E fallback for schools
       * still on a lettered scale. Keyed by the leading letters of a grade so
       * `grade[bandOf(g)]` resolves for either scheme. */
      grade: {
        EE: gold, EEBg: goldSoft,
        ME: teal, MEBg: tealSoft,
        AE: ochre, AEBg: ochreSoft,
        BE: clay, BEBg: claySoft,
        A: gold, ABg: goldSoft,
        B: teal, BBg: tealSoft,
        C: ochre, CBg: ochreSoft,
        D: ochre, DBg: ochreSoft,
        E: clay, EBg: claySoft,
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
          containedPrimary: { color: '#FFFFFF', '&:hover': { backgroundColor: petrol } },
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
      MuiDrawer: { styleOverrides: { paper: { borderRight: 'none' } } },
      MuiTooltip: { styleOverrides: { tooltip: { backgroundColor: ink, fontSize: 12 } } },
    },
  });
}

const theme = buildTheme();
export default theme;
