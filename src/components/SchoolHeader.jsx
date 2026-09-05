import { Box, Typography } from '@mui/material';
import { useBranding } from '../branding';

/**
 * The school's identity at the top of a page: logo, name and motto.
 * Falls back to the school code on its theme colour when no logo is set.
 */
export default function SchoolHeader({ title, subtitle, right }) {
  const { branding, logoUrl } = useBranding();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
      {logoUrl ? (
        <Box component="img" src={logoUrl} alt={branding?.name || 'School logo'}
          sx={{ height: 52, width: 52, objectFit: 'contain', borderRadius: '10px',
                bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', p: 0.5 }} />
      ) : (
        <Box sx={{ height: 52, width: 52, borderRadius: '10px', flexShrink: 0,
                   bgcolor: branding?.crest_colour || 'primary.main', color: '#fff',
                   display: 'flex', alignItems: 'center', justifyContent: 'center',
                   fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700 }}>
          {branding?.code || 'SM'}
        </Box>
      )}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="h5" sx={{ lineHeight: 1.2 }}>{title}</Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {branding?.name || ''}{subtitle ? ` · ${subtitle}` : ''}
        </Typography>
      </Box>
      {right}
    </Box>
  );
}
