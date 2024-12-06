import React, { useState } from 'react';
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
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';

interface LeaderboardEntry {
  rang: number;
  joueur: string;
  score: number;
  parties: number;
  moyenne: number;
}

export default function Scores() {
  const [period, setPeriod] = useState('Cette semaine');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);

  const handlePeriodChange = (event: any) => {
    setPeriod(event.target.value);
    // Here you would typically fetch new data based on the selected period
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        Classement
      </Typography>

      <Box sx={{ minWidth: 120, mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel id="period-select-label">Période</InputLabel>
          <Select
            labelId="period-select-label"
            id="period-select"
            value={period}
            label="Période"
            onChange={handlePeriodChange}
          >
            <MenuItem value="Cette semaine">Cette semaine</MenuItem>
            <MenuItem value="Ce mois">Ce mois</MenuItem>
            <MenuItem value="Cette année">Cette année</MenuItem>
            <MenuItem value="Tout">Tout</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="classement table">
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
            {leaderboardData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Aucune donnée disponible pour cette période
                </TableCell>
              </TableRow>
            ) : (
              leaderboardData.map((row) => (
                <TableRow key={row.rang}>
                  <TableCell component="th" scope="row">
                    {row.rang}
                  </TableCell>
                  <TableCell>{row.joueur}</TableCell>
                  <TableCell align="right">{row.score}</TableCell>
                  <TableCell align="right">{row.parties}</TableCell>
                  <TableCell align="right">{row.moyenne}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
