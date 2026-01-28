import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}

const client = new pg.Client({ connectionString });

const sql = `
-- Open up public.users
drop policy if exists "Users can insert their own row" on public.users;
drop policy if exists "Users can update their own row" on public.users;
drop policy if exists "Public users are viewable by everyone" on public.users;
drop policy if exists "Allow all for users" on public.users;

create policy "Allow all for users" on public.users for all to anon, authenticated, service_role using (true) with check (true);

-- Open up public.profiles
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Allow all for profiles" on public.profiles;

create policy "Allow all for profiles" on public.profiles for all to anon, authenticated, service_role using (true) with check (true);

-- Open up public.activities
drop policy if exists "Authenticated users can create activities" on public.activities;
drop policy if exists "Allow all for activities" on public.activities;

create policy "Allow all for activities" on public.activities for all to anon, authenticated, service_role using (true) with check (true);

-- Open up public.notifications
drop policy if exists "Users can view their own notifications" on public.notifications;
drop policy if exists "Users can insert their own notifications" on public.notifications;
drop policy if exists "Users can update their own notifications" on public.notifications;
drop policy if exists "Users can delete their own notifications" on public.notifications;
drop policy if exists "Allow all for notifications" on public.notifications;

create policy "Allow all for notifications" on public.notifications for all to anon, authenticated, service_role using (true) with check (true);

-- Open up public.activity_hosts
drop policy if exists "Users can insert as host" on public.activity_hosts;
drop policy if exists "Allow all for hosts" on public.activity_hosts;

create policy "Allow all for hosts" on public.activity_hosts for all to anon, authenticated, service_role using (true) with check (true);

-- Also communities (just in case)
alter table public.communities enable row level security;
drop policy if exists "Allow all for communities" on public.communities;
create policy "Allow all for communities" on public.communities for all to anon, authenticated, service_role using (true) with check (true);

-- community_managers
alter table public.community_managers enable row level security;
drop policy if exists "Allow all for community_managers" on public.community_managers;
create policy "Allow all for community_managers" on public.community_managers for all to anon, authenticated, service_role using (true) with check (true);
`;

async function run() {
  try {
    await client.connect();
    console.log('Connected. Opening DB permissions...');
    await client.query(sql);
    console.log('Success! Database is now open for custom auth.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
