/*
  # Create Vision System Tables

  1. New Tables
    - `visions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text, vision name)
      - `color` (text, hex color code)
      - `status` (enum: active, graduated, deleted)
      - `created_at` (timestamp)
      - `graduated_at` (timestamp, nullable)
    
    - `milestones`
      - `id` (uuid, primary key)
      - `vision_id` (uuid, foreign key to visions)
      - `name` (text, milestone name)
      - `status` (enum: not_started, in_progress, completed)
      - `created_at` (timestamp)
      - `completed_at` (timestamp, nullable)
    
    - `habits`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `vision_id` (uuid, foreign key to visions)
      - `name` (text, habit name)
      - `status` (enum: active, graduated, deleted)
      - `created_at` (timestamp)
      - `graduated_at` (timestamp, nullable)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Users can only access visions, milestones, and habits they own
*/

-- Create enum types
CREATE TYPE vision_status AS ENUM ('active', 'graduated', 'deleted');
CREATE TYPE milestone_status AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE habit_status AS ENUM ('active', 'graduated', 'deleted');

-- Create visions table
CREATE TABLE IF NOT EXISTS visions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#329BA4',
  status vision_status NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now() NOT NULL,
  graduated_at timestamptz
);

-- Create milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vision_id uuid REFERENCES visions(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  status milestone_status NOT NULL DEFAULT 'not_started',
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz
);

-- Create habits table
CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vision_id uuid REFERENCES visions(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  status habit_status NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now() NOT NULL,
  graduated_at timestamptz
);

-- Enable Row Level Security
ALTER TABLE visions ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for visions
CREATE POLICY "Users can read own visions"
  ON visions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own visions"
  ON visions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own visions"
  ON visions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own visions"
  ON visions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for milestones
CREATE POLICY "Users can read own milestones"
  ON milestones
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM visions 
      WHERE visions.id = milestones.vision_id 
      AND visions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create milestones for own visions"
  ON milestones
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM visions 
      WHERE visions.id = milestones.vision_id 
      AND visions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update milestones for own visions"
  ON milestones
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM visions 
      WHERE visions.id = milestones.vision_id 
      AND visions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM visions 
      WHERE visions.id = milestones.vision_id 
      AND visions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete milestones for own visions"
  ON milestones
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM visions 
      WHERE visions.id = milestones.vision_id 
      AND visions.user_id = auth.uid()
    )
  );

-- Create RLS policies for habits
CREATE POLICY "Users can read own habits"
  ON habits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own habits"
  ON habits
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits"
  ON habits
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits"
  ON habits
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_visions_user_id ON visions(user_id);
CREATE INDEX IF NOT EXISTS idx_visions_status ON visions(status);
CREATE INDEX IF NOT EXISTS idx_milestones_vision_id ON milestones(vision_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(status);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_vision_id ON habits(vision_id);
CREATE INDEX IF NOT EXISTS idx_habits_status ON habits(status);