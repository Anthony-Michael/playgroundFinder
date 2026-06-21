-- Tracks which geographic tiles have already been seeded from Google Places,
-- so repeated map pans over the same area don't re-hit the (paid) Places API.
-- Tile key = lat/lng rounded to 2 decimal places, e.g. "43.65,-79.38".
create table public.seeded_tiles (
  tile text primary key,
  seeded_at timestamptz not null default now()
);

-- Only the seeding API (service role) touches this table; RLS on with no
-- policies means no anon/authenticated access.
alter table public.seeded_tiles enable row level security;
