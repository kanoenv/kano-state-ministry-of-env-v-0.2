-- Ensure pgcrypto extension is enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Test the organization login function
SELECT 'Testing verify_organization_login function' as message;

-- Test with the actual organization data
SELECT 
    id, 
    organization_name, 
    contact_email, 
    status,
    length(password_hash) as password_hash_length,
    substring(password_hash, 1, 7) as hash_prefix
FROM climate_actors 
WHERE contact_email = 'dual.kanoict@gmail.com';

-- Test the password verification
SELECT crypt('password123', '$2b$10$Iu73T2IqWGLRpqZWE3daYuEW4teA3aWnHpWoY1CA1hISt3aAP27le') = '$2b$10$Iu73T2IqWGLRpqZWE3daYuEW4teA3aWnHpWoY1CA1hISt3aAP27le' as password_test;