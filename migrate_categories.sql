-- Migration des catégories existantes
INSERT INTO question_categories (question_id, category_id)
SELECT 
    q.id as question_id,
    q.category_id as category_id
FROM questions q
WHERE q.category_id IS NOT NULL;
