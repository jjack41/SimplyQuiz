import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { User } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'jj.pezin41@gmail.com'

const DEFAULT_ADMIN_PERMISSIONS = {
  admin: true,
  'user-management': true,
  'category': true,
  'question': true,
  'profile': true,
  'setting': true,
  'classic-game': true,
  'score': true,
  'wheel': true
}

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
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!error && data.user && email === ADMIN_EMAIL) {
        // Mettre à jour les permissions de l'administrateur
        await supabase.rpc('update_user_metadata', {
          p_user_id: data.user.id,
          p_permissions: DEFAULT_ADMIN_PERMISSIONS,
          p_can_manage_users: true,
          p_first_name: data.user.user_metadata?.first_name || null,
          p_last_name: data.user.user_metadata?.last_name || null,
          p_pseudo: data.user.user_metadata?.pseudo || null
        })
      }

      return { data, error }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error)
      return { data: null, error }
    }
  }

  const signUp = async (email: string, password: string, pseudo: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            pseudo: pseudo,
            permissions: email === ADMIN_EMAIL ? DEFAULT_ADMIN_PERMISSIONS : {}
          }
        }
      })

      if (!error && data.user) {
        await supabase.from('profiles').insert([
          {
            id: data.user.id,
            pseudo: pseudo,
            email: email,
            wheel_spins: 3
          }
        ])
      }

      return { data, error }
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error)
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      return { error }
    }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut
  }
}
