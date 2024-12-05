import { useReducer, useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
  Badge,
  Button,
  LinearProgress,
  Alert
} from '@mui/material';
import { useGameContext } from '../contexts/GameContext';
import { useAuthContext } from '../contexts/AuthContext';
import { useStats } from '../contexts/StatsContext';
import { supabase } from '../lib/supabase';
import type { Question } from '../types/database';
import Flashcard from '../components/Flashcard';
import ScoreSubmission from '../components/ScoreSubmission';
import FiftyFiftyIcon from '@mui/icons-material/ContentCut';
import ShowAnswerIcon from '@mui/icons-material/Visibility';
import ArticleLinkIcon from '@mui/icons-material/Link';
import { motion, AnimatePresence } from 'framer-motion';
import { PointsPopup, AchievementPopup, BoosterEffect } from '../components/GameEffects';
import { GameTutorial } from '../components/GameTutorial';
import toast from 'react-hot-toast';
import { mediaDB, type MediaItem } from '../services/mediaDB';

// Types
type GameStatus = 'loading' | 'playing' | 'error' | 'finished';

interface GameState {
  status: GameStatus;
  questions: Question[];
  currentIndex: number;
  score: number;
  showingAnswer: boolean;
  error?: string;
  isTransitioning: boolean;
  boosters: {
    fiftyFifty: number;
    showAnswer: number;
    articleLink: number;
  };
  difficulty: 'easy' | 'normal' | 'hard';
  difficultyProgress: number;
}

type GameAction =
  | { type: 'INIT_GAME'; payload: Question[] }
  | { type: 'NEXT_QUESTION' }
  | { type: 'UPDATE_SCORE' }
  | { type: 'SHOW_ANSWER' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'FINISH_GAME' }
  | { type: 'START_TRANSITION' }
  | { type: 'END_TRANSITION' }
  | { type: 'USE_BOOSTER'; payload: 'fiftyFifty' | 'showAnswer' | 'articleLink' }
  | { type: 'START_LOADING' }
  | { type: 'SET_DIFFICULTY'; payload: 'easy' | 'normal' | 'hard' }
  | { type: 'UPDATE_DIFFICULTY_PROGRESS'; payload: number };

// Reducer
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INIT_GAME':
      return {
        ...state,
        status: 'playing',
        questions: action.payload,
        currentIndex: 0,
        score: 0,
        showingAnswer: false,
        isTransitioning: false,
        error: undefined,
        difficultyProgress: 0
      };
    case 'START_LOADING':
      return {
        ...state,
        status: 'loading',
        error: undefined
      };
    case 'SET_DIFFICULTY':
      return {
        ...state,
        difficulty: action.payload
      };
    case 'UPDATE_DIFFICULTY_PROGRESS':
      return {
        ...state,
        difficultyProgress: action.payload
      };
    case 'NEXT_QUESTION':
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        showingAnswer: false,
      };
    case 'UPDATE_SCORE':
      return {
        ...state,
        score: state.score + 1,
      };
    case 'SHOW_ANSWER':
      return {
        ...state,
        showingAnswer: true,
      };
    case 'SET_ERROR':
      return {
        ...state,
        status: 'error',
        error: action.payload,
      };
    case 'FINISH_GAME':
      return {
        ...state,
        status: 'finished',
      };
    case 'USE_BOOSTER':
      return {
        ...state,
        boosters: {
          ...state.boosters,
          [action.payload]: state.boosters[action.payload] - 1
        }
      };
    default:
      return state;
  }
}

