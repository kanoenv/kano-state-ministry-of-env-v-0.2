-- Security Fix 2: Tighten RLS policies (Part 2) - Check and drop existing policies carefully

-- Fix programs table policies
DROP POLICY IF EXISTS "Anyone can view active programs" ON public.programs;
DROP POLICY IF EXISTS "Admin users can manage programs" ON public.programs;

CREATE POLICY "Public can view active programs"
ON public.programs FOR SELECT
USING (status = 'active');

CREATE POLICY "Admins can manage all programs"
ON public.programs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = auth.uid() AND is_active = true
  )
);

-- Fix content table policies
DROP POLICY IF EXISTS "Allow all operations on content" ON public.content;

CREATE POLICY "Anyone can view published content"
ON public.content FOR SELECT
USING (status = 'Published');

CREATE POLICY "Only admins can manage content"
ON public.content FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = auth.uid() AND is_active = true
  )
);

-- Fix organizations table policies
DROP POLICY IF EXISTS "Admins can manage all organizations" ON public.organizations;

-- Keep existing restrictive admin policies for organizations table

-- Add input validation trigger for admin_users
CREATE OR REPLACE FUNCTION validate_admin_user_data()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_admin_user_trigger ON public.admin_users;
CREATE TRIGGER validate_admin_user_trigger
  BEFORE INSERT OR UPDATE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION validate_admin_user_data();