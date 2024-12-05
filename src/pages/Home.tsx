import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { UserLevel } from '../components/UserLevel';

const MotionCard = motion(Card);

export default function Home() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<number[]>([]);
  const { user } = useAuthContext();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, [user]); // Recharger les catégories quand l'utilisateur change

  const handleGameClick = async (route: string) => {
    if (!user) {
      navigate('/login', { 
        state: { 
          returnTo: route
        }
      });
      return;
    }

    // Recharger les catégories si nécessaire
    if (categories.length === 0) {
      await loadCategories();
    }

    navigate(route, { 
      state: {
        categories: categories,
        questionCount: 10
      }
    });
  };

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('id')
        .order('name');

      if (error) {
        console.error('Erreur lors du chargement des catégories:', error);
        return;
      }

      if (data) {
        const categoryIds = data.map(cat => cat.id);
        setCategories(categoryIds);
        console.log('Catégories chargées:', categoryIds);
      }
    } catch (err) {
      console.error('Erreur inattendue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const gameTypes = [
    {
      title: 'Mode Classique',
      description: 'Jouez à votre rythme',
      action: () => handleGameClick('/game-classique'),
      icon: '🎮',
      alt: 'Mode Classique'
    },
    {
      title: 'Roue de la Chance',
      description: 'Tentez votre chance',
      action: () => handleGameClick('/roue'),
      icon: '🎡',
      alt: 'Roue de la Chance'
    },
    {
      title: 'Scores',
      description: 'Voir les meilleurs scores',
      action: () => navigate('/scores'),
      icon: '🏆',
      alt: 'Scores'
    }
  ];

  if (isLoading) {
    return (
      <Container 
        maxWidth="lg" 
        sx={{ 
          py: 4,
          height: 'auto',
          minHeight: '100%',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }}
      >
        <Box 
          component="header" 
          sx={{ 
            textAlign: 'center', 
            mb: 4
          }}
        >
          <Typography
            component="h1"
            variant="h2"
            sx={{
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              fontWeight: 'bold',
              color: 'primary.main',
              mb: 2
            }}
          >
            Bienvenue sur SimplyQuiz
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            sx={{
              fontSize: { xs: '1rem', sm: '1.2rem' },
              maxWidth: '800px',
              mx: 'auto'
            }}
          >
            Le quiz multijoueur nouvelle génération
          </Typography>
          {user && <UserLevel />}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        py: 4,
        height: 'auto',
        minHeight: '100%',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': {
          display: 'none'
        }
      }}
    >
      <Box 
        component="header" 
        sx={{ 
          textAlign: 'center', 
          mb: 4
        }}
      >
        <Typography
          component="h1"
          variant="h2"
          sx={{
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
            fontWeight: 'bold',
            color: 'primary.main',
            mb: 2
          }}
        >
          Bienvenue sur SimplyQuiz
        </Typography>
        <Typography
          variant="h5"
          color="text.secondary"
          sx={{
            fontSize: { xs: '1rem', sm: '1.2rem' },
            maxWidth: '800px',
            mx: 'auto'
          }}
        >
          Le quiz multijoueur nouvelle génération
        </Typography>
        {user && <UserLevel />}
      </Box>

      <Grid container spacing={4} justifyContent="center">
        {gameTypes.map((game, index) => (
          <Grid item xs={12} sm={6} md={6} lg={3} key={game.title}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ 
                scale: 1.03,
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
              }}
              whileTap={{ scale: 0.98 }}
              onClick={game.action}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                borderRadius: 2,
                bgcolor: 'background.paper',
                transition: 'all 0.3s ease-in-out',
              }}
            >
              <CardContent sx={{ 
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                p: 3
              }}>
                <Typography 
                  variant="h1" 
                  sx={{ 
                    fontSize: '3rem',
                    mb: 2 
                  }}
                >
                  {game.icon}
                </Typography>
                <Typography 
                  variant="h5" 
                  component="h2" 
                  gutterBottom
                  sx={{
                    fontWeight: 600,
                    mb: 1
                  }}
                >
                  {game.title}
                </Typography>
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ mb: 3, flexGrow: 1 }}
                >
                  {game.description}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  sx={{
                    borderRadius: 2,
                    py: 1,
                    mt: 'auto'
                  }}
                >
                  Jouer
                </Button>
              </CardContent>
            </MotionCard>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