// Component
export default function GameClassique() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { addBooster } = useGameContext();
  const { } = useStats();

  // Vérification des paramètres et redirection si nécessaire
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!location.state?.categories || !Array.isArray(location.state.categories) || location.state.categories.length === 0) {
      navigate('/categories');
      return;
    }
  }, [user, location.state, navigate]);

  const [showScoreSubmission, setShowScoreSubmission] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [pointsAnimation, setPointsAnimation] = useState<{points: number, position: {x: number, y: number}} | null>(null);
  const [lastAchievement, setLastAchievement] = useState<any>(null);
  const [showBoosterEffect, setShowBoosterEffect] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);
  const [difficultyChangeMessage, setDifficultyChangeMessage] = useState<{
    from: string;
    to: string;
    progress: number;
  } | null>(null);

  // Fonction pour obtenir la difficulté initiale
  const getInitialDifficulty = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_user_stats', {
        user_id_param: userId
      });

      if (error) throw error;

      return data?.[0]?.difficulty_level || 'normal';
    } catch (error) {
      console.error('Erreur lors de la récupération de la difficulté:', error);
      return 'normal';
    }
  };

  // Effet pour initialiser la difficulté
  useEffect(() => {
    const initializeDifficulty = async () => {
      if (user) {
        const savedDifficulty = await getInitialDifficulty(user.id);
        dispatch({ type: 'SET_DIFFICULTY', payload: savedDifficulty });
      }
    };

    initializeDifficulty();
  }, [user]);

  // Initialisation de l'état avec un statut initial de 'loading'
  const [state, dispatch] = useReducer(gameReducer, {
    status: 'loading',
    questions: [],
    currentIndex: 0,
    score: 0,
    showingAnswer: false,
    isTransitioning: false,
    difficulty: 'normal', // Difficulté initiale
    boosters: {
      fiftyFifty: 1,
      showAnswer: 1,
      articleLink: 1,
    },
    difficultyProgress: 0
  });

  const currentQuestion = state.questions[state.currentIndex];

  // Fonction pour calculer le taux de réussite actuel
  const calculateSuccessRate = useCallback(() => {
    if (state.currentIndex === 0) return 0;
    return (state.score / state.currentIndex) * 100;
  }, [state.score, state.currentIndex]);

  // Effet pour effacer le message après un délai
  useEffect(() => {
    if (difficultyChangeMessage) {
      const timer = setTimeout(() => {
        setDifficultyChangeMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [difficultyChangeMessage]);

  // Fonction pour ajuster la difficulté de manière progressive
  const adjustDifficulty = useCallback(async () => {
    if (state.currentIndex >= 3 && user) {
      const successRate = calculateSuccessRate();
      const currentProgress = state.difficultyProgress || 0;
      let progressDelta = 0;

      // Calculer le changement de progression
      if (successRate >= 80) {
        progressDelta = successRate >= 90 ? 2 : 1;
      } else if (successRate <= 40) {
        progressDelta = successRate <= 30 ? -2 : -1;
      }

      // Mettre à jour la progression
      const newProgress = Math.max(0, Math.min(10, currentProgress + progressDelta));
      dispatch({ type: 'UPDATE_DIFFICULTY_PROGRESS', payload: newProgress });

      // Ajuster la difficulté en fonction de la progression
      let newDifficulty = state.difficulty;
      if (newProgress >= 7 && state.difficulty !== 'hard') {
        newDifficulty = 'hard';
      } else if (newProgress <= 3 && state.difficulty !== 'easy') {
        newDifficulty = 'easy';
      } else if (newProgress > 3 && newProgress < 7 && state.difficulty !== 'normal') {
        newDifficulty = 'normal';
      }

      // Ne changer la difficulté que si nécessaire
      if (newDifficulty !== state.difficulty) {
        console.log(`Ajustement progressif de la difficulté: ${state.difficulty} -> ${newDifficulty} (Progression: ${newProgress}/10)`);
        dispatch({ type: 'SET_DIFFICULTY', payload: newDifficulty });

        // Persister les changements dans la base de données
        try {
          await supabase.rpc('update_difficulty_progress', {
            user_id_param: user.id,
            new_progress: newProgress,
            new_difficulty: newDifficulty
          });

          // Afficher un message à l'utilisateur
          setDifficultyChangeMessage({
            from: state.difficulty,
            to: newDifficulty,
            progress: newProgress
          });
        } catch (error) {
          console.error('Erreur lors de la mise à jour de la difficulté:', error);
        }
      }
    }
  }, [state.currentIndex, state.difficulty, state.difficultyProgress, calculateSuccessRate, user]);

  // Charger la progression initiale au démarrage du jeu
  useEffect(() => {
    const loadUserProgress = async () => {
      if (user) {
        try {
          const { data, error } = await supabase.rpc('get_user_stats', {
            user_id_param: user.id
          });

          if (error) throw error;

          if (data && data.length > 0) {
            dispatch({ type: 'UPDATE_DIFFICULTY_PROGRESS', payload: data[0].difficulty_progress });
            if (data[0].difficulty_level) {
              dispatch({ type: 'SET_DIFFICULTY', payload: data[0].difficulty_level });
            }
          }
        } catch (error) {
          console.error('Erreur lors du chargement de la progression:', error);
        }
      }
    };

    loadUserProgress();
  }, [user]);

  const fetchQuestions = useCallback(async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      dispatch({ type: 'START_LOADING' });
      const locationState = location.state as { categories?: number[] };
      const selectedCategories = locationState?.categories || [];

      console.log('Chargement des questions adaptatives:', {
        difficulty: state.difficulty,
        categories: selectedCategories
      });

      // Appel à la fonction RPC get_adaptive_questions avec les catégories
      const { data: initialQuestions, error: questionsError } = await supabase
        .rpc('get_adaptive_questions', {
          p_difficulty: state.difficulty,
          p_categories: selectedCategories,
          p_limit: 10  // Limiter à 10 questions
        });

      if (questionsError) {
        console.error('Erreur RPC:', questionsError);
        dispatch({ type: 'SET_ERROR', payload: 'Erreur lors du chargement des questions' });
        return;
      }

      if (!initialQuestions || initialQuestions.length === 0) {
        console.log('Aucune question trouvée, tentative avec difficulté normale...');
        const { data: fallbackQuestions, error: fallbackError } = await supabase
          .rpc('get_adaptive_questions', {
            p_difficulty: 'normal',
            p_categories: selectedCategories,
            p_limit: 10
          });
        
        if (fallbackError || !fallbackQuestions || fallbackQuestions.length === 0) {
          dispatch({ type: 'SET_ERROR', payload: 'Aucune question disponible' });
          return;
        }

        dispatch({ type: 'INIT_GAME', payload: fallbackQuestions });
        return;
      }

      // Précharger les images des questions
      const filterQuestionsWithImages = (questions: Question[]) => questions.filter((q: Question) => q.image_url);
      const questionsWithImages = filterQuestionsWithImages(initialQuestions);
      if (questionsWithImages.length > 0) {
        try {
          await Promise.all(
            questionsWithImages.map(async (question: Question) => {
              if (question.image_url) {
                try {
                  // Essayer d'abord de récupérer l'image depuis IndexedDB
                  const imageId = question.image_url.includes('supabase.co') 
                    ? question.image_url.split('/').pop() 
                    : question.image_url;
                  
                  if (!imageId) return;

                  // Vérifier si l'image existe déjà dans IndexedDB
                  const existingImage = await mediaDB.get(imageId);
                  if (existingImage) {
                    console.log('Image déjà en cache:', imageId);
                    return;
                  }

                  // Essayer de récupérer l'image depuis le serveur local
                  const localResponse = await fetch(`http://localhost:3002/media/${imageId}`);
                  if (localResponse.ok) {
                    const blob = await localResponse.blob();
                    const mediaItem: MediaItem = {
                      id: imageId,
                      type: 'image',
                      blob,
                      metadata: {
                        name: imageId,
                        size: blob.size,
                        lastModified: Date.now()
                      }
                    };
                    await mediaDB.putMediaItem(mediaItem);
                    return;
                  }

                  // Si l'image n'est pas trouvée localement et que c'est une URL Supabase,
                  // essayer de la récupérer depuis Supabase
                  if (question.image_url.includes('supabase.co')) {
                    const { data: imageData } = await supabase.storage
                      .from('media')
                      .download(question.image_url);
                    
                    if (imageData) {
                      const mediaItem: MediaItem = {
                        id: imageId,
                        type: 'image',
                        blob: imageData,
                        metadata: {
                          name: imageId,
                          size: imageData.size,
                          lastModified: Date.now()
                        }
                      };
                      await mediaDB.putMediaItem(mediaItem);
                    }
                  }
                } catch (error) {
                  console.error('Erreur lors du chargement de l\'image:', error);
                  // Continue même si le chargement d'une image échoue
                }
              }
            })
          );
        } catch (error) {
          console.error('Erreur lors du préchargement des images:', error);
          // Continue même si le préchargement échoue
        }
      }

      dispatch({ type: 'INIT_GAME', payload: initialQuestions });
    } catch (error) {
      console.error('Erreur lors du chargement des questions:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors du chargement des questions' });
    }
  }, [user, navigate, location.state, state.difficulty]);

  // Effet pour charger les questions initiales
  useEffect(() => {
    const initGame = async () => {
      dispatch({ type: 'START_LOADING' });
      setGameStartTime(Date.now()); // Initialiser le temps de début
      try {
        await fetchQuestions();
      } catch (error) {
        console.error('Erreur lors du chargement des questions:', error);
      }
    };

    initGame();
  }, [fetchQuestions]);

  // Effet pour ajuster la difficulté après chaque réponse
  useEffect(() => {
    if (!state.showingAnswer && state.currentIndex > 0) {
      adjustDifficulty();
    }
  }, [state.currentIndex, adjustDifficulty, state.showingAnswer]);

  useEffect(() => {
    // Reset the start time whenever a new question is loaded
    setQuestionStartTime(Date.now());
  }, [state.currentIndex]);

  const calculateElapsedTime = (): number => {
    if (questionStartTime === null) return 0;
    return Date.now() - questionStartTime;
  };

  const handleAnswer = async (answer: string) => {
    const isCorrect = currentQuestion.correct_answers.includes(answer);
    if (isCorrect) {
      dispatch({ type: 'UPDATE_SCORE' });
    }

    // Enregistrer la réponse dans la base de données
    try {
      await supabase.from('user_answers').insert([{
        user_id: user?.id,
        question_id: currentQuestion.id,
        answer: answer,
        is_correct: isCorrect,
        response_time: calculateElapsedTime(),
        game_mode: 'classique',
        difficulty_level: state.difficulty
      }]);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la réponse:', error);
    }

    dispatch({ type: 'SHOW_ANSWER' });
  };

  const handleGameCompletion = async () => {
    const successRate = (state.score / state.questions.length) * 100;
    const totalGameTime = (Date.now() - gameStartTime) / 1000; // Convertir en secondes
    
    try {
      // Appeler la fonction RPC pour mettre à jour les récompenses
      const { error } = await supabase.rpc('update_game_rewards', {
        p_user_id: user?.id,
        p_success_rate: successRate
      });

      if (error) {
        console.error('Erreur lors de la mise à jour des récompenses:', error);
        toast.error('Erreur lors de la sauvegarde des récompenses');
        return;
      }

      // Afficher les récompenses obtenues
      if (successRate === 100) {
        addBooster('wheel_spin', 2);
        addBooster('life', 1);
        toast.success('Parfait ! Vous gagnez 2 tours de roue et 1 vie !');
      } else if (successRate >= 90) {
        addBooster('wheel_spin', 1);
        addBooster('life', 1);
        toast.success('Excellent ! Vous gagnez 1 tour de roue et 1 vie !');
      } else if (successRate >= 80) {
        addBooster('life', 1);
        toast.success('Très bien ! Vous gagnez 1 vie !');
      } else if (successRate >= 70) {
        addBooster('life', 1);
        toast.success('Bien ! Vous gagnez 1 vie !');
      } else {
        toast.error('Vous perdez 1 vie. Continuez à vous entraîner !');
      }

      // Mettre à jour le contexte local
      // await loadUserStats();
      
    } catch (error) {
      console.error('Erreur inattendue:', error);
      toast.error('Une erreur est survenue');
    }

    // Afficher le score final avec le temps total
    setShowScoreSubmission(true);
    console.log(`Partie terminée en ${totalGameTime.toFixed(1)} secondes`);
  };

  const handleNextQuestion = () => {
    if (state.currentIndex < state.questions.length - 1) {
      dispatch({ type: 'NEXT_QUESTION' });
    } else {
      dispatch({ type: 'FINISH_GAME' });
      handleGameCompletion();
    }
  };

  const handleBoosterUse = (boosterType: 'fiftyFifty' | 'showAnswer' | 'articleLink'): boolean => {
    if (state.boosters[boosterType] > 0) {
      // Handle the async operation separately
      Promise.resolve().then(() => {
        dispatch({ type: 'USE_BOOSTER', payload: boosterType });
        setShowBoosterEffect(boosterType);
        setTimeout(() => setShowBoosterEffect(null), 2000);
      });
      return true;
    }
    return false;
  };

  // Composant pour afficher le changement de difficulté
  const DifficultyChangeAlert = () => {
    if (!difficultyChangeMessage) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      >
        <Typography>
          Niveau adapté : {difficultyChangeMessage.from} → {difficultyChangeMessage.to}
          <LinearProgress 
            variant="determinate" 
            value={difficultyChangeMessage.progress * 10}
            sx={{ mt: 1 }}
          />
        </Typography>
      </motion.div>
    );
  };

  if (state.status === 'loading') {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Chargement du jeu...
        </Typography>
      </Container>
    );
  }

  if (state.status === 'error') {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Typography color="error" variant="h6">
          {state.error || 'Une erreur est survenue'}
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/categories')}
          sx={{ mt: 2 }}
        >
          Retour aux catégories
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <DifficultyChangeAlert />
      { state.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      ) : null }
      <AnimatePresence mode="wait">
        {state.status === 'playing' && state.questions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            key="playing"
          >
            <Box sx={{ mb: 4 }}>
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <Typography variant="h6" align="center" gutterBottom>
                  Question {state.currentIndex + 1}/{state.questions.length}
                </Typography>
                <Typography variant="h4" align="center" color="primary">
                  Score: {state.score}
                </Typography>
              </motion.div>
            </Box>

            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", stiffness: 100 }}
              key={state.currentIndex}
            >
              <Flashcard
                question={currentQuestion}
                showingAnswer={state.showingAnswer}
                onAnswer={handleAnswer}
                onNextQuestion={handleNextQuestion}
                nextQuestions={[
                  state.questions[state.currentIndex + 1],
                  state.questions[state.currentIndex + 2]
                ].filter(Boolean)}
                currentScore={state.score}
                timeLeft={0}
                maxTime={0}
                onBoosterUse={handleBoosterUse}
                boosters={state.boosters}
              />
            </motion.div>

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Tooltip title={`50/50 (${state.boosters.fiftyFifty} disponibles)`}>
                  <Badge badgeContent={state.boosters.fiftyFifty} color="primary">
                    <IconButton 
                      onClick={() => handleBoosterUse('fiftyFifty')}
                      disabled={state.boosters.fiftyFifty === 0 || state.showingAnswer}
                    >
                      <FiftyFiftyIcon />
                    </IconButton>
                  </Badge>
                </Tooltip>

                <Tooltip title={`Voir la réponse (${state.boosters.showAnswer} disponibles)`}>
                  <Badge badgeContent={state.boosters.showAnswer} color="primary">
                    <IconButton 
                      onClick={() => handleBoosterUse('showAnswer')}
                      disabled={state.boosters.showAnswer === 0 || state.showingAnswer}
                    >
                      <ShowAnswerIcon />
                    </IconButton>
                  </Badge>
                </Tooltip>

                <Tooltip title={`Lien article (${state.boosters.articleLink} disponibles)`}>
                  <Badge badgeContent={state.boosters.articleLink} color="primary">
                    <IconButton 
                      onClick={() => handleBoosterUse('articleLink')}
                      disabled={state.boosters.articleLink === 0 || !currentQuestion?.feedback}
                    >
                      <ArticleLinkIcon />
                    </IconButton>
                  </Badge>
                </Tooltip>
              </Box>
            </motion.div>
          </motion.div>
        )}

        {state.status === 'finished' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            key="finished"
          >
            <Box textAlign="center">
              <Typography variant="h4" gutterBottom>
                Partie terminée !
              </Typography>
              <Typography variant="h5">
                Score final : {state.score} / {state.questions.length}
              </Typography>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      <GameTutorial 
        open={showTutorial} 
        onClose={() => setShowTutorial(false)} 
      />

      <AnimatePresence>
        {pointsAnimation && (
          <PointsPopup
            points={pointsAnimation.points}
            position={pointsAnimation.position}
            onComplete={() => setPointsAnimation(null)}
          />
        )}
        {lastAchievement && (
          <AchievementPopup
            achievement={lastAchievement}
            onComplete={() => setLastAchievement(null)}
          />
        )}
        {showBoosterEffect && (
          <BoosterEffect
            type={showBoosterEffect}
            onComplete={() => setShowBoosterEffect(null)}
          />
        )}
      </AnimatePresence>

      {showScoreSubmission && (
        <ScoreSubmission
          open={showScoreSubmission}
          onClose={() => setShowScoreSubmission(false)}
          score={state.score}
          maxScore={state.questions.length}
          timeSpent={(Date.now() - gameStartTime) / 1000}
          difficulty={state.difficulty}
          questionCount={state.questions.length}
          categories={location.state?.categories}
        />
      )}
    </Container>
  );
}
