-- Security Fix 2: Tighten RLS policies to implement principle of least privilege

-- Fix admin_users table policies
DROP POLICY IF EXISTS "Allow all operations on admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow select for all" ON public.admin_users;
DROP POLICY IF EXISTS "Authenticated users can create admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Authenticated users can update admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Authenticated users can view admin users" ON public.admin_users;

-- Create more restrictive admin_users policies
CREATE POLICY "Admin users can view themselves and super_admins can view all"
ON public.admin_users FOR SELECT
USING (
  (SELECT role FROM public.admin_users WHERE id = auth.uid() AND is_active = true) = 'super_admin'
  OR id = auth.uid()
);

CREATE POLICY "Only super_admins can create admin users"
ON public.admin_users FOR INSERT
WITH CHECK (
  (SELECT role FROM public.admin_users WHERE id = auth.uid() AND is_active = true) = 'super_admin'
);

CREATE POLICY "Admin users can update themselves and super_admins can update all"
ON public.admin_users FOR UPDATE
USING (
  (SELECT role FROM public.admin_users WHERE id = auth.uid() AND is_active = true) = 'super_admin'
  OR id = auth.uid()
);

-- No delete policy for admin users (prevent accidental deletions)

-- Fix air_quality table policies
DROP POLICY IF EXISTS "Allow all operations on air quality" ON public.air_quality;

CREATE POLICY "Anyone can view air quality data"
ON public.air_quality FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage air quality data"
ON public.air_quality FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = auth.uid() AND is_active = true
  )
);

-- Fix careers table policies
DROP POLICY IF EXISTS "Allow all operations on careers" ON public.careers;

CREATE POLICY "Anyone can view active careers"
ON public.careers FOR SELECT
USING (status = 'active');

CREATE POLICY "Only admins can manage careers"
ON public.careers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = auth.uid() AND is_active = true
  )
);

-- Fix home_banners table policies  
DROP POLICY IF EXISTS "Allow all operations on banners" ON public.home_banners;

CREATE POLICY "Anyone can view active banners"
ON public.home_banners FOR SELECT
USING (is_active = true);

CREATE POLICY "Only admins can manage banners"
ON public.home_banners FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = auth.uid() AND is_active = true
  )
);

-- Fix programs table policies
DROP POLICY IF EXISTS "Allow all operations on programs" ON public.programs;

CREATE POLICY "Anyone can view active programs"
ON public.programs FOR SELECT
USING (status = 'active');

CREATE POLICY "Only admins can manage programs"
ON public.programs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = auth.uid() AND is_active = true
  )
);

-- Fix reports table policies
DROP POLICY IF EXISTS "Allow all operations on reports" ON public.reports;

CREATE POLICY "Anyone can submit reports"
ON public.reports FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view reports"
ON public.reports FOR SELECT
USING (true);

CREATE POLICY "Only admins can update and delete reports"
ON public.reports FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Only admins can delete reports"
ON public.reports FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = auth.uid() AND is_active = true
  )
);

-- Fix five_million_trees_applications table policies
DROP POLICY IF EXISTS "Allow all operations on tree applications" ON public.five_million_trees_applications;

-- Keep existing restrictive policies for this table as they are appropriate
-- CREATE POLICY "Anyone can submit applications" - already exists and is appropriate
-- CREATE POLICY "Allow reading applications" - already exists and is appropriate
-- CREATE POLICY "Allow updating applications" - already exists and is appropriate

-- Fix recruitment_applications table policies
DROP POLICY IF EXISTS "Allow all operations on recruitment applications" ON public.recruitment_applications;

CREATE POLICY "Anyone can submit recruitment applications"
ON public.recruitment_applications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Only admins can view recruitment applications"
ON public.recruitment_applications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Only admins can update recruitment applications"
ON public.recruitment_applications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = auth.uid() AND is_active = true
  )
);

-- No delete policy for recruitment applications (preserve data)