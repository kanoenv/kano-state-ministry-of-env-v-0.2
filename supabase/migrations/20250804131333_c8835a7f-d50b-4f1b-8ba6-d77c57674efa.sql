-- Enable the pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.verify_organization_login(text, text);

-- Create the verify_organization_login function with proper bcrypt support
CREATE OR REPLACE FUNCTION public.verify_organization_login(org_email text, org_password text)
 RETURNS TABLE(id uuid, organization_name text, contact_email text, status text, approved_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
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