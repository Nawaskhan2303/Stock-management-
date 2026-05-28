/*
  # Auto-Create Profile for New Users

  1. Changes
    - Add a trigger function that automatically creates a profile
      when a new user signs up in auth.users
    - New users are assigned 'staff' role by default
    - First user in the system is automatically made admin
  
  2. Security
    - The trigger runs with SECURITY DEFINER to bypass RLS
    - Only creates profiles for new inserts, not updates
*/

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert a new profile for the user
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'New User'),
    CASE 
      WHEN (SELECT COUNT(*) FROM public.profiles) = 0 THEN 'admin'
      ELSE 'staff'
    END
  );
  RETURN NEW;
END;
$$;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
