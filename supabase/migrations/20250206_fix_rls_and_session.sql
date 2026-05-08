ALTER TABLE IF EXISTS public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on orders" ON public.orders;
CREATE POLICY "Allow all operations on orders"
  ON public.orders FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on user_profiles" ON public.user_profiles;
CREATE POLICY "Allow all operations on user_profiles"
  ON public.user_profiles FOR ALL
  USING (true)
  WITH CHECK (true);
