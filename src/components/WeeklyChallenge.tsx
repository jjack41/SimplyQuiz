import { Card, CardContent, Typography, Button, Box, LinearProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const MotionCard = motion(Card);

export function WeeklyChallenge() {
  const navigate = useNavigate();
  const progress = 0; // À remplacer par la vraie progression
  const totalQuestions = 100;
  const remainingTime = "2j 6h"; // À remplacer par le vrai temps restant

  return (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ 
        scale: 1.02,
        boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
      }}
      whileTap={{ scale: 0.98 }}
      sx={{
        width: '100%',
        height: '100%',
        borderRadius: 2,
        bgcolor: 'background.paper',
        transition: 'all 0.3s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ 
        p: 2, 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'space-between'
      }}>
        <Box>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, fontSize: '1.2rem' }}>
            Défis
          </Typography>
          
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem' }}>
              Défi hebdomadaire
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: '0.9rem' }}>
              {remainingTime} restants
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.9rem' }}>
              Répondez à {totalQuestions} questions cette semaine
            </Typography>
            
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: '0.9rem' }}>
                Progression: {progress}/{totalQuestions}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(progress / totalQuestions) * 100}
                sx={{ 
                  height: 6,
                  borderRadius: 3,
                }}
              />
            </Box>
          </Box>
        </Box>

        <Button
          variant="contained"
          color="primary"
          fullWidth
          size="medium"
          onClick={() => navigate('/game-classique')}
          sx={{
            borderRadius: 2,
            py: 0.8,
            mt: 'auto',
            fontSize: '0.9rem'
          }}
        >
          Jouer maintenant
        </Button>
      </CardContent>
    </MotionCard>
  );
}
