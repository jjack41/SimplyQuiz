import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  IconButton, 
  Button,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  useMediaQuery
} from '@mui/material';
import {
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  Person,
  Category as CategoryIcon,
  QuestionMark as QuestionIcon,
  Home as HomeIcon,
  Menu as MenuIcon,
  Close,
  Settings,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Gamepad as GamepadIcon,
  Leaderboard as LeaderboardIcon,
  Casino as CasinoIcon
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { getTheme } from '../theme';

const ADMIN_EMAIL = 'admin@example.com'; // Définir l'email de l'administrateur principal

interface LayoutProps {
  children?: React.ReactNode;
}

const DRAWER_WIDTH = 240;

const Layout = ({ children }: LayoutProps) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const theme = createTheme(getTheme(darkMode ? 'dark' : 'light'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuthContext();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    await signOut();
    handleClose();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Accueil', icon: <HomeIcon />, path: '/' },
    ...(user ? [
      { text: 'Catégories', icon: <CategoryIcon />, path: '/categories', permission: 'category' },
      { text: 'Questions', icon: <QuestionIcon />, path: '/questions', permission: 'question' },
      { text: 'Mon compte', icon: <Person />, path: '/profile', permission: 'profile' },
      { text: 'Paramètres', icon: <Settings />, path: '/settings', permission: 'setting' },
      { text: 'Jeu Classique', icon: <GamepadIcon />, path: '/game-classique', permission: 'classic-game' },
      { text: 'Scores', icon: <LeaderboardIcon />, path: '/scores', permission: 'score' },
      { text: 'Roue', icon: <CasinoIcon />, path: '/roue', permission: 'wheel' },
      { 
        text: 'Gestion utilisateurs', 
        icon: <AdminPanelSettingsIcon />, 
        path: '/user-management',
        permission: 'user-management',
        requiresAdmin: true
      },
    ].filter(item => {
      // L'administrateur principal a toujours accès à tout
      if (user.email === ADMIN_EMAIL) return true;
      
      // Pour les autres utilisateurs, vérifier les permissions
      const userPermissions = user.user_metadata?.permissions || {};
      if (item.requiresAdmin && !userPermissions['admin']) return false;
      return userPermissions[item.permission] === true;
    }) : []),
  ];

  const drawerContent = (
    <Box sx={{ width: DRAWER_WIDTH }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          height: 64
        }}
      >
        <IconButton onClick={handleDrawerToggle}>
          <Close />
        </IconButton>
      </Box>
      <List sx={{
        '& .MuiListItemButton-root': {
          borderRadius: 0,
          mx: 0,
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          }
        }
      }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.text}
            onClick={() => {
              navigate(item.path);
              if (isMobile) {
                setMobileOpen(false);
              }
            }}
            selected={location.pathname === item.path}
            sx={{
              py: 2,
              borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
              bgcolor: location.pathname === item.path ? 'rgba(0, 0, 0, 0.04)' : 'transparent'
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText 
              primary={item.text} 
              primaryTypographyProps={{
                sx: { fontWeight: location.pathname === item.path ? 600 : 400 }
              }}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
              <Typography
                variant="h6"
                component="div"
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate('/')}
              >
                SimplyQuiz
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                sx={{ ml: 1 }}
                onClick={toggleDarkMode}
                color="inherit"
              >
                {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>

              {user ? (
                <>
                  <IconButton
                    color="inherit"
                    onClick={handleMenu}
                    size="large"
                  >
                    <Person />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                  >
                    <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>
                      Profil
                    </MenuItem>
                    <MenuItem onClick={handleSignOut}>
                      Déconnexion
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Button 
                  color="inherit"
                  onClick={() => navigate('/login')}
                >
                  Connexion
                </Button>
              )}
            </Box>
          </Toolbar>
        </AppBar>

        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawerContent}
        </Drawer>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
            ml: { sm: `${DRAWER_WIDTH}px` },
            mt: '64px', // Height of AppBar
          }}
        >
          <Box sx={{ display: 'flex' }}>
            {children}
          </Box>
          <Outlet />
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Layout;
