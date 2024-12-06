-- Fonction pour mettre à jour les permissions d'un utilisateur
CREATE OR REPLACE FUNCTION update_user_permissions(
  p_user_id UUID,
  p_permissions JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_exists BOOLEAN;
  v_result JSONB;
BEGIN
  -- Vérifier si l'utilisateur existe
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE id = p_user_id
  ) INTO v_user_exists;

  IF NOT v_user_exists THEN
    RAISE EXCEPTION 'User not found' USING ERRCODE = 'P0002';
  END IF;

  -- Vérifier si les permissions sont un objet JSON valide
  IF p_permissions IS NULL OR jsonb_typeof(p_permissions) != 'object' THEN
    RAISE EXCEPTION 'Invalid permissions format' USING ERRCODE = 'P0001';
  END IF;

  -- Mettre à jour les métadonnées de l'utilisateur dans auth.users
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object('permissions', p_permissions)
  WHERE id = p_user_id;

  -- Mettre à jour la vue des utilisateurs
  UPDATE users_view
  SET 
    permissions = p_permissions,
    can_manage_users = COALESCE((p_permissions->>'admin')::boolean, false)
  WHERE id = p_user_id;

  -- Construire le résultat
  v_result = jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'permissions', p_permissions
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'error_code', SQLSTATE
  );
END;
$$;
