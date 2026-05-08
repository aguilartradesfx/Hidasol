-- Make sure RLS is disabled so reads work without auth token issues
ALTER TABLE IF EXISTS public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles DISABLE ROW LEVEL SECURITY;
