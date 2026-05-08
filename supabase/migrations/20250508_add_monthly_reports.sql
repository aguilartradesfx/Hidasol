-- Monthly reports table
CREATE TABLE IF NOT EXISTS monthly_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  period text NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL,
  data jsonb NOT NULL,
  generated_at timestamptz DEFAULT now(),
  CONSTRAINT monthly_reports_period_unique UNIQUE (period)
);

ALTER TABLE monthly_reports DISABLE ROW LEVEL SECURITY;
