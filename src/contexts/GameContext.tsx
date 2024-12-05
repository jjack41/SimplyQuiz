import { createContext, useContext, useReducer, ReactNode, useState, useEffect } from 'react';
import { useStats } from './StatsContext';
import { supabase } from '../lib/supabase';

interface GameState {
  lives: number;
  lastLifeRecoveryTime: number;
  boosters: {
    [key: string]: number;
    fiftyFifty: number;
    showAnswer: number;
    articleLink: number;
    wheel_spin: number;
  };
}

type GameAction =
  | { type: 'CONSUME_LIFE' }
  | { type: 'RECOVER_LIFE' }
  | { type: 'ADD_BOOSTER'; payload: { type: string, amount: number } }
  | { type: 'USE_BOOSTER'; payload: { type: string } };

interface GameContextType {
  state: GameState;
  consumeLife: () => void;
  recoverLife: () => void;
  addBooster: (type: string, amount?: number) => void;
  useBooster: (type: string) => boolean;
  activeBooster: string | null;
  difficultyLevel: string;
  calculatePointsWithBooster: (basePoints: number) => number;
  activateBooster: (boosterType: string) => Promise<boolean>;
  fetchQuestions: () => Promise<void>;
  user: any;
}

// Constantes
const MAX_LIVES = 3; // Nombre maximum de vies
const LIFE_RECOVERY_TIME = 30 * 60 * 1000; // 30 minutes en millisecondes

// État initial
const initialState: GameState = {
  lives: MAX_LIVES,
  lastLifeRecoveryTime: Date.now(),
  boosters: {
    fiftyFifty: 1,
    showAnswer: 1,
    articleLink: 1,
    wheel_spin: 0  // Sera mis à jour depuis la base de données
  }
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'CONSUME_LIFE':
      return {
        ...state,
        lives: Math.max(0, state.lives - 1),
      };
    case 'RECOVER_LIFE':
      return {
        ...state,
        lives: Math.min(MAX_LIVES, state.lives + 1),
        lastLifeRecoveryTime: Date.now(),
      };
    case 'ADD_BOOSTER':
      const boosterType = action.payload.type;
      if (!boosterType) return state;
      
      return {
        ...state,
        boosters: {
          ...state.boosters,
          [boosterType]: state.boosters[boosterType] + action.payload.amount,
        },
      };
    case 'USE_BOOSTER':
      return {
        ...state,
        boosters: {
          ...state.boosters,
          [action.payload.type]: Math.max(0, state.boosters[action.payload.type] - 1),
        },
      };
    default:
      return state;
  }
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { userStats, useBooster } = useStats();
  const [activeBooster, setActiveBooster] = useState<string | null>(null);
  const [difficultyLevel, setDifficultyLevel] = useState<string>('normal');
  const [user, setUser] = useState<any>(null);

  // Charger les wheel_spins au démarrage
  useEffect(() => {
    const fetchUserAndWheelSpins = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('Current user:', user);
        setUser(user);

        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('wheel_spins')
            .eq('id', user.id)
            .single();

          console.log('Profile data from DB:', data);
          
          if (error) {
            console.error('Error fetching wheel_spins:', error);
            return;
          }

          if (data) {
            console.log('Setting initial wheel_spins from DB:', data.wheel_spins);
            // Réinitialiser complètement l'état des wheel_spins
            dispatch({
              type: 'ADD_BOOSTER',
              payload: {
                type: 'wheel_spin',
                amount: data.wheel_spins
              }
            });
          }
        }
      } catch (error) {
        console.error('Error in fetchUserAndWheelSpins:', error);
      }
    };

    fetchUserAndWheelSpins();
  }, []);

  // Surveiller les changements de wheel_spins et mettre à jour la base de données
  useEffect(() => {
    const updateWheelSpinsInDB = async () => {
      if (!user) return;

      try {
        console.log('Updating wheel_spins in DB to:', state.boosters.wheel_spin);
        const { error } = await supabase
          .from('profiles')
          .update({ wheel_spins: state.boosters.wheel_spin })
          .eq('id', user.id);

        if (error) {
          console.error('Error updating wheel_spins in DB:', error);
        }
      } catch (error) {
        console.error('Error in updateWheelSpinsInDB:', error);
      }
    };

    updateWheelSpinsInDB();
  }, [state.boosters.wheel_spin, user]);

  const calculatePointsWithBooster = (basePoints: number) => {
    if (!activeBooster) return basePoints;
    
    switch (activeBooster) {
      case 'double_points':
        return basePoints * 2;
      case 'triple_points':
        return basePoints * 3;
      default:
        return basePoints;
    }
  };

  const activateBooster = async (boosterType: string): Promise<boolean> => {
    const success = await useBooster(boosterType);
    if (success) {
      setActiveBooster(boosterType);
      // Le booster se désactive après une question
      return true;
    }
    return false;
  };

  const getAdaptiveDifficulty = () => {
    if (!userStats) return 'normal';
    
    const { success_rate } = userStats;
    if (success_rate > 80) return 'hard';
    if (success_rate < 40) return 'easy';
    return 'normal';
  };

  useEffect(() => {
    if (userStats) {
      setDifficultyLevel(getAdaptiveDifficulty());
    }
  }, [userStats]);

  const fetchQuestions = async () => {
    try {
      const { data: _, error } = await supabase
        .rpc('get_adaptive_questions', {
          p_difficulty: difficultyLevel,
          p_limit: 10
        });

      if (error) throw error;
      // setQuestions(data); // This line was commented out because setQuestions is not defined in this context
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  // Vérifier la récupération des vies toutes les minutes
  setInterval(() => {
    const timeSinceLastRecovery = Date.now() - state.lastLifeRecoveryTime;
    if (timeSinceLastRecovery >= LIFE_RECOVERY_TIME && state.lives < MAX_LIVES) {
      dispatch({ type: 'RECOVER_LIFE' });
    }
  }, 60000);

  // Consommer une vie
  const consumeLife = () => {
    dispatch({ type: 'CONSUME_LIFE' });
  };

  // Récupérer une vie
  const recoverLife = () => {
    dispatch({ type: 'RECOVER_LIFE' });
  };

  // Ajouter un booster
  const addBooster = async (type: string, amount: number = 1) => {
    dispatch({ 
      type: 'ADD_BOOSTER', 
      payload: { 
        type,
        amount
      } 
    });
  };

  // Utiliser un booster
  const useBoosterContext = (type: string): boolean => {
    if (state.boosters[type] > 0) {
      dispatch({ type: 'USE_BOOSTER', payload: { type } });
      return true;
    }
    return false;
  };

  return (
    <GameContext.Provider value={{
      state,
      consumeLife,
      recoverLife,
      addBooster,
      useBooster: useBoosterContext,
      activeBooster,
      difficultyLevel,
      calculatePointsWithBooster,
      activateBooster,
      fetchQuestions,
      user
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameContext() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameContext doit être utilisé à l\'intérieur d\'un GameProvider');
  }
  return context;
}
