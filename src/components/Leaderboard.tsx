import { useState } from 'react';
import { useStats } from '../contexts/StatsContext';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { FaMedal } from 'react-icons/fa';

export const Leaderboard = () => {
  const { leaderboard, refreshLeaderboard } = useStats();
  const [timeframe, setTimeframe] = useState('weekly');

  const handleTimeframeChange = (event: any) => {
    const newTimeframe = event.target.value;
    setTimeframe(newTimeframe);
    refreshLeaderboard(newTimeframe);
  };

  const getMedalColor = (rank: number) => {
    switch(rank) {
      case 1: return 'text-yellow-500';
      case 2: return 'text-gray-400';
      case 3: return 'text-amber-600';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Classement</h2>
        <FormControl variant="outlined" size="small">
          <InputLabel>Période</InputLabel>
          <Select
            value={timeframe}
            onChange={handleTimeframeChange}
            label="Période"
          >
            <MenuItem value="daily">Aujourd'hui</MenuItem>
            <MenuItem value="weekly">Cette semaine</MenuItem>
            <MenuItem value="monthly">Ce mois</MenuItem>
            <MenuItem value="all_time">Tout temps</MenuItem>
          </Select>
        </FormControl>
      </div>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rang</TableCell>
              <TableCell>Joueur</TableCell>
              <TableCell align="right">Score</TableCell>
              <TableCell align="right">Parties</TableCell>
              <TableCell align="right">Moyenne</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaderboard.map((entry) => (
              <TableRow key={entry.user_id}>
                <TableCell>
                  <div className="flex items-center">
                    {entry.rank <= 3 ? (
                      <FaMedal className={getMedalColor(entry.rank)} size={20} />
                    ) : (
                      entry.rank
                    )}
                  </div>
                </TableCell>
                <TableCell>{entry.username}</TableCell>
                <TableCell align="right">{entry.score}</TableCell>
                <TableCell align="right">{entry.games_played}</TableCell>
                <TableCell align="right">{entry.average_score}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};
