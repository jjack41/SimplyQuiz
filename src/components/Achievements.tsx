import { useStats } from '../contexts/StatsContext';
import { Card, CardContent, Grid, LinearProgress, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import { 
  FaTrophy, 
  FaStar, 
  FaMedal, 
  FaCrown, 
  FaGem,
  FaLock
} from 'react-icons/fa';

const getAchievementIcon = (iconName: string) => {
  switch (iconName) {
    case 'trophy': return <FaTrophy />;
    case 'star': return <FaStar />;
    case 'medal': return <FaMedal />;
    case 'crown': return <FaCrown />;
    case 'gem': return <FaGem />;
    default: return <FaStar />;
  }
};

export const Achievements = () => {
  const { achievements } = useStats();

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Succès</h2>
      <Grid container spacing={2}>
        {achievements.map((achievement) => (
          <Grid item xs={12} sm={6} md={4} key={achievement.id}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className={`${achievement.unlocked_at ? 'bg-green-50' : 'bg-gray-50'}`}
              >
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className={`text-2xl ${achievement.unlocked_at ? 'text-green-500' : 'text-gray-400'}`}>
                      {achievement.unlocked_at ? (
                        getAchievementIcon(achievement.icon_name)
                      ) : (
                        <FaLock />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold">{achievement.name}</h3>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                    </div>
                  </div>
                  
                  {achievement.unlocked_at ? (
                    <div className="mt-2 text-sm text-green-600">
                      Débloqué le {new Date(achievement.unlocked_at).toLocaleDateString()}
                    </div>
                  ) : (
                    <Tooltip title={`Progression: ${achievement.condition_value}/${achievement.condition_value}`}>
                      <LinearProgress 
                        variant="determinate"
                        value={(achievement.condition_value / achievement.condition_value) * 100}
                        className="mt-2"
                      />
                    </Tooltip>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </div>
  );
};
