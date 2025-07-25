/*
  # Add description field to visions table

  1. Changes
    - Add `description` column to `visions` table for storing vision descriptions
    - Column is optional (nullable) and defaults to empty string

  2. Security
    - No changes to RLS policies needed as existing policies cover the new column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visions' AND column_name = 'description'
  ) THEN
    ALTER TABLE visions ADD COLUMN description text DEFAULT '';
  END IF;
END $$;