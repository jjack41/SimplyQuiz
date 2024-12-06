import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Checkbox, 
  Alert, 
  CircularProgress, 
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  pseudo: string | null;
  created_at: string;
  can_manage_users: boolean;
}

interface PagePermission {
  id: string;
  name: string;
  path: string;
}

interface EditUserDialogProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (updatedUser: Partial<User>) => Promise<void>;
}

const ADMIN_EMAIL = 'jj.pezin41@gmail.com';

const EditUserDialog = ({ open, user, onClose, onSave }: EditUserDialogProps) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setPseudo(user.pseudo || '');
      setError(null);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await onSave({
        first_name: firstName || null,
        last_name: lastName || null,
        pseudo: pseudo || null
      });
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Modifier l'utilisateur</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            label="Prénom"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            fullWidth
            disabled={loading}
          />
          <TextField
            label="Nom"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            fullWidth
            disabled={loading}
          />
          <TextField
            label="Pseudo"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            fullWidth
            disabled={loading}
            helperText="Ce pseudo sera utilisé pour afficher vos scores"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Annuler</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={loading}
          color="primary"
        >
          {loading ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const pages: PagePermission[] = [
  { id: 'home', name: 'Accueil', path: '/' },
  { id: 'category', name: 'Catégories', path: '/categories' },
  { id: 'question', name: 'Questions', path: '/questions' },
  { id: 'profile', name: 'Profil', path: '/profile' },
  { id: 'setting', name: 'Paramètres', path: '/settings' },
  { id: 'classic-game', name: 'Jeu Classique', path: '/game-classique' },
  { id: 'score', name: 'Scores', path: '/scores' },
  { id: 'wheel', name: 'Roue', path: '/roue' },
  { id: 'user-management', name: 'Gestion Utilisateurs', path: '/user-management' }
];

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('users_view')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      if (data) {
        setUsers(data);
        const initialPermissions: Record<string, Record<string, boolean>> = {};
        data.forEach(user => {
          // Initialiser les permissions pour chaque utilisateur
          initialPermissions[user.id] = user.permissions || {};
        });
        setPermissions(initialPermissions);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = async (userId: string, pageId: string, userEmail: string) => {
    // Ne pas permettre de modifier les permissions de l'administrateur principal
    if (userEmail === ADMIN_EMAIL) {
      setError("Les permissions de l'administrateur principal ne peuvent pas être modifiées");
      return;
    }
    
    try {
      setError(null);
      setLoading(true);
      
      // Récupérer les données actuelles de l'utilisateur
      const { data: userData, error: fetchError } = await supabase
        .from('users_view')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        throw new Error(`Erreur lors de la récupération des données: ${fetchError.message}`);
      }

      if (!userData) {
        throw new Error("Utilisateur non trouvé");
      }

      // Créer un nouvel objet de permissions
      const currentPermissions = userData.permissions || {};
      const newPermissions = {
        ...currentPermissions,
        [pageId]: !currentPermissions[pageId]
      };

      // Si on active la gestion des utilisateurs, activer aussi les droits admin
      if (pageId === 'user-management' && newPermissions[pageId]) {
        newPermissions['admin'] = true;
      }

      // Si on désactive la gestion des utilisateurs, désactiver aussi les droits admin
      if (pageId === 'user-management' && !newPermissions[pageId]) {
        newPermissions['admin'] = false;
      }

      console.log('Mise à jour des permissions pour', userData.email);
      console.log('Anciennes permissions:', currentPermissions);
      console.log('Nouvelles permissions:', newPermissions);

      // Appeler la fonction RPC pour mettre à jour les permissions
      const { data: result, error: updateError } = await supabase.rpc(
        'update_user_permissions',
        {
          p_user_id: userId,
          p_permissions: newPermissions
        }
      );

      if (updateError) {
        throw new Error(`Erreur lors de la mise à jour: ${updateError.message}`);
      }

      if (!result?.success) {
        throw new Error(result?.error || 'Erreur inconnue lors de la mise à jour');
      }

      // Mettre à jour l'état local
      setPermissions(prevPermissions => ({
        ...prevPermissions,
        [userId]: newPermissions
      }));

      // Recharger les données pour s'assurer que tout est synchronisé
      await fetchUsers();

    } catch (error) {
      console.error('Erreur lors de la mise à jour des permissions:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue lors de la mise à jour des permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (updatedData: Partial<User>) => {
    if (!editUser) return;

    try {
      const { error } = await supabase.rpc('update_user_metadata', {
        p_user_id: editUser.id,
        p_first_name: updatedData.first_name || null,
        p_last_name: updatedData.last_name || null,
        p_pseudo: updatedData.pseudo || null,
        p_can_manage_users: editUser.can_manage_users,
        p_permissions: null
      });

      if (error) {
        console.error('Erreur lors de la mise à jour:', error);
        throw new Error('Erreur lors de la mise à jour des informations utilisateur');
      }

      // Mettre à jour l'état local
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === editUser.id 
            ? { ...user, ...updatedData }
            : user
        )
      );

      setEditUser(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={fetchUsers}>
              Réessayer
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Gestion des utilisateurs
      </Typography>
      
      {users.length === 0 ? (
        <Alert severity="info">Aucun utilisateur trouvé</Alert>
      ) : (
        <Box sx={{ 
          position: 'relative',
          mt: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          width: '100%',
          '& .sticky-column': {
            position: 'sticky',
            left: 0,
            backgroundColor: 'background.paper',
            zIndex: 2,
            borderRight: '1px solid rgba(224, 224, 224, 1)',
            '&:after': {
              content: '""',
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: 5,
              background: 'linear-gradient(90deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 100%)',
              pointerEvents: 'none',
              opacity: {
                xs: 1, // Visible sur mobile
                md: 0  // Caché sur desktop si pas de scroll
              }
            }
          },
          '& .sticky-column-2': {
            position: 'sticky',
            left: '20%',
            backgroundColor: 'background.paper',
            zIndex: 2,
            borderRight: '1px solid rgba(224, 224, 224, 1)',
            '&:after': {
              content: '""',
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: 5,
              background: 'linear-gradient(90deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 100%)',
              pointerEvents: 'none',
              opacity: {
                xs: 1, // Visible sur mobile
                md: 0  // Caché sur desktop si pas de scroll
              }
            }
          }
        }}>
          <TableContainer 
            component={Paper} 
            sx={{ 
              width: '100%',
              overflowX: {
                xs: 'auto', // Toujours scrollable sur mobile
                md: 'visible' // Visible par défaut sur desktop
              },
              '&:hover': {
                overflowX: 'auto' // Devient scrollable au hover si nécessaire
              },
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
              scrollBehavior: 'smooth',
              msOverflowStyle: '-ms-autohiding-scrollbar',
              '&::-webkit-scrollbar': {
                height: {
                  xs: 4,
                  sm: 8,
                  md: 12
                },
                // Cache la barre si pas de scroll nécessaire
                display: {
                  xs: 'block',
                  md: 'none'
                }
              },
              '&:hover::-webkit-scrollbar': {
                display: 'block' // Affiche la barre au hover si nécessaire
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'rgba(0,0,0,0.1)',
                borderRadius: 2,
                margin: 1
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.3)'
                },
                '&:active': {
                  backgroundColor: 'rgba(0,0,0,0.4)'
                }
              },
              '@media (hover: none)': {
                overscrollBehavior: 'contain',
                touchAction: 'pan-x pan-y',
                '&::-webkit-scrollbar': {
                  display: 'none'
                }
              }
            }}
            role="region"
            aria-label="Tableau des utilisateurs avec défilement horizontal"
            tabIndex={0}
          >
            <Table 
              size="small" 
              sx={{ 
                width: '100%',
                minWidth: {
                  xs: 1200, // Force le scroll sur mobile
                  md: '100%' // Adaptatif sur desktop
                },
                tableLayout: 'fixed'
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell 
                    sx={{ 
                      minWidth: 200, 
                      width: '20%'
                    }}
                    className="sticky-column"
                  >
                    Email
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      minWidth: 100, 
                      width: '10%'
                    }}
                    className="sticky-column-2"
                  >
                    Pseudo
                  </TableCell>
                  <TableCell 
                    align="center"
                    sx={{ minWidth: 80, width: '8%' }}
                  >
                    Admin
                  </TableCell>
                  {pages.map((page) => (
                    <TableCell 
                      key={page.id} 
                      align="center"
                      sx={{ 
                        minWidth: 80, 
                        width: '8%',
                        p: 1
                      }}
                    >
                      {page.name}
                    </TableCell>
                  ))}
                  <TableCell 
                    align="center"
                    sx={{ minWidth: 80, width: '8%' }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow 
                    key={user.id}
                    sx={user.email === ADMIN_EMAIL ? { 
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    } : {}}
                  >
                    <TableCell 
                      component="th" 
                      scope="row"
                      className="sticky-column"
                      sx={{
                        ...(user.email === ADMIN_EMAIL ? { 
                          fontWeight: 'bold',
                          color: 'primary.main'
                        } : {}),
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: 200,
                        p: 1,
                        backgroundColor: user.email === ADMIN_EMAIL ? 'rgba(0, 0, 0, 0.04)' : 'background.paper'
                      }}
                    >
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        '& > span': {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }
                      }}>
                        <span>{user.email}</span>
                      </Box>
                    </TableCell>
                    <TableCell 
                      className="sticky-column-2"
                      sx={{ 
                        whiteSpace: 'nowrap',
                        p: 1,
                        backgroundColor: user.email === ADMIN_EMAIL ? 'rgba(0, 0, 0, 0.04)' : 'background.paper'
                      }}
                    >
                      {user.pseudo || '-'}
                    </TableCell>
                    <TableCell align="center">
                      <Checkbox
                        checked={user.email === ADMIN_EMAIL}
                        disabled={true}
                        sx={{
                          color: user.email === ADMIN_EMAIL ? 'primary.main' : undefined,
                          '&.Mui-disabled': {
                            color: user.email === ADMIN_EMAIL ? 'primary.main' : undefined,
                          },
                        }}
                      />
                    </TableCell>
                    {pages.map((page) => (
                      <TableCell key={page.id} align="center">
                        <Checkbox
                          checked={permissions[user.id]?.[page.id] ?? true}
                          disabled={user.email === ADMIN_EMAIL}
                          onChange={() => handlePermissionChange(user.id, page.id, user.email)}
                          sx={{
                            color: user.email === ADMIN_EMAIL ? 'primary.main' : undefined,
                            '&.Mui-disabled': {
                              color: user.email === ADMIN_EMAIL ? 'primary.main' : undefined,
                            },
                          }}
                        />
                      </TableCell>
                    ))}
                    <TableCell align="center">
                      <IconButton 
                        onClick={() => setEditUser(user)}
                        size="small"
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <EditUserDialog
        open={!!editUser}
        user={editUser}
        onClose={() => setEditUser(null)}
        onSave={handleEditUser}
      />
    </Box>
  );
};

export default UserManagement;
