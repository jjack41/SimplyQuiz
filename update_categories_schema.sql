-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Reset the database schema
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS question_categories CASCADE;

-- Create the categories table with UUID
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#2196f3',
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT categories_name_user_unique UNIQUE (name, user_id)
);

-- Create indexes
CREATE INDEX categories_user_id_idx ON categories(user_id);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for categories
CREATE POLICY "Enable read access for own categories"
    ON categories FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Enable insert access for own categories"
    ON categories FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update access for own categories"
    ON categories FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete access for own categories"
    ON categories FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create the junction table
CREATE TABLE question_categories (
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, category_id)
);

-- Create indexes for the junction table
CREATE INDEX idx_question_categories_question_id ON question_categories(question_id);
CREATE INDEX idx_question_categories_category_id ON question_categories(category_id);

-- Enable RLS for junction table
ALTER TABLE question_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for junction table
CREATE POLICY "Enable read access for own question categories"
    ON question_categories FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM categories c
            WHERE c.id = question_categories.category_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Enable insert access for own question categories"
    ON question_categories FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM categories c
            WHERE c.id = NEW.category_id
            AND c.user_id = auth.uid()
        )
    );

-- Insert default categories
INSERT INTO categories (name, color)
VALUES 
    ('Histoire', '#2196f3'),
    ('Géographie', '#2196f3'),
    ('Sciences', '#2196f3'),
    ('Art et Littérature', '#2196f3'),
    ('Sport', '#2196f3'),
    ('Divertissement', '#2196f3')
ON CONFLICT (name) DO NOTHING;
