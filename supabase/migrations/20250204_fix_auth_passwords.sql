-- Update passwords using Supabase's intended method
-- This resets the passwords for both users

-- Admin user password reset
UPDATE auth.users
SET encrypted_password = crypt('Hid@s0l-2026*', gen_salt('bf'))
WHERE email = 'admin@hidasol.com';

-- Regular user password reset  
UPDATE auth.users
SET encrypted_password = crypt('User-@rt3.2026*', gen_salt('bf'))
WHERE email = 'usuario@hidasol.com';
