import { Box, Paper, Typography, Alert } from '@mui/material';
import { useBranding } from '../branding';
import BrandingEditor from '../components/BrandingEditor';
import SchoolHeader from '../components/SchoolHeader';

/** School administrator's view of their own school's logo and theme colour. */
export default function SchoolBranding() {
  const { branding, refresh } = useBranding();

  return (
    <Box>
      <SchoolHeader title="School branding" />
      {!branding ? (
        <Alert severity="info">No school is linked to this account.</Alert>
      ) : (
        <Paper sx={{ p: 3, maxWidth: 720 }}>
          <Typography variant="subtitle2" gutterBottom>Logo and theme colour</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            The logo appears on the sidebar, at the head of every page, on the merit list and
            report cards, and as the watermark on every exported PDF. The theme colour drives
            buttons and highlights across the system.
          </Typography>
          <BrandingEditor school={{ ...branding, has_logo: branding.has_logo }} onSaved={refresh} />
        </Paper>
      )}
    </Box>
  );
}
