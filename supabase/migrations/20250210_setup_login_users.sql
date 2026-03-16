-- Delete existing users if they exist, then recreate with correct credentials

DO $$
DECLARE
  admin_id uuid;
  user_id uuid;
BEGIN
  -- Remove existing users by email
  DELETE FROM auth.users WHERE email IN ('admin@hidasol.com', 'user@hidasol.com', 'usuario@hidasol.com');

  -- Create Admin user
  admin_id := gen_random_uuid();
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud
  ) VALUES (
    admin_id,
    '00000000-0000-0000-0000-000000000000',
    'admin@hidasol.com',
    crypt('Hid@s0l-2026*', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"],"role":"admin"}'::jsonb,
    '{"name":"Admin","role":"admin","username":"Admin"}'::jsonb,
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
  );

  -- Create regular User
  user_id := gen_random_uuid();
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud
  ) VALUES (
    user_id,
    '00000000-0000-0000-0000-000000000000',
    'user@hidasol.com',
    crypt('User-@rt3.2026', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"],"role":"user"}'::jsonb,
    '{"name":"User","role":"user","username":"User"}'::jsonb,
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
  );

  -- Upsert into public.users table if it exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    INSERT INTO public.users (id, email, name, role)
    VALUES
      (admin_id, 'admin@hidasol.com', 'Admin', 'admin'),
      (user_id, 'user@hidasol.com', 'User', 'user')
    ON CONFLICT (id) DO UPDATE
      SET email = EXCLUDED.email,
          name = EXCLUDED.name,
          role = EXCLUDED.role;
  END IF;
END $$;
