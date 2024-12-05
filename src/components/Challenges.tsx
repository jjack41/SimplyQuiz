import { useStats } from '../contexts/StatsContext';
import { Card, CardContent, Grid, LinearProgress, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { FaFire, FaClock } from 'react-icons/fa';

export const Challenges = () => {
  const { challenges } = useStats();

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}j ${hours}h restants`;
    }
    return `${hours}h restantes`;
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Défis</h2>
      <Grid container spacing={2}>
        {challenges.map((challenge) => {
          const progress = (challenge.current_progress || 0) / challenge.required_score * 100;
          
          return (
            <Grid item xs={12} sm={6} md={4} key={challenge.id}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className={challenge.completed ? 'bg-green-50' : ''}>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <FaFire className="text-orange-500" />
                        <h3 className="font-bold">{challenge.title}</h3>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FaClock className="mr-1" />
                        {getTimeRemaining(challenge.end_date)}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">
                      {challenge.description}
                    </p>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progression</span>
                        <span>{challenge.current_progress || 0} / {challenge.required_score}</span>
                      </div>
                      <LinearProgress 
                        variant="determinate" 
                        value={progress}
                        color={challenge.completed ? "success" : "primary"}
                      />
                    </div>

                    {challenge.completed ? (
                      <div className="mt-3 text-green-600 font-medium text-center">
                        Défi complété! 
                        <br />
                        Récompense: {challenge.reward_amount}x {challenge.reward_type}
                      </div>
                    ) : (
                      <Button 
                        fullWidth 
                        variant="contained" 
                        color="primary"
                        className="mt-3"
                        href="/game"
                      >
                        Jouer maintenant
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          );
        })}
      </Grid>
    </div>
  );
};
