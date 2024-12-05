export interface UserStats {
  total_games: number;
  average_score: number;
  total_correct: number;
  total_questions: number;
  success_rate: number;
  favorite_category: number;
  best_difficulty_level: string;
  streak_days: number;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  condition_type: string;
  condition_value: number;
  reward_type: string;
  reward_amount: number;
  icon_name: string;
  unlocked_at?: string;
}

export interface UserLevel {
  current_level: number;
  current_xp: number;
  total_xp: number;
  xp_for_next_level: number;
}

export interface DailyReward {
  reward_type: string;
  reward_amount: number;
  streak_days: number;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  score: number;
  games_played: number;
  average_score: number;
}

export interface Challenge {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  category_id: number;
  required_score: number;
  reward_type: string;
  reward_amount: number;
  current_progress?: number;
  completed?: boolean;
}

export interface Booster {
  booster_type: string;
  available_count: number;
  total_used: number;
  effectiveness: number;
}
