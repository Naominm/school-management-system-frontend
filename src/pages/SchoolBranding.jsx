import { Box, Paper, Typography, Alert, Stack } from '@mui/material';
import { useBranding } from '../branding';
import BrandingEditor from '../components/BrandingEditor';
import ReportCardSetup from '../components/ReportCardSetup';
import SchoolHeader from '../components/SchoolHeader';

/**
 * The school administrator's view of everything that gives their school's
 * documents an identity: the crest and colour, the contact block and motto
 * printed on report cards, and the scale those cards are graded against.
 */
export default function SchoolBranding() {
  const { branding, refresh } = useBranding();

  return (
    <Box>
      <SchoolHeader title="School branding" />
      {!branding ? (
        <Alert severity="info">No school is linked to this account.</Alert>
      ) : (
        <Stack spacing={2} sx={{ maxWidth: 860 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle2" gutterBottom>Identity</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              The logo appears on the sidebar, at the head of every page and on every printed
              document. The address, telephone and email are printed under the crest on report
              cards, and the motto runs along the footer band. The theme colour drives buttons
              and highlights across the system and the title bands on printed documents.
            </Typography>
            <BrandingEditor school={{ ...branding, has_logo: branding.has_logo }} onSaved={refresh} />
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle2" gutterBottom>Report card setup</Typography>
            <ReportCardSetup />
          </Paper>
        </Stack>
      )}
    </Box>
  );
}
