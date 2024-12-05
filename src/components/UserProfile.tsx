import { useStats } from '../contexts/StatsContext';
import { useAuthContext } from '../contexts/AuthContext';
import { 
  Card, 
  CardContent, 
  Grid, 
  Avatar,
  Typography,
  Chip,
  Box
} from '@mui/material';
import { 
  FaGamepad, 
  FaStar, 
  FaTrophy, 
  FaChartLine,
  FaFire
} from 'react-icons/fa';
import { UserLevel } from './UserLevel';

// Modifié l'interface pour n'inclure que les props nécessaires (aucune dans ce cas)
interface UserProfileProps {}

export const UserProfile: React.FC<UserProfileProps> = () => {
  const { userStats } = useStats();
  const { user } = useAuthContext();

  if (!userStats) return null;

  return (
    <div className="p-4">
      <Card>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <Avatar 
              src={user?.user_metadata?.avatar_url} 
              alt={user?.user_metadata?.username}
              sx={{ width: 80, height: 80 }}
            />
            <div>
              <Typography variant="h4">
                {user?.user_metadata?.username}
              </Typography>
              <div className="flex items-center space-x-2">
                <Chip 
                  icon={<FaFire />}
                  label={`Série: ${userStats.streak_days} jours`}
                  color="primary"
                />
              </div>
            </div>
          </div>

          <Box sx={{ mb: 4 }}>
            <UserLevel />
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <FaGamepad size={20} style={{ marginRight: '8px' }} />
                    <Typography variant="h6">Parties jouées</Typography>
                  </Box>
                  <Typography variant="h4">{userStats.total_games}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <FaStar size={20} style={{ marginRight: '8px' }} />
                    <Typography variant="h6">Score moyen</Typography>
                  </Box>
                  <Typography variant="h4">{Math.round(userStats.average_score)}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <FaTrophy size={20} style={{ marginRight: '8px' }} />
                    <Typography variant="h6">Meilleur score</Typography>
                  </Box>
                  <Typography variant="h4">{Math.round(userStats.average_score * 1.5)}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <FaChartLine size={20} style={{ marginRight: '8px' }} />
                    <Typography variant="h6">Taux de réussite</Typography>
                  </Box>
                  <Typography variant="h4">
                    {Math.round(userStats.success_rate * 100)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </div>
  );
};