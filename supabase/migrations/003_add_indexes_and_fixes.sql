-- Fix avg_rating precision
alter table public.playgrounds alter column avg_rating type numeric(3,2);

-- Add performance indexes
create index if not exists ratings_playground_id_idx on public.ratings(playground_id);
create index if not exists ratings_user_id_idx on public.ratings(user_id);
create index if not exists playgrounds_lat_lng_idx on public.playgrounds(lat, lng);
