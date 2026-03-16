-- Update passwords for existing users to new credentials
UPDATE auth.users
SET encrypted_password = crypt('Hid@s0l-2026', gen_salt('bf'))
WHERE email = 'admin@hidasol.com';

UPDATE auth.users
SET encrypted_password = crypt('User-@rt3.2026', gen_salt('bf'))
WHERE email = 'usuario@hidasol.com';

-- Also insert users if they don't exist yet (fresh installs)
DO $$
DECLARE
  admin_id UUID := gen_random_uuid();
  user_id UUID := gen_random_uuid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@hidasol.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      admin_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@hidasol.com',
      crypt('Hid@s0l-2026', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Administrador","role":"admin"}',
      NOW(), NOW(), 'authenticated', 'authenticated'
    );

    INSERT INTO public.user_profiles (id, email, name, role)
    VALUES (admin_id, 'admin@hidasol.com', 'Administrador', 'admin')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'usuario@hidasol.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      user_id,
      '00000000-0000-0000-0000-000000000000',
      'usuario@hidasol.com',
      crypt('User-@rt3.2026', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Usuario","role":"user"}',
      NOW(), NOW(), 'authenticated', 'authenticated'
    );

    INSERT INTO public.user_profiles (id, email, name, role)
    VALUES (user_id, 'usuario@hidasol.com', 'Usuario', 'user')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
