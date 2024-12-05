-- Create user_answers table
CREATE TABLE IF NOT EXISTS user_answers (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    response_time INTEGER NOT NULL, -- Time taken to answer in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    game_mode TEXT NOT NULL, -- 'classique', 'contre-la-montre', etc.
    difficulty_level TEXT, -- 'facile', 'moyen', 'difficile'
    boosters_used JSONB DEFAULT '[]'::jsonb -- Array of boosters used during this answer
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_answers_user_id ON user_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_question_id ON user_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_created_at ON user_answers(created_at);

-- Add Row Level Security (RLS)
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own answers"
    ON user_answers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own answers"
    ON user_answers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Function to update question statistics after each answer
CREATE OR REPLACE FUNCTION update_question_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE questions
    SET 
        total_attempts = total_attempts + 1,
        correct_attempts = correct_attempts + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
        success_rate = 
            ROUND(
                (CAST((correct_attempts + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END) AS FLOAT) / 
                (total_attempts + 1)) * 100,
                2
            )
    WHERE id = NEW.question_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update question statistics
CREATE TRIGGER update_question_stats_after_answer
    AFTER INSERT ON user_answers
    FOR EACH ROW
    EXECUTE FUNCTION update_question_stats();

-- Create user_stats table
CREATE TABLE IF NOT EXISTS user_stats (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_games INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    total_score BIGINT DEFAULT 0,
    average_score DECIMAL DEFAULT 0,
    success_rate DECIMAL DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    last_refresh TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    favorite_category INTEGER REFERENCES categories(id),
    best_difficulty_level TEXT
);

-- Create user_levels table
CREATE TABLE IF NOT EXISTS user_levels (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    current_level INTEGER DEFAULT 1,
    current_xp INTEGER DEFAULT 0,
    total_xp INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    condition_type TEXT NOT NULL, -- 'total_games', 'success_rate', 'streak', etc.
    condition_value INTEGER NOT NULL,
    reward_type TEXT NOT NULL,
    reward_amount INTEGER NOT NULL,
    icon_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id BIGINT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

-- Create user_boosters table
CREATE TABLE IF NOT EXISTS user_boosters (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    booster_type TEXT NOT NULL,
    available_count INTEGER DEFAULT 0,
    total_used INTEGER DEFAULT 0,
    effectiveness DECIMAL DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, booster_type)
);

-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    required_score INTEGER NOT NULL,
    reward_type TEXT NOT NULL,
    reward_amount INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_challenges table
CREATE TABLE IF NOT EXISTS user_challenges (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id BIGINT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    current_progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, challenge_id)
);

