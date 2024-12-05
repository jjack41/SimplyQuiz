import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [error, setError] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, resetPassword } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    try {
      if (isSignUp) {
        if (!pseudo) {
          setError('Le pseudo est obligatoire');
          return;
        }
        const { error: authError } = await signUp(email, password, pseudo);
        if (authError) throw authError;
      } else {
        const { error: authError } = await signIn(email, password);
        if (authError) throw authError;
      }

      // Redirection après connexion réussie
      const returnTo = location.state?.returnTo;
      const gameConfig = location.state?.gameConfig;

      if (returnTo && gameConfig) {
        navigate(returnTo, { state: gameConfig });
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      setError('Veuillez entrer votre adresse email');
      return;
    }

    try {
      const { error: resetError } = await resetPassword(resetEmail);
      if (resetError) throw resetError;

      setResetEmailSent(true);
      setTimeout(() => {
        setOpenResetDialog(false);
        setResetEmailSent(false);
        setResetEmail('');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            {isSignUp ? 'Créer un compte' : 'Connexion'}
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            {isSignUp && (
              <TextField
                margin="normal"
                required
                fullWidth
                label="Pseudo (pour les scores et le classement)"
                name="pseudo"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                helperText="Ce pseudo sera utilisé pour afficher vos scores"
              />
            )}
            
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              name="email"
              autoComplete="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              label="Mot de passe"
              name="password"
              type="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {!isSignUp && (
              <Box sx={{ mt: 1, textAlign: 'right' }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={(e) => {
                    e.preventDefault();
                    setOpenResetDialog(true);
                  }}
                >
                  Mot de passe oublié ?
                </Link>
              </Box>
            )}
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              {isSignUp ? 'Créer un compte' : 'Se connecter'}
            </Button>
            
            <Divider sx={{ my: 2 }}>ou</Divider>
            
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Déjà un compte ? Connectez-vous' : 'Créer un compte'}
            </Button>
          </Box>
        </Paper>
      </Box>

      <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)}>
        <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
        <DialogContent>
          {resetEmailSent ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              Un email de réinitialisation a été envoyé à votre adresse email.
            </Alert>
          ) : (
            <>
              <Typography sx={{ mt: 2 }}>
                Entrez votre adresse email pour recevoir un lien de réinitialisation.
              </Typography>
              <TextField
                autoFocus
                margin="dense"
                label="Email"
                type="email"
                fullWidth
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResetDialog(false)}>Annuler</Button>
          <Button onClick={handleResetPassword} disabled={resetEmailSent}>
            Envoyer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
