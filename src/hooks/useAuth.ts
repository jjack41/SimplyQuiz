import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Vérifier la session actuelle
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email: string, password: string, pseudo: string) => {
    // Créer le compte utilisateur
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (!error && data.user) {
      // Mettre à jour le pseudo via la fonction RPC
      const { error: updateError } = await supabase
        .rpc('update_user_pseudo', {
          p_email: email,
          p_pseudo: pseudo
        });

      if (updateError) {
        console.error('Erreur lors de la mise à jour du pseudo:', updateError);
        return { data: null, error: updateError };
      }

      // Créer l'entrée dans la table des profils
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            pseudo: pseudo,
            email: email,
            wheel_spins: 3  // Initialisation à 3 tours de roue
          }
        ]);

      if (profileError) {
        return { data: null, error: profileError };
      }
    }

    return { data, error };
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { data, error }
  }

  const updatePassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })
    return { data, error }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  }
}
