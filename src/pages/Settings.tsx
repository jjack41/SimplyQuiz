import {
  Container,
  Typography,
  Paper,
  Box,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import { MediaStorage } from '../components/MediaStorage';

export default function Settings() {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Paramètres
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Mode sombre
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={darkMode}
              onChange={toggleDarkMode}
              name="darkModeSwitch"
            />
          }
          label={darkMode ? 'Désactiver' : 'Activer'}
        />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Stockage des médias
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Gérez le stockage de vos médias (images, vidéos, audio) pour une meilleure performance
          et un accès hors ligne.
        </Typography>
        <Box sx={{ mt: 2 }}>          
          <MediaStorage />
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Apparence
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Personnalisez l'apparence de l'application selon vos préférences.
        </Typography>
        {/* Autres paramètres d'apparence à ajouter ici */}
      </Paper>
    </Container>
  );
}
