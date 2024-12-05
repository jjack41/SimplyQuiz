import React from 'react';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSound from 'use-sound';

// Sons
import correctSound from '../assets/sounds/correct.mp3';
import wrongSound from '../assets/sounds/wrong.mp3';
import achievementSound from '../assets/sounds/achievement.mp3';
import boosterSound from '../assets/sounds/booster.mp3';

interface PointsPopupProps {
  points: number;
  position: { x: number; y: number };
  onComplete?: () => void;
}

export const PointsPopup: React.FC<PointsPopupProps> = ({ points, position, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 1000); // Call onComplete after 1 second (adjust as needed)

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'absolute',
          left: `${position.x}px`,
          top: `${position.y}px`,
          color: points > 0 ? 'green' : 'red',
          fontWeight: 'bold',
        }}
      >
        {points > 0 ? `+${points}` : points}
      </motion.div>
    </AnimatePresence>
  );
};

interface AchievementPopupProps {
  achievement: {
    name: string;
    description: string;
    reward_type: string;
    reward_amount: number;
  };
  onComplete?: () => void;
}

export const AchievementPopup: React.FC<AchievementPopupProps> = ({ achievement, onComplete }) => {
  const [playAchievement] = useSound(achievementSound);

  useEffect(() => {
    playAchievement();
  }, []);

  useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 1000); // Call onComplete after 1 second (adjust as needed)

      return () => clearTimeout(timer);
    }
  }, [onComplete]);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 20 }}
      className="fixed top-4 right-4 bg-purple-600 text-white p-4 rounded-lg shadow-lg z-50"
    >
      <div className="flex items-center space-x-3">
        <div className="text-3xl">🏆</div>
        <div>
          <h3 className="font-bold">{achievement.name}</h3>
          <p className="text-sm opacity-90">{achievement.description}</p>
          <p className="text-sm mt-1">
            Récompense : {achievement.reward_amount}x {achievement.reward_type}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

interface BoosterEffectProps {
  type: string;
  onComplete?: () => void;
}

export const BoosterEffect: React.FC<BoosterEffectProps> = ({ type, onComplete }) => {
  const [playBooster] = useSound(boosterSound);

  useEffect(() => {
    playBooster();
  }, []);

  useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 1000); // Call onComplete after 1 second (adjust as needed)

      return () => clearTimeout(timer);
    }
  }, [onComplete]);

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0, rotate: 180 }}
      transition={{ type: 'spring', damping: 12 }}
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
    >
      <div className="text-6xl">
        {type === 'double_points' && '2️⃣✨'}
        {type === 'triple_points' && '3️⃣✨'}
        {type === 'fifty_fifty' && '5️⃣0️⃣'}
        {type === 'show_answer' && '👁️'}
      </div>
    </motion.div>
  );
};

interface GameSoundsProps {
  isCorrect: boolean;
}

export const GameSounds: React.FC<GameSoundsProps> = ({ isCorrect }) => {
  const [playCorrect] = useSound(correctSound);
  const [playWrong] = useSound(wrongSound);

  useEffect(() => {
    if (isCorrect) {
      playCorrect();
    } else {
      playWrong();
    }
  }, [isCorrect]);

  return null;
};
