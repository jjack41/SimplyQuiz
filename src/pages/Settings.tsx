import {
  Container,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';

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
    </Container>
  );
}
