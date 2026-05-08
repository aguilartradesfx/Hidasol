-- Force reset passwords for both users
UPDATE auth.users
SET 
  encrypted_password = crypt('Hid@s0l-2026', gen_salt('bf')),
  updated_at = NOW()
WHERE email = 'admin@hidasol.com';

UPDATE auth.users
SET 
  encrypted_password = crypt('User-@rt3.2026', gen_salt('bf')),
  updated_at = NOW()
WHERE email = 'usuario@hidasol.com';
