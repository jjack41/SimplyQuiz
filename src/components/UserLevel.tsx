import { useStats } from '../contexts/StatsContext';
import { LinearProgress } from '@mui/material';
import { Box, Typography } from '@mui/material';

export const UserLevel = () => {
  const { userLevel } = useStats();

  if (!userLevel) {
    return null;
  }

  const progressPercent = Math.min((userLevel.current_xp / userLevel.xp_for_next_level) * 100, 100);

  return (
    <Box 
      sx={{ 
        p: 2, 
        bgcolor: 'background.paper',
        borderRadius: 1,
        boxShadow: 1,
        width: '100%',
        maxWidth: 400,
        margin: 'auto',
        mb: 2
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6">
          Niveau {userLevel.current_level}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {userLevel.current_xp} / {userLevel.xp_for_next_level} XP
        </Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={progressPercent} 
        sx={{ 
          height: 10, 
          borderRadius: 5,
          backgroundColor: 'rgba(25, 118, 210, 0.2)',
          '& .MuiLinearProgress-bar': {
            backgroundColor: '#1976d2',
          }
        }}
      />
    </Box>
  );
};
