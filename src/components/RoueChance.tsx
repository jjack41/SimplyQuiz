import { useState, useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Wheel } from 'react-custom-roulette';
import { useGameContext } from '../contexts/GameContext';
import { useStats } from '../contexts/StatsContext';

const data = [
  { option: '50/50', style: { backgroundColor: '#FF6B6B', textColor: 'white' } },
  { option: 'Rien', style: { backgroundColor: '#96CEB4', textColor: 'white' } },
  { option: 'Lien article', style: { backgroundColor: '#45B7D1', textColor: 'white' } },
  { option: 'Rien', style: { backgroundColor: '#96CEB4', textColor: 'white' } },
  { option: '50/50', style: { backgroundColor: '#FF6B6B', textColor: 'white' } },
  { option: 'Rien', style: { backgroundColor: '#96CEB4', textColor: 'white' } },
  { option: 'Bonne réponse', style: { backgroundColor: '#4ECDC4', textColor: 'white' } },
  { option: 'Rien', style: { backgroundColor: '#96CEB4', textColor: 'white' } },
  { option: 'Lien article', style: { backgroundColor: '#45B7D1', textColor: 'white' } },
  { option: 'Rien', style: { backgroundColor: '#96CEB4', textColor: 'white' } }
];

interface RoueChanceProps {
  onClose: () => void;
}

const RoueChance: React.FC<RoueChanceProps> = ({ onClose }) => {
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [hasSpun, setHasSpun] = useState(false);
  const { addBooster, state } = useGameContext();
  const { userStats } = useStats();

  const segments = [
    { text: '50/50', color: '#96CEB4', weight: 10, action: () => addBooster('50/50') },
    { text: 'Rien', color: '#D4D4D4', weight: 9, action: () => null },
    { text: 'Lien article', color: '#45B7D1', weight: 10, action: () => addBooster('Lien article') },
    { text: 'Rien', color: '#D4D4D4', weight: 9, action: () => null },
    { text: '50/50', color: '#96CEB4', weight: 10, action: () => addBooster('50/50') },
    { text: 'Rien', color: '#D4D4D4', weight: 9, action: () => null },
    { text: 'Double Points', color: '#4ECDC4', weight: 15, action: () => addBooster('Double Points') },
    { text: 'Rien', color: '#D4D4D4', weight: 9, action: () => null },
    { text: '+1 Vie', color: '#FF6B6B', weight: 10, action: () => addBooster('+1 Vie') },
    { text: 'Rien', color: '#D4D4D4', weight: 9, action: () => null },
    { text: 'Triple Points', color: '#45B7D1', weight: 5, action: () => addBooster('Triple Points') },
    { text: 'Lien article', color: '#45B7D1', weight: 10, action: () => addBooster('Lien article') },
    { text: 'Voir Réponse', color: '#FFEEAD', weight: 5, action: () => addBooster('Voir Réponse') }
  ];

  useEffect(() => {
    console.log('Wheel spins disponibles:', state.boosters.wheel_spin);
  }, [state.boosters.wheel_spin]);

  useEffect(() => {
    if (userStats) {
      const { success_rate } = userStats;
      if (success_rate < 40) {
        segments[0].weight = 15;
        segments[1].weight = 20;
        segments[3].weight = 25;
        segments[7].weight = 30;
      } else if (success_rate > 80) {
        segments[0].weight = 5;
        segments[1].weight = 10;
        segments[3].weight = 15;
        segments[7].weight = 60;
      }
    }
  }, [userStats]);

  const handleSpinClick = () => {
    if (state.boosters.wheel_spin <= 0) {
      console.log('Pas de roues disponibles');
      return;
    }

    if (!mustSpin) {
      const newPrizeNumber = Math.floor(Math.random() * data.length);
      setPrizeNumber(newPrizeNumber);
      setMustSpin(true);
      setHasSpun(true);
      addBooster('wheel_spin', -1);
    }
  };

  const handleStopSpinning = () => {
    setMustSpin(false);
    const prize = segments[prizeNumber].text;
    if (prize !== 'Rien') {
      segments[prizeNumber].action();
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: 2,
      p: 2 
    }}>
      <Typography variant="h5" gutterBottom>
        Roue de la Chance
      </Typography>
      
      <Typography variant="body1" gutterBottom>
        {!hasSpun 
          ? `Tours disponibles : ${state.boosters.wheel_spin || 0}`
          : `Vous avez obtenu : ${segments[prizeNumber].text}`
        }
      </Typography>

      <Wheel
        mustStartSpinning={mustSpin}
        prizeNumber={prizeNumber}
        data={data}
        onStopSpinning={handleStopSpinning}
        radiusLineWidth={1}
        innerRadius={20}
        innerBorderWidth={5}
        textDistance={60}
        fontSize={15}
      />

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button
          variant="contained"
          onClick={handleSpinClick}
          disabled={hasSpun || !state.boosters.wheel_spin}
        >
          {hasSpun ? 'Déjà tourné' : state.boosters.wheel_spin ? 'Tourner la roue' : 'Pas de tours disponibles'}
        </Button>
        
        <Button
          variant="outlined"
          onClick={onClose}
        >
          Fermer
        </Button>
      </Box>
    </Box>
  );
};

export default RoueChance;