-- Ajout de la colonne difficulty_progress à la table user_stats
ALTER TABLE user_stats
ADD COLUMN IF NOT EXISTS difficulty_progress INTEGER DEFAULT 5;

-- Initialiser la progression pour les utilisateurs existants
UPDATE user_stats
SET difficulty_progress = 
    CASE 
        WHEN current_difficulty = 'easy' THEN 3
        WHEN current_difficulty = 'hard' THEN 7
        ELSE 5
    END
WHERE difficulty_progress IS NULL;

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
        current_difficulty = COALESCE(new_difficulty, current_difficulty),
        last_game_date = CURRENT_TIMESTAMP
    WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Ajout d'un index pour optimiser les requêtes sur difficulty_progress
CREATE INDEX IF NOT EXISTS idx_user_stats_difficulty_progress 
ON user_stats(difficulty_progress);

-- Ajout d'une contrainte pour s'assurer que la progression reste dans les limites
ALTER TABLE user_stats
ADD CONSTRAINT check_difficulty_progress 
CHECK (difficulty_progress >= 0 AND difficulty_progress <= 10);
