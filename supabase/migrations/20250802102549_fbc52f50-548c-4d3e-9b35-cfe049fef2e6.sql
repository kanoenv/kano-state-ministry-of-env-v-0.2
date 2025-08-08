-- Reset password for harisunavy@gmail.com admin user
-- New temporary password: TempAdmin2024!
-- This password meets all security requirements: 12+ chars, uppercase, lowercase, number, special character

UPDATE public.admin_users 
SET password_hash = crypt('TempAdmin2024!', gen_salt('bf', 12)),
    updated_at = now()
WHERE email = 'harisunavy@gmail.com' 
  AND is_active = true;