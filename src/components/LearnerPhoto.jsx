import { Box, Typography } from '@mui/material';
import { useAuthedImage, studentPhotoUrl } from '../branding';

/**
 * A learner's passport photo, wherever a learner is shown — the report card,
 * the performance page, the register, the merit list.
 *
 * Photos need a bearer token, which a plain `<img>` cannot send, so the image
 * is fetched and handed over as data. Until it arrives, and for a learner who
 * has none, this shows their initials rather than a broken image or a gap.
 */
export default function LearnerPhoto({ student, size = 40, rounded = false }) {
  const hasPhoto = student?.has_photo ?? Boolean(student?.photo_updated_at);
  const src = useAuthedImage(hasPhoto ? studentPhotoUrl(student.id, student.photo_updated_at) : null);
  const initials = `${student?.first_name?.[0] || ''}${student?.last_name?.[0] || ''}`.toUpperCase();

  return (
    <Box
      title={student ? `${student.first_name} ${student.last_name}` : undefined}
      sx={{
        width: size, height: size, flexShrink: 0, overflow: 'hidden',
        borderRadius: rounded ? '50%' : 1,
        border: '1px solid', borderColor: 'divider', bgcolor: 'report.mist',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {src
        ? <Box component="img" src={src} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : (
          <Typography sx={{ fontSize: Math.max(10, size * 0.32), fontWeight: 600, color: 'primary.main', lineHeight: 1 }}>
            {initials || '—'}
          </Typography>
        )}
    </Box>
  );
}
