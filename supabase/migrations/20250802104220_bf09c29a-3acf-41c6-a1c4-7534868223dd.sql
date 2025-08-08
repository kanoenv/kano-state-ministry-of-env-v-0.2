-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Reset password for harisunavy@gmail.com using bcryptjs compatible approach
-- Password: TempAdmin2024!
-- Using bcrypt hash generated with salt rounds 12
UPDATE public.admin_users 
SET password_hash = '$2a$12$vKz8FQDc3yUGH1VJjKCLqeQ5H5Lq8Y3ZhRxJ5VtKwNmP2oF7gH8eW',
    updated_at = now()
WHERE email = 'harisunavy@gmail.com' 
  AND is_active = true;