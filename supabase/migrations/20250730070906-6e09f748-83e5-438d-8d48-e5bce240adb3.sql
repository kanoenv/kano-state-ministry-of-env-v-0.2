-- Security Fix 3: Fix remaining function search path issue

-- Fix validate_admin_user_data function
CREATE OR REPLACE FUNCTION validate_admin_user_data()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Validate email format
  IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validate role
  IF NEW.role NOT IN ('super_admin', 'content_admin', 'reports_admin') THEN
    RAISE EXCEPTION 'Invalid admin role';
  END IF;
  
  -- Ensure full_name is not empty
  IF LENGTH(TRIM(NEW.full_name)) < 2 THEN
    RAISE EXCEPTION 'Full name must be at least 2 characters';
  END IF;
  
  RETURN NEW;
END;
$$;