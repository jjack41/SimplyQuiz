import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requireAdmin?: boolean;
}

const ADMIN_EMAIL = 'jj.pezin41@gmail.com'; // Email de l'administrateur principal

export const ProtectedRoute = ({ children, requiredPermission, requireAdmin = false }: ProtectedRouteProps) => {
  const { user } = useAuthContext();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // L'administrateur principal a toujours accès à tout
  if (user.email === ADMIN_EMAIL) {
    return <>{children}</>;
  }

  const userPermissions = user.user_metadata?.permissions || {};
  
  // Vérifier si l'utilisateur est admin si nécessaire
  if (requireAdmin && userPermissions['admin'] !== true) {
    return <Navigate to="/" replace />;
  }

  // Vérifier la permission spécifique si nécessaire
  if (requiredPermission && userPermissions[requiredPermission] !== true) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
