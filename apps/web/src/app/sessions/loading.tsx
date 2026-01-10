import { Box, CircularProgress, Typography } from '@mui/material';

export default function SessionsLoading() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 2,
      }}
    >
      <CircularProgress size={48} />
      <Typography color="text.secondary">Loading sessions...</Typography>
    </Box>
  );
}
