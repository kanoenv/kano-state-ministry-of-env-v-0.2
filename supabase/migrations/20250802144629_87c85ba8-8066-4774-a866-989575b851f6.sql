-- Enable the pgcrypto extension for crypt function
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Verify the admin user exists and update password hash
UPDATE public.admin_users 
SET password_hash = crypt('TempAdmin2024!', gen_salt('bf', 12))
WHERE email = 'harisunavy@gmail.com' 
  AND is_active = true;

-- Test that the function works
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = 'harisunavy@gmail.com' 
    AND crypt('TempAdmin2024!', password_hash) = password_hash
  ) THEN
    RAISE EXCEPTION 'Password verification test failed';
  END IF;
END $$;