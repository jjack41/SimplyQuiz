-- Fonction pour supprimer un utilisateur et ses données associées
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void AS $$
DECLARE
    _user_id uuid;
BEGIN
    -- Récupérer l'ID de l'utilisateur authentifié
    _user_id := auth.uid();
    
    -- Supprimer les données de l'utilisateur de la table auth.users
    DELETE FROM auth.users WHERE id = _user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user() TO service_role;
