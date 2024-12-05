import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../components/UserProfile';
import { Achievements } from '../components/Achievements';
import { Challenges } from '../components/Challenges';
import { Leaderboard } from '../components/Leaderboard';
import { DailyRewards } from '../components/DailyRewards';

interface Profile {
  id: string;
  pseudo: string;
  email: string;
}

interface UserProfileData {
  pseudo: string;
  email: string;
  onUpdatePseudo: () => void;
  onUpdateEmail: () => void;
  onDeleteAccount: () => void;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthContext();
  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadProfile();
  }, [user, navigate]);

  const loadProfile = async () => {
    try {
      if (!user?.id) {
        throw new Error('Utilisateur non connecté');
      }

      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id, pseudo, email')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([
              {
                id: user.id,
                pseudo: user.user_metadata?.pseudo || user.email?.split('@')[0] || '',
              }
            ])
            .select()
            .single();

          if (insertError) throw insertError;

          if (newProfile) {
            setPseudo(newProfile.pseudo || '');
            setEmail(user.email || '');
          }
        } else {
          throw fetchError;
        }
      } else if (existingProfile) {
        setPseudo(existingProfile.pseudo || '');
        setEmail(user.email || '');
      }
    } catch (err: any) {
      setError(`Impossible de charger le profil: ${err.message || 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePseudo = async () => {
    try {
      setError('');
      setSuccess('');

      if (!pseudo.trim()) {
        setError('Le pseudo ne peut pas être vide');
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ pseudo: pseudo.trim() })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      setSuccess('Pseudo mis à jour avec succès');
    } catch (err: any) {
      setError('Impossible de mettre à jour le pseudo');
    }
  };

  const handleUpdateEmail = async () => {
    try {
      setError('');
      setSuccess('');

      if (!email.trim()) {
        setError('L\'email ne peut pas être vide');
        return;
      }

      if (!user) {
        setError('Utilisateur non connecté');
        return;
      }

      const { error } = await supabase.auth.updateUser({
        email: email.trim(),
      });

      if (error) throw error;

      setSuccess('Un email de confirmation a été envoyé à votre nouvelle adresse');
    } catch (err: any) {
      setError('Impossible de mettre à jour l\'email');
    }
  };


  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleDeleteAccount = async () => {
    try {
      setError('');
      
      if (!user?.id) {
        setError('Utilisateur non connecté');
        return;
      }

      const { error: deleteProfileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (deleteProfileError) throw deleteProfileError;

      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) {
        setError('Échec de la suppression du compte');
        return;
      }
      
      await signOut();
      navigate('/login');
    } catch (err) {
      setError('Une erreur est survenue lors de la suppression du compte');
    } finally {
      handleCloseDeleteDialog();
    }
  };

  const userProfileData: UserProfileData = {
    pseudo,
    email,
    onUpdatePseudo: handleUpdatePseudo,
    onUpdateEmail: handleUpdateEmail,
    onDeleteAccount: handleDeleteAccount,
  };

  return (
    <div className="container mx-auto p-4">
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 relative">
              <span className="block sm:inline">{success}</span>
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Profil</h1>
            <DailyRewards />
          </div>

          <div className="space-y-8">
            <UserProfile {...userProfileData} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-8">
                <Achievements />
                <Challenges />
              </div>
              <Leaderboard />
            </div>
          </div>

          {/* Dialog de confirmation de suppression */}
          {openDeleteDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                <h3 className="text-lg font-medium mb-4">Confirmer la suppression</h3>
                <p className="text-gray-500 mb-4">
                  Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.
                </p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={handleCloseDeleteDialog}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}