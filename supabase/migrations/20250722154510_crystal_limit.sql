/*
  # Add function to delete user data

  1. Function
    - `delete_user_data` - Deletes all user-related data from our tables
    - Called before deleting the auth user to clean up data
*/

CREATE OR REPLACE FUNCTION delete_user_data(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete focus sessions (will cascade from habits/visions)
  DELETE FROM focus_sessions WHERE focus_sessions.user_id = delete_user_data.user_id;
  
  -- Delete habits (will cascade from visions)
  DELETE FROM habits WHERE habits.user_id = delete_user_data.user_id;
  
  -- Delete milestones (will cascade from visions)
  DELETE FROM milestones WHERE vision_id IN (
    SELECT id FROM visions WHERE visions.user_id = delete_user_data.user_id
  );
  
  -- Delete visions
  DELETE FROM visions WHERE visions.user_id = delete_user_data.user_id;
  
  -- Delete user profile
  DELETE FROM users WHERE users.id = delete_user_data.user_id;
END;
$$;