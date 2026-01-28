-- Create system accounts for scraped and curated events
-- These accounts will be used as organizers for automatically scraped and manually curated events

-- 1. Create Scraper Bot Account (for automatically scraped events)
-- Email: scraper@fluxverse.internal
INSERT INTO public.users (id, email, phone, hash_password)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'scraper@fluxverse.internal',
  '',
  'system_account_no_login'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, username, avatar_url, description, tag)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'FluxVerse 爬虫',
  'https://api.dicebear.com/7.x/bottts/svg?seed=scraper',
  '自动爬取活动信息的系统账户',
  'system_scraper'
)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  avatar_url = EXCLUDED.avatar_url,
  description = EXCLUDED.description,
  tag = EXCLUDED.tag;

-- 2. Create Curator Account (for manually curated events)
-- Email: curator@fluxverse.internal
INSERT INTO public.users (id, email, phone, hash_password)
VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  'curator@fluxverse.internal',
  '',
  'system_account_no_login'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, username, avatar_url, description, tag)
VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  'FluxVerse 内容管理',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=curator',
  '负责筛选和发布优质活动的社区管理账户',
  'system_curator'
)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  avatar_url = EXCLUDED.avatar_url,
  description = EXCLUDED.description,
  tag = EXCLUDED.tag;
