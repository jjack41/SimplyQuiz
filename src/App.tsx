import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, CssBaseline, CircularProgress, Box } from '@mui/material';
import { getTheme } from './theme';
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
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
import UserManagement from './pages/UserManagement';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute } from './components/ProtectedRoute';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <ProtectedRoute requiredPermission="home"><Home /></ProtectedRoute>,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'reset-password',
        element: <ResetPassword />,
      },
      {
        path: 'scores',
        element: <ProtectedRoute requiredPermission="score"><Scores /></ProtectedRoute>,
      },
      {
        path: 'profile',
        element: <ProtectedRoute requiredPermission="profile"><Profile /></ProtectedRoute>,
      },
      {
        path: 'categories',
        element: <ProtectedRoute requiredPermission="category"><Categories /></ProtectedRoute>,
      },
      {
        path: 'questions',
        element: <ProtectedRoute requiredPermission="question"><Questions /></ProtectedRoute>,
      },
      {
        path: 'game-classique',
        element: <ProtectedRoute requiredPermission="classic-game"><GameClassique /></ProtectedRoute>,
      },
      {
        path: 'settings',
        element: <ProtectedRoute requiredPermission="setting"><Settings /></ProtectedRoute>,
      },
      {
        path: 'roue',
        element: <ProtectedRoute requiredPermission="wheel"><RouePage /></ProtectedRoute>,
      },
      {
        path: 'user-management',
        element: (
          <ProtectedRoute requiredPermission="user-management">
            <UserManagement />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

function AppContent() {
  const { darkMode } = useTheme();
  const { loading } = useAuthContext();
  const theme = getTheme(darkMode ? 'dark' : 'light');

  if (loading) {
    return (
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      </MuiThemeProvider>
    );
  }

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
