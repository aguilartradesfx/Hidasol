ALTER TABLE IF EXISTS orders DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on orders" ON orders;
CREATE POLICY "Allow all operations on orders"
  ON orders FOR ALL
  USING (true)
  WITH CHECK (true);
