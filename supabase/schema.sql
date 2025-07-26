-- Health data table
CREATE TABLE health_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  weight DECIMAL(5,2),
  body_fat_percentage DECIMAL(4,2),
  muscle_mass DECIMAL(5,2),
  steps INTEGER,
  active_calories INTEGER,
  resting_calories INTEGER,
  total_calories INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_health_data_updated_at BEFORE UPDATE
  ON health_data FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Index for date queries
CREATE INDEX idx_health_data_date ON health_data(date DESC);

-- Row Level Security (RLS)
ALTER TABLE health_data ENABLE ROW LEVEL SECURITY;

-- Policy for public read access
CREATE POLICY "Public read access" ON health_data
  FOR SELECT USING (true);

-- Policy for authenticated write access
CREATE POLICY "Authenticated write access" ON health_data
  FOR ALL USING (auth.role() = 'authenticated');