import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { getTheme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { GameProvider } from './contexts/GameContext';
import { StatsProvider } from './contexts/StatsContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Categories from './pages/Categories';
import Questions from './pages/Questions';
import ResetPassword from './pages/ResetPassword';
import GameClassique from './pages/GameClassique';
import Scores from './pages/Scores';
import Profile from './pages/Profile';
import RouePage from './pages/RouePage';
import Settings from './pages/Settings';
import { Toaster } from 'react-hot-toast';


const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'scores',
        element: <Scores />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
      {
        path: 'categories',
        element: <Categories />,
      },
      {
        path: 'questions',
        element: <Questions />,
      },
      {
        path: 'reset-password',
        element: <ResetPassword />,
      },
      {
        path: 'game-classique',
        element: <GameClassique />,
      },
      {
        path: 'roue',
        element: <RouePage />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
]);

function AppContent() {
  const { darkMode } = useTheme();
  const theme = getTheme(darkMode ? 'dark' : 'light');

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster position="top-right" />
     <RouterProvider router={router} />
    </MuiThemeProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StatsProvider>
          <GameProvider>
            <AppContent />
          </GameProvider>
        </StatsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
