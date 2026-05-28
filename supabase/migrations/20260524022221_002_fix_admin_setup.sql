/*
  # Fix Admin Setup

  1. Changes
    - Disable the problematic trigger temporarily
    - This allows manual user creation without the trigger interference
*/

-- Drop the trigger that was causing issues
DROP TRIGGER IF EXISTS auto_assign_admin_trigger ON profiles;

-- The function can remain but won't be called automatically
-- We'll handle first user setup differently through the application
