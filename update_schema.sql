-- 1. Mise à jour de la table questions
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS difficulty_level TEXT DEFAULT 'moyen',
ADD COLUMN IF NOT EXISTS success_rate DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS correct_attempts INTEGER DEFAULT 0;

-- 2. Mise à jour de la table scores
ALTER TABLE scores
ADD COLUMN IF NOT EXISTS boosters_used JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS lives_remaining INTEGER DEFAULT 3;

-- 3. Création de la table user_stats
CREATE TABLE IF NOT EXISTS user_stats (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    games_played INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    average_score DECIMAL DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    last_game_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id),
    difficulty_progress INTEGER DEFAULT 5
);

-- 4. Création de la table user_boosters
CREATE TABLE IF NOT EXISTS user_boosters (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fifty_fifty INTEGER DEFAULT 1,
    show_answer INTEGER DEFAULT 1,
    article_link INTEGER DEFAULT 1,
    last_refresh TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- 5. Création de la table user_answers
CREATE TABLE IF NOT EXISTS user_answers (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    response_time INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    game_mode TEXT NOT NULL,
    difficulty_level TEXT,
    boosters_used JSONB DEFAULT '[]'::jsonb
);

-- 6. Création des index pour l'optimisation
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_questions_success_rate ON questions(success_rate);
CREATE INDEX IF NOT EXISTS idx_user_answers_user_id ON user_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_question_id ON user_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_created_at ON user_answers(created_at);

-- 7. Sécurité RLS (Row Level Security)
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_boosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;

-- 8. Politiques RLS
CREATE POLICY "Users can view their own stats"
    ON user_stats FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
    ON user_stats FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own boosters"
    ON user_boosters FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own answers"
    ON user_answers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own answers"
    ON user_answers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 9. Fonction pour mettre à jour les statistiques utilisateur
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_stats (user_id, games_played, total_score, questions_answered, correct_answers)
    VALUES (NEW.user_id, 1, NEW.score, 1, CASE WHEN NEW.is_correct THEN 1 ELSE 0 END)
    ON CONFLICT (user_id) DO UPDATE SET
        games_played = user_stats.games_played + 1,
        total_score = user_stats.total_score + NEW.score,
        questions_answered = user_stats.questions_answered + 1,
        correct_answers = user_stats.correct_answers + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
        average_score = ROUND(((user_stats.total_score + NEW.score)::DECIMAL / (user_stats.games_played + 1)), 2),
        last_game_date = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Trigger pour la mise à jour automatique des statistiques
CREATE TRIGGER update_user_stats_after_game
    AFTER INSERT ON user_answers
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats();

-- 11. Fonction pour obtenir des questions adaptatives
CREATE OR REPLACE FUNCTION get_adaptive_questions(
    p_difficulty TEXT,
    p_limit INTEGER DEFAULT 10
)
RETURNS SETOF questions AS $$
BEGIN
    -- Retourner les questions en fonction de la difficulté
    RETURN QUERY
    WITH question_pool AS (
        SELECT 
            q.*,
            CASE
                WHEN p_difficulty = 'hard' THEN
                    CASE 
                        WHEN q.success_rate <= 40 THEN 3  -- Questions difficiles
                        WHEN q.success_rate <= 60 THEN 2  -- Questions moyennes
                        ELSE 1                            -- Questions faciles
                    END
                WHEN p_difficulty = 'easy' THEN
                    CASE 
                        WHEN q.success_rate >= 80 THEN 3  -- Questions faciles
                        WHEN q.success_rate >= 60 THEN 2  -- Questions moyennes
                        ELSE 1                            -- Questions difficiles
                    END
                ELSE -- 'normal'
                    CASE 
                        WHEN q.success_rate BETWEEN 40 AND 70 THEN 3  -- Questions moyennes
                        ELSE 1                                        -- Autres questions
                    END
            END as priority
        FROM questions q
        WHERE 
            -- Sélectionner uniquement les questions avec assez de tentatives
            q.total_attempts >= 5
    )
    SELECT 
        qp.id, qp.question, qp.options, qp.correct_answers, 
        qp.category_id, qp.difficulty_level, qp.success_rate, 
        qp.total_attempts, qp.correct_attempts, qp.type, 
        qp.created_at, qp.updated_at
    FROM question_pool qp
    ORDER BY 
        qp.priority DESC,  -- Prioriser selon le niveau de difficulté
        RANDOM()          -- Mélanger les questions de même priorité
    LIMIT p_limit;

    -- Si aucune question n'est trouvée, retourner des questions aléatoires
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT *
        FROM questions
        ORDER BY RANDOM()
        LIMIT p_limit;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 12. Fonction pour ajuster automatiquement la difficulté des questions
CREATE OR REPLACE FUNCTION adjust_question_difficulty()
RETURNS TRIGGER AS $$
DECLARE
    min_attempts INTEGER := 10; -- Nombre minimum de tentatives pour ajuster la difficulté
BEGIN
    -- Ne mettre à jour que si nous avons assez de tentatives
    IF NEW.total_attempts >= min_attempts THEN
        -- Ajuster la difficulté basée sur le taux de réussite
        UPDATE questions
        SET difficulty_level = 
            CASE 
                WHEN success_rate > 80 THEN 'difficile'
                WHEN success_rate > 40 THEN 'moyen'
                ELSE 'facile'
            END
        WHERE id = NEW.question_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer un trigger pour appeler la fonction après chaque mise à jour
CREATE TRIGGER adjust_question_difficulty_trigger
    AFTER UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION adjust_question_difficulty();

-- Function to calculate XP needed for a level
CREATE OR REPLACE FUNCTION calculate_xp_for_level(level_number INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- Base XP needed is 1000, increasing by 10% each level
    RETURN FLOOR(1000 * POWER(1.10, level_number - 1));
END;
$$ LANGUAGE plpgsql;

-- Function to get user level and XP
CREATE OR REPLACE FUNCTION get_user_level(p_user_id UUID)
RETURNS TABLE (
    current_level INTEGER,
    current_xp INTEGER,
    xp_for_next_level INTEGER,
    total_xp INTEGER
) AS $$
DECLARE
    v_total_xp INTEGER;
    v_current_level INTEGER;
    v_current_xp INTEGER;
    v_xp_for_next_level INTEGER;
BEGIN
    -- Get total XP from user_stats
    SELECT total_score INTO v_total_xp
    FROM user_stats
    WHERE user_id = p_user_id;

    -- If no stats found, return level 1
    IF v_total_xp IS NULL THEN
        RETURN QUERY SELECT 
            1::INTEGER as current_level,
            0::INTEGER as current_xp,
            calculate_xp_for_level(1) as xp_for_next_level,
            0::INTEGER as total_xp;
        RETURN;
    END IF;

    -- Calculate current level
    v_current_level := 1;
    v_xp_for_next_level := calculate_xp_for_level(1);
    
    WHILE v_total_xp >= v_xp_for_next_level LOOP
        v_total_xp := v_total_xp - v_xp_for_next_level;
        v_current_level := v_current_level + 1;
        v_xp_for_next_level := calculate_xp_for_level(v_current_level);
    END LOOP;

    -- Return the results
    RETURN QUERY SELECT 
        v_current_level,
        v_total_xp,
        v_xp_for_next_level,
        (SELECT total_score FROM user_stats WHERE user_id = p_user_id);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les statistiques utilisateur
CREATE OR REPLACE FUNCTION get_user_stats(user_id_param UUID)
RETURNS TABLE (
    total_games INTEGER,
    total_score INTEGER,
    average_score NUMERIC,
    highest_score INTEGER,
    total_questions_answered INTEGER,
    correct_answers INTEGER,
    accuracy_rate NUMERIC,
    difficulty_level TEXT,
    difficulty_progress INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT game_id)::INTEGER as total_games,
        SUM(score)::INTEGER as total_score,
        ROUND(AVG(score)::NUMERIC, 2) as average_score,
        MAX(score)::INTEGER as highest_score,
        COUNT(*)::INTEGER as total_questions_answered,
        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::INTEGER as correct_answers,
        ROUND((SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)::NUMERIC * 100), 2) as accuracy_rate,
        us.current_difficulty as difficulty_level,
        us.difficulty_progress as difficulty_progress
    FROM 
        user_answers ua
    JOIN 
        user_stats us ON ua.user_id = us.user_id
    WHERE 
        ua.user_id = user_id_param
    GROUP BY 
        us.current_difficulty,
        us.difficulty_progress;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour la progression de difficulté
CREATE OR REPLACE FUNCTION update_difficulty_progress(
    user_id_param UUID,
    new_progress INTEGER,
    new_difficulty TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
    UPDATE user_stats
    SET 
        difficulty_progress = new_progress,
        current_difficulty = COALESCE(new_difficulty, current_difficulty)
    WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;
