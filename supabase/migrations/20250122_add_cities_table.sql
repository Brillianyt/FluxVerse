
-- 1. Create cities table (Standardizing city data)
CREATE TABLE IF NOT EXISTS public.cities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, -- Internal ID/English Name, e.g. 'Shanghai'
  label TEXT NOT NULL,       -- Display Name, e.g. '上海'
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Everyone can read cities
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'cities' AND policyname = 'Cities are viewable by everyone'
    ) THEN
        CREATE POLICY "Cities are viewable by everyone" ON public.cities FOR SELECT USING (true);
    END IF;
END
$$;

-- 4. Insert default cities (From frontend config)
INSERT INTO public.cities (name, label, latitude, longitude) VALUES
('Shanghai', '上海', 31.2304, 121.4737),
('Beijing', '北京', 39.9042, 116.4074),
('Shenzhen', '深圳', 22.5429, 114.0596),
('Hangzhou', '杭州', 30.2741, 120.1551),
('Guangzhou', '广州', 23.1291, 113.2644),
('Chengdu', '成都', 30.5728, 104.0668),
('Nanjing', '南京', 32.0603, 118.7969)
ON CONFLICT (name) DO NOTHING;

-- 5. Add index to activities.city for high-performance filtering
-- This avoids the need for a separate mapping table for 1:N relationships
CREATE INDEX IF NOT EXISTS idx_activities_city ON public.activities(city);
