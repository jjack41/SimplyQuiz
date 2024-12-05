import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from './AuthContext';
import type { 
  UserStats, 
  Achievement, 
  UserLevel, 
  DailyReward, 
  LeaderboardEntry, 
  Challenge,
  Booster 
} from '../types/game';

interface StatsContextType {
  userStats: UserStats | null;
  achievements: Achievement[];
  userLevel: UserLevel | null;
  challenges: Challenge[];
  leaderboard: LeaderboardEntry[];
  boosters: Booster[];
  loadUserStats: () => Promise<void>;
  claimDailyReward: () => Promise<DailyReward | null>;
  refreshLeaderboard: (timeframe?: string, categoryId?: number) => Promise<void>;
  useBooster: (boosterType: string) => Promise<boolean>;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export function useStats() {
  const context = useContext(StatsContext);
  if (context === undefined) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return context;
}

export function StatsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [boosters, setBoosters] = useState<Booster[]>([]);

  useEffect(() => {
    if (user) {
      loadUserStats();
      loadUserLevel();
      loadAchievements();
      loadChallenges();
      loadLeaderboard();
      loadBoosters();
    }
  }, [user]);

  const loadUserStats = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .rpc('get_user_statistics', { p_user_id: user.id });

    if (error) {
      console.error('Error loading user stats:', error);
      return;
    }

    setUserStats(data[0]);
  };

  const loadUserLevel = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .rpc('get_user_level', { p_user_id: user.id });

    if (error) {
      console.error('Error loading user level:', error);
      return;
    }

    if (data && data[0]) {
      setUserLevel(data[0]);
    }
  };

  const loadAchievements = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('achievements')
      .select(`
        *,
        user_achievements (
          unlocked_at
        )
      `)
      .order('condition_value', { ascending: true });

    if (error) {
      console.error('Error loading achievements:', error);
      return;
    }

    setAchievements(data);
  };

  const loadChallenges = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('challenges')
      .select(`
        *,
        user_challenges (
          current_progress,
          completed
        )
      `)
      .gte('end_date', new Date().toISOString())
      .order('end_date', { ascending: true });

    if (error) {
      console.error('Error loading challenges:', error);
      return;
    }

    setChallenges(data);
  };

  const loadLeaderboard = async (timeframe: string = 'weekly', categoryId?: number) => {
    const { data, error } = await supabase
      .rpc('get_leaderboard', { 
        p_timeframe: timeframe,
        p_category_id: categoryId,
        p_limit: 100
      });

    if (error) {
      console.error('Error loading leaderboard:', error);
      return;
    }

    setLeaderboard(data);
  };

  const loadBoosters = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .rpc('get_booster_stats', { p_user_id: user.id });

    if (error) {
      console.error('Error loading boosters:', error);
      return;
    }

    setBoosters(data);
  };

  const claimDailyReward = async () => {
    if (!user) return null;

    const { data, error } = await supabase
      .rpc('claim_daily_rewards', { p_user_id: user.id });

    if (error) {
      console.error('Error claiming daily reward:', error);
      return null;
    }

    await loadUserStats();
    await loadBoosters();
    return data[0];
  };

  const useBooster = async (boosterType: string) => {
    if (!user) return false;

    const { data, error } = await supabase
      .rpc('use_booster', { 
        p_user_id: user.id,
        p_booster_type: boosterType
      });

    if (error) {
      console.error('Error using booster:', error);
      return false;
    }

    await loadBoosters();
    return data;
  };

  const value = {
    userStats,
    achievements,
    userLevel,
    challenges,
    leaderboard,
    boosters,
    loadUserStats,
    claimDailyReward,
    refreshLeaderboard: loadLeaderboard,
    useBooster
  };

  return (
    <StatsContext.Provider value={value}>
      {children}
    </StatsContext.Provider>
  );
}