-- Function to calculate XP needed for next level
CREATE OR REPLACE FUNCTION calculate_xp_for_level(p_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- Formule : 100 * (niveau^1.5)
    RETURN FLOOR(100 * POWER(p_level, 1.5));
END;
$$ LANGUAGE plpgsql;

-- Function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats(
    p_user_id UUID,
    p_is_correct BOOLEAN,
    p_score INTEGER,
    p_category_id INTEGER
)
RETURNS TABLE (
    achievement_id BIGINT,
    achievement_name TEXT,
    reward_type TEXT,
    reward_amount INTEGER
) AS $$
DECLARE
    v_achievement RECORD;
BEGIN
    -- Mettre à jour les statistiques
    INSERT INTO user_stats (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO UPDATE
    SET
        total_questions = user_stats.total_questions + 1,
        correct_answers = user_stats.correct_answers + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
        total_score = user_stats.total_score + p_score,
        average_score = ROUND(((user_stats.total_score + p_score)::DECIMAL / (user_stats.total_questions + 1)), 2),
        success_rate = ROUND(((user_stats.correct_answers + CASE WHEN p_is_correct THEN 1 ELSE 0 END)::DECIMAL / (user_stats.total_questions + 1) * 100), 2);

    -- Vérifier et débloquer les achievements
    FOR v_achievement IN
        SELECT a.id, a.name, a.reward_type, a.reward_amount
        FROM achievements a
        LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = p_user_id
        WHERE ua.id IS NULL -- Achievement pas encore débloqué
        AND (
            (a.condition_type = 'total_questions' AND (SELECT total_questions FROM user_stats WHERE user_id = p_user_id) >= a.condition_value)
            OR
            (a.condition_type = 'success_rate' AND (SELECT success_rate FROM user_stats WHERE user_id = p_user_id) >= a.condition_value)
            OR
            (a.condition_type = 'streak' AND (SELECT streak_days FROM user_stats WHERE user_id = p_user_id) >= a.condition_value)
        )
    LOOP
        -- Débloquer l'achievement
        INSERT INTO user_achievements (user_id, achievement_id)
        VALUES (p_user_id, v_achievement.id);

        -- Donner la récompense
        INSERT INTO user_boosters (user_id, booster_type, available_count)
        VALUES (p_user_id, v_achievement.reward_type, v_achievement.reward_amount)
        ON CONFLICT (user_id, booster_type) DO UPDATE
        SET available_count = user_boosters.available_count + v_achievement.reward_amount;

        RETURN NEXT ROW(
            v_achievement.id,
            v_achievement.name,
            v_achievement.reward_type,
            v_achievement.reward_amount
        );
    END LOOP;

    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to get adaptive questions
CREATE OR REPLACE FUNCTION get_adaptive_questions(
    p_user_id UUID,
    p_category_id INTEGER DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
)
RETURNS SETOF questions AS $$
DECLARE
    v_success_rate DECIMAL;
    v_difficulty_level TEXT;
BEGIN
    -- Obtenir le taux de réussite de l'utilisateur
    SELECT success_rate INTO v_success_rate
    FROM user_stats
    WHERE user_id = p_user_id;

    -- Déterminer le niveau de difficulté approprié
    v_difficulty_level := CASE
        WHEN v_success_rate >= 80 THEN 'difficile'
        WHEN v_success_rate >= 40 THEN 'moyen'
        ELSE 'facile'
    END;

    -- Retourner les questions adaptées
    RETURN QUERY
    SELECT q.*
    FROM questions q
    WHERE 
        (p_category_id IS NULL OR q.category_id = p_category_id)
        AND q.difficulty = v_difficulty_level
    ORDER BY RANDOM()
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to use a booster
CREATE OR REPLACE FUNCTION use_booster(
    p_user_id UUID,
    p_booster_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_available_count INTEGER;
BEGIN
    -- Vérifier si le booster est disponible
    SELECT available_count INTO v_available_count
    FROM user_boosters
    WHERE user_id = p_user_id AND booster_type = p_booster_type;

    IF v_available_count > 0 THEN
        -- Utiliser le booster
        UPDATE user_boosters
        SET 
            available_count = available_count - 1,
            total_used = total_used + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = p_user_id AND booster_type = p_booster_type;
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for new tables
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_boosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_stats
CREATE POLICY "Users can view their own stats"
    ON user_stats FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
    ON user_stats FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS policies for user_levels
CREATE POLICY "Users can view their own levels"
    ON user_levels FOR SELECT
    USING (auth.uid() = user_id);

-- RLS policies for user_achievements
CREATE POLICY "Users can view their own achievements"
    ON user_achievements FOR SELECT
    USING (auth.uid() = user_id);

-- RLS policies for user_boosters
CREATE POLICY "Users can view their own boosters"
    ON user_boosters FOR SELECT
    USING (auth.uid() = user_id);

-- RLS policies for user_challenges
CREATE POLICY "Users can view their own challenges"
    ON user_challenges FOR SELECT
    USING (auth.uid() = user_id);

-- Insert some default achievements
INSERT INTO achievements (name, description, condition_type, condition_value, reward_type, reward_amount, icon_name)
VALUES
    ('Débutant', 'Répondez à 10 questions', 'total_questions', 10, 'fifty_fifty', 1, 'star'),
    ('Amateur', 'Répondez à 50 questions', 'total_questions', 50, 'double_points', 1, 'medal'),
    ('Expert', 'Répondez à 100 questions', 'total_questions', 100, 'triple_points', 1, 'trophy'),
    ('Maître', 'Atteignez 80% de bonnes réponses', 'success_rate', 80, 'show_answer', 2, 'crown'),
    ('Persévérant', 'Maintenez une série de 7 jours', 'streak', 7, 'double_points', 3, 'fire')
ON CONFLICT DO NOTHING;
