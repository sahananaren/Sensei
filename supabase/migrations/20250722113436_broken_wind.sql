/*
  # Create focus sessions table

  1. New Tables
    - `focus_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `habit_id` (uuid, foreign key to habits)
      - `vision_id` (uuid, foreign key to visions)
      - `intention` (text, nullable)
      - `duration_minutes` (integer)
      - `accomplishment` (text)
      - `major_win` (text, nullable)
      - `milestone_ids` (text array, nullable)
      - `created_at` (timestamp)
      - `completed_at` (timestamp)

  2. Security
    - Enable RLS on `focus_sessions` table
    - Add policies for authenticated users to manage their own sessions
*/

CREATE TABLE IF NOT EXISTS focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  vision_id uuid NOT NULL REFERENCES visions(id) ON DELETE CASCADE,
  intention text,
  duration_minutes integer NOT NULL DEFAULT 0,
  accomplishment text NOT NULL,
  major_win text,
  milestone_ids text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create own focus sessions"
  ON focus_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own focus sessions"
  ON focus_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own focus sessions"
  ON focus_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own focus sessions"
  ON focus_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_habit_id ON focus_sessions(habit_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_vision_id ON focus_sessions(vision_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_created_at ON focus_sessions(created_at);