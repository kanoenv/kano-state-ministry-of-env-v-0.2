-- Security Fix 1: Add search_path to all database functions to prevent injection attacks

-- Fix verify_admin_login function
CREATE OR REPLACE FUNCTION public.verify_admin_login(admin_email text, admin_password text)
 RETURNS TABLE(id text, email text, full_name text, role admin_role, is_active boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
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
        AND au.password_hash = crypt(admin_password, au.password_hash)
        AND au.is_active = true;
END;
$function$;

-- Fix create_admin_user function
CREATE OR REPLACE FUNCTION public.create_admin_user(admin_email text, admin_password text, admin_name text, admin_role_param admin_role DEFAULT 'content_admin'::admin_role)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
    admin_id TEXT;
    hashed_password TEXT;
BEGIN
    -- Validate input parameters
    IF admin_email IS NULL OR admin_email = '' THEN
        RAISE EXCEPTION 'Email cannot be empty';
    END IF;
    
    IF admin_password IS NULL OR LENGTH(admin_password) < 12 THEN
        RAISE EXCEPTION 'Password must be at least 12 characters long';
    END IF;
    
    IF admin_name IS NULL OR admin_name = '' THEN
        RAISE EXCEPTION 'Name cannot be empty';
    END IF;

    -- Generate a UUID for the admin
    admin_id := gen_random_uuid()::text;
    
    -- Hash the password using bcrypt with higher rounds
    hashed_password := crypt(admin_password, gen_salt('bf', 12));

    -- Insert the new admin user
    INSERT INTO public.admin_users (
        id,
        email,
        password_hash,
        full_name,
        role,
        is_active,
        created_at,
        updated_at
    )
    VALUES (
        admin_id::uuid,
        admin_email,
        hashed_password,
        admin_name,
        admin_role_param,
        true,
        now(),
        now()
    );

    RETURN admin_id;
END;
$function$;

-- Fix verify_organization_login function
CREATE OR REPLACE FUNCTION public.verify_organization_login(org_email text, org_password text)
 RETURNS TABLE(id uuid, organization_name text, contact_email text, status text, approved_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    -- Validate input parameters
    IF org_email IS NULL OR org_email = '' THEN
        RAISE EXCEPTION 'Email cannot be empty';
    END IF;
    
    IF org_password IS NULL OR org_password = '' THEN
        RAISE EXCEPTION 'Password cannot be empty';
    END IF;

    RETURN QUERY
    SELECT 
        ca.id,
        ca.organization_name,
        ca.contact_email,
        ca.status,
        ca.approved_at
    FROM public.climate_actors ca
    WHERE ca.contact_email = org_email
        AND ca.password_hash = crypt(org_password, ca.password_hash)
        AND ca.status = 'approved';
END;
$function$;

-- Fix generate_activation_code function
CREATE OR REPLACE FUNCTION public.generate_activation_code(prefix text DEFAULT 'ORG'::text)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
    -- Validate input
    IF prefix IS NULL OR prefix = '' THEN
        prefix := 'ORG';
    END IF;
    
    RETURN prefix || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 6));
END;
$function$;

-- Fix update_climate_actors_updated_at function
CREATE OR REPLACE FUNCTION public.update_climate_actors_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;