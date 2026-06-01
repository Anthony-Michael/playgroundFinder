-- Enable RLS
alter table public.users enable row level security;
alter table public.playgrounds enable row level security;
alter table public.ratings enable row level security;

-- Playgrounds: anyone can read, no one can insert/update directly (seeded via API)
create policy "Anyone can read playgrounds" on public.playgrounds
  for select using (true);

-- Ratings: anyone can read
create policy "Anyone can read ratings" on public.ratings
  for select using (true);

-- Ratings: authenticated users can insert their own
create policy "Users can insert own ratings" on public.ratings
  for insert with check (auth.uid() = user_id);

-- Ratings: users can update their own
create policy "Users can update own ratings" on public.ratings
  for update using (auth.uid() = user_id);

-- Ratings: users can delete their own
create policy "Users can delete own ratings" on public.ratings
  for delete using (auth.uid() = user_id);

-- Users: anyone can read display names (for reviews)
create policy "Anyone can read user profiles" on public.users
  for select using (true);

-- Users: users can update their own profile
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);
