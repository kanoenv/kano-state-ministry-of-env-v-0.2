-- Recreate the verify_admin_login function with proper pgcrypto access
DROP FUNCTION IF EXISTS public.verify_admin_login(text, text);

CREATE OR REPLACE FUNCTION public.verify_admin_login(admin_email text, admin_password text)
 RETURNS TABLE(id text, email text, full_name text, role admin_role, is_active boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
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