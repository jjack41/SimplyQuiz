import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Box
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

const tutorialSteps = [
  {
    title: 'Bienvenue dans SimplyQuiz!',
    content: 'Testez vos connaissances, gagnez des points et débloquez des récompenses!',
    image: '🎮'
  },
  {
    title: 'Les Boosters',
    content: 'Utilisez des boosters pour vous aider : Double Points, 50/50, et plus encore!',
    image: '🚀'
  },
  {
    title: 'La Roue de la Chance',
    content: 'Tournez la roue pour gagner des bonus après chaque série de bonnes réponses!',
    image: '🎡'
  },
  {
    title: 'Défis Quotidiens',
    content: 'Relevez des défis pour gagner des récompenses supplémentaires!',
    image: '🏆'
  },
  {
    title: 'Progression',
    content: 'Montez en niveau, débloquez des succès et grimpez dans le classement!',
    image: '📈'
  }
];

interface GameTutorialProps {
  open: boolean;
  onClose: () => void;
}

export const GameTutorial: React.FC<GameTutorialProps> = ({ open, onClose }) => {
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleClose = () => {
    setActiveStep(0);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Tutorial
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} alternativeLabel>
        {tutorialSteps.map((_, index) => (
            <Step key={index}>
              <StepLabel></StepLabel>
            </Step>
          ))}
        </Stepper>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                className="text-6xl mb-4"
              >
                {tutorialSteps[activeStep].image}
              </motion.div>
              <Typography variant="h6" gutterBottom>
                {tutorialSteps[activeStep].title}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {tutorialSteps[activeStep].content}
              </Typography>
            </Box>
          </motion.div>
        </AnimatePresence>
      </DialogContent>

      <DialogActions>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Précédent
        </Button>
        {activeStep === tutorialSteps.length - 1 ? (
          <Button variant="contained" onClick={handleClose}>
            Commencer!
          </Button>
        ) : (
          <Button variant="contained" onClick={handleNext}>
            Suivant
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
