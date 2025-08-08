-- Update the password for the Dual organization to a known password
UPDATE climate_actors 
SET password_hash = crypt('password123', gen_salt('bf'))
WHERE contact_email = 'dual.kanoict@gmail.com';

-- Test the login function now
SELECT * FROM verify_organization_login('dual.kanoict@gmail.com', 'password123');