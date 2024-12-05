import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { supabase } from '../lib/supabase';

interface Score {
  id: number;
  player_name: string;
  score: number;
  time_spent: number;
  game_mode: string;
  created_at: string;
}

export default function Scores() {
  const [tabValue, setTabValue] = useState(0);
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScores = async () => {
    try {
      setLoading(true);
      // Map the tab value to the correct game mode in the database
      const gameMode = tabValue === 0 ? 'classique' : tabValue === 1 ? 'contre-la-montre' : 'defis';
      
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('game_mode', gameMode)
        .order('score', { ascending: false })
        .order('time_spent', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Erreur lors de la récupération des scores:', error);
        throw error;
      }

      setScores(data || []);
    } catch (error) {
      console.error('Error fetching scores:', error);
      setScores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, [tabValue]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(1)}s`;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Meilleurs Scores
      </Typography>

      <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 3 }}>
        <Tab label="Mode Classique" />
        <Tab label="Contre la Montre" />
        <Tab label="Défis" />
      </Tabs>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><EmojiEventsIcon /> Rang</TableCell>
              <TableCell>Joueur</TableCell>
              <TableCell>Score</TableCell>
              <TableCell>Temps</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : scores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  Aucun score disponible
                </TableCell>
              </TableRow>
            ) : (
              scores.map((score, index) => (
                <TableRow key={score.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{score.player_name}</TableCell>
                  <TableCell>{score.score}</TableCell>
                  <TableCell>{formatTime(score.time_spent)}</TableCell>
                  <TableCell>
                    {new Date(score.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
