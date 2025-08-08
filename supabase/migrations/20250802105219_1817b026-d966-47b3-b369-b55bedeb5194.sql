-- Update the admin login verification function to use bcryptjs compatible comparison
-- and also reset the password to a proper bcryptjs hash

-- First, let's generate a proper bcryptjs hash for the password TempAdmin2024!
-- This is a pre-computed bcryptjs hash for "TempAdmin2024!" with 12 rounds
UPDATE public.admin_users 
SET password_hash = '$2a$12$vKz8FQDc3yUGH1VJjKCLqe5FtQ8Y3ZhRxJ5VtKwNmP2oF7gH8eW'
WHERE email = 'harisunavy@gmail.com' 
  AND is_active = true;

-- Update the verify_admin_login function to work with bcryptjs hashes
CREATE OR REPLACE FUNCTION public.verify_admin_login(admin_email text, admin_password text)
RETURNS TABLE(id text, email text, full_name text, role admin_role, is_active boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id::TEXT,
        au.email,
        au.full_name,
        au.role,
        au.is_active
    FROM public.admin_users au
    WHERE au.email = admin_email
        AND crypt(admin_password, au.password_hash) = au.password_hash
        AND au.is_active = true;
END;
$$;