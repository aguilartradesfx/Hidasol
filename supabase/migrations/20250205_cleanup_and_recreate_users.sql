DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DELETE FROM public.user_profiles WHERE email IN ('admin@hidasol.com', 'usuario@hidasol.com');

DELETE FROM auth.users WHERE email IN ('admin@hidasol.com', 'usuario@hidasol.com');
