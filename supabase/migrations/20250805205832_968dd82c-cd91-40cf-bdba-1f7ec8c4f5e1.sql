-- Create function to update organization password
CREATE OR REPLACE FUNCTION public.update_organization_password(
    org_email text,
    old_password text,
    new_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
    org_record RECORD;
BEGIN
    -- Validate input parameters
    IF org_email IS NULL OR org_email = '' THEN
        RAISE EXCEPTION 'Email cannot be empty';
    END IF;
    
    IF old_password IS NULL OR old_password = '' THEN
        RAISE EXCEPTION 'Current password cannot be empty';
    END IF;
    
    IF new_password IS NULL OR LENGTH(new_password) < 8 THEN
        RAISE EXCEPTION 'New password must be at least 8 characters long';
    END IF;

    -- Check if organization exists and verify old password
    SELECT * INTO org_record
    FROM public.climate_actors
    WHERE contact_email = org_email
        AND password_hash = crypt(old_password, password_hash)
        AND status = 'approved';

    IF org_record IS NULL THEN
        RAISE EXCEPTION 'Invalid email or current password';
    END IF;

    -- Update password with new hash
    UPDATE public.climate_actors
    SET 
        password_hash = crypt(new_password, gen_salt('bf', 12)),
        updated_at = now()
    WHERE contact_email = org_email;

    RETURN true;
END;
$function$;