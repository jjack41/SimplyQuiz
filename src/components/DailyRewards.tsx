import { useState } from 'react';
import { useStats } from '../contexts/StatsContext';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { motion } from 'framer-motion';
import { FaGift, FaStar, FaTrophy } from 'react-icons/fa';

interface ClaimedReward {
  reward_type: string;
  reward_amount: number;
  streak_days: number;
}

export const DailyRewards = () => {
  const { userStats, claimDailyReward } = useStats();
  const [open, setOpen] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [claimedReward, setClaimedReward] = useState<ClaimedReward | null>(null);

  const handleClaim = async () => {
    const reward = await claimDailyReward();
    if (reward) {
      setClaimedReward(reward);
      setRewardClaimed(true);
    }
  };

  // Créer une chaîne de texte conditionnelle pour le titre
  const dialogTitle = () => {
    const baseTitle = "Récompense Quotidienne";
    if (userStats && userStats.streak_days && userStats.streak_days > 0) {
      return `${baseTitle} - Série de ${userStats.streak_days} jours!`;
    }
    return baseTitle;
  };

  return (
    <>
      <Button
        variant="contained"
        color="secondary"
        onClick={() => setOpen(true)}
        startIcon={<FaGift />}
      >
        Récompense Quotidienne
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogTitle()}
        </DialogTitle>
        <DialogContent>
          {!rewardClaimed ? (
            <div className="flex flex-col items-center space-y-4 p-4">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <FaGift size={64} className="text-purple-500" />
              </motion.div>
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Réclamez votre récompense!</h3>
                <p>Revenez chaque jour pour maintenir votre série</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4 p-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring" }}
              >
                {claimedReward?.reward_type === 'special_booster' ? (
                  <FaTrophy size={64} className="text-yellow-500" />
                ) : (
                  <FaStar size={64} className="text-yellow-500" />
                )}
              </motion.div>
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">
                  {claimedReward && `Félicitations! Vous avez reçu ${claimedReward.reward_amount}x ${claimedReward.reward_type}`}
                </h3>
                <p>Série actuelle: {claimedReward?.streak_days} jours</p>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          {!rewardClaimed ? (
            <Button onClick={handleClaim} color="primary" variant="contained">
              Réclamer
            </Button>
          ) : (
            <Button onClick={() => setOpen(false)} color="primary" variant="contained">
              Fermer
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};