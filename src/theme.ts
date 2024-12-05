import { createTheme } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

export const getTheme = (mode: PaletteMode) => createTheme({
  palette: {
    mode,
    primary: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: mode === 'light' ? '#f5f5f5' : '#121212',
      paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
        contained: ({ theme }) => ({
          backgroundColor: theme.palette.mode === 'light' ? '#1976d2' : '#2196f3',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: theme.palette.mode === 'light' ? '#1565c0' : '#1976d2',
          },
        }),
      },
    },
  },
});

export default getTheme('light');
