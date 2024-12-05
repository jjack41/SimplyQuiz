import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface ScoreSubmissionProps {
  open: boolean;
  onClose: () => void;
  score: number;
  maxScore: number;
  timeSpent: number;
  difficulty: string | 'facile' | 'moyen' | 'difficile';
  questionCount: number;
  categories?: number[];
}

interface ScoreData {
  player_name: string;
  score: number;
  max_score: number;
  time_spent: number;
  game_mode: string;
  difficulty: string;
  question_count: number;
  created_at: string;
  categories?: number[];
}

export default function ScoreSubmission({
  open,
  onClose,
  score,
  maxScore,
  timeSpent,
  difficulty,
  questionCount,
  categories
}: ScoreSubmissionProps) {
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const handleSubmit = async () => {
    if (!playerName.trim()) {
      console.log('Nom du joueur vide');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Vérifier si le nombre de questions est valide
      const validQuestionCounts = [6, 25, 50, 100, 150, 200];
      if (!validQuestionCounts.includes(questionCount)) {
        throw new Error(`Le nombre de questions ${questionCount} n'est pas valide. Les valeurs autorisées sont : ${validQuestionCounts.join(', ')}`);
      }

      const scoreData: ScoreData = {
        player_name: playerName.trim(),
        score,
        max_score: maxScore,
        time_spent: Number(timeSpent.toFixed(1)),
        game_mode: 'classique',
        difficulty,
        question_count: questionCount,
        created_at: new Date().toISOString()
      };

      if (categories) {
        scoreData.categories = categories;
      }

      console.log('Tentative de sauvegarde avec les données:', scoreData);

      const { error } = await supabase
        .from('scores')
        .insert([scoreData]);

      if (error) {
        console.error('Erreur Supabase:', error);
        throw error;
      }

      console.log('Score sauvegardé avec succès');
      onClose();
      navigate('/scores');
    } catch (error: any) {
      console.error('Erreur détaillée lors de la sauvegarde:', error);
      let errorMessage = 'Erreur lors de la sauvegarde du score. ';
      
      if (error?.message) {
        errorMessage += error.message;
      }
      
      if (error?.code) {
        errorMessage += ` (Code: ${error.code})`;
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Félicitations!</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Résumé de votre partie
          </Typography>
          <Typography>Score: {score} points</Typography>
          <Typography>Score maximum: {maxScore} points</Typography>
          <Typography>Temps total: {formatTime(timeSpent)}</Typography>
          <Typography>Difficulté: {difficulty}</Typography>
          <Typography>Nombre de questions: {questionCount}</Typography>
          {categories && (
            <Typography>Catégories: {categories.join(', ')}</Typography>
          )}
        </Box>

        <TextField
          autoFocus
          margin="dense"
          label="Votre nom"
          fullWidth
          variant="outlined"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          helperText="Entrez votre nom pour sauvegarder votre score"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={!playerName.trim() || isSubmitting}
        >
          {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
