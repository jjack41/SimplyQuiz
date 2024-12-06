-- Supprimer d'abord les objets dépendants
DROP FUNCTION IF EXISTS public.get_all_users();
DROP FUNCTION IF EXISTS public.update_user_metadata(uuid, text, text, text);
DROP FUNCTION IF EXISTS public.update_user_metadata(uuid, text, text, text, boolean);
DROP FUNCTION IF EXISTS public.update_user_metadata(uuid, text, text, text, boolean, jsonb);
DROP VIEW IF EXISTS public.users_view CASCADE;

-- Créer une vue sécurisée pour les utilisateurs
CREATE VIEW public.users_view AS
SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data->>'first_name' as first_name,
    au.raw_user_meta_data->>'last_name' as last_name,
    au.raw_user_meta_data->>'pseudo' as pseudo,
    au.created_at,
    au.last_sign_in_at,
    CASE 
        WHEN au.email = 'jj.pezin41@gmail.com' THEN true
        ELSE (au.raw_user_meta_data->>'can_manage_users')::boolean
    END as can_manage_users,
    CASE
        WHEN au.email = 'jj.pezin41@gmail.com' THEN '{}'::jsonb
        ELSE COALESCE(au.raw_user_meta_data->'permissions', '{}'::jsonb)
    END as permissions
FROM auth.users au;

-- Fonction pour récupérer tous les utilisateurs
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS SETOF public.users_view
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY SELECT * FROM public.users_view
    ORDER BY created_at DESC;
END;
$$;

-- Créer une fonction pour mettre à jour les métadonnées utilisateur
CREATE OR REPLACE FUNCTION public.update_user_metadata(
    p_user_id UUID,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL,
    p_pseudo TEXT DEFAULT NULL,
    p_can_manage_users BOOLEAN DEFAULT NULL,
    p_permissions JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_calling_user_id uuid;
    v_calling_user_email text;
    v_current_metadata jsonb;
BEGIN
    -- Récupérer l'ID de l'utilisateur qui fait l'appel
    v_calling_user_id := auth.uid();
    
    -- Récupérer l'email de l'utilisateur qui fait l'appel
    SELECT email, raw_user_meta_data INTO v_calling_user_email, v_current_metadata
    FROM auth.users
    WHERE id = v_calling_user_id;
    
    -- Vérifier si l'utilisateur est administrateur ou s'il modifie ses propres données
    IF v_calling_user_email = 'jj.pezin41@gmail.com' OR v_calling_user_id = p_user_id THEN
        UPDATE auth.users
        SET raw_user_meta_data = jsonb_build_object(
            'first_name', COALESCE(p_first_name, v_current_metadata->>'first_name'),
            'last_name', COALESCE(p_last_name, v_current_metadata->>'last_name'),
            'pseudo', COALESCE(p_pseudo, v_current_metadata->>'pseudo'),
            'can_manage_users', COALESCE(
                p_can_manage_users,
                (v_current_metadata->>'can_manage_users')::boolean,
                false
            ),
            'permissions', COALESCE(
                p_permissions,
                v_current_metadata->'permissions',
                '{}'::jsonb
            )
        )
        WHERE id = p_user_id;
    ELSE
        RAISE EXCEPTION 'Non autorisé à modifier cet utilisateur';
    END IF;
END;
$$;

-- Accorder les permissions nécessaires
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_metadata(p_user_id UUID, p_first_name TEXT, p_last_name TEXT, p_pseudo TEXT, p_can_manage_users BOOLEAN, p_permissions JSONB) TO authenticated;
GRANT SELECT ON public.users_view TO authenticated;
