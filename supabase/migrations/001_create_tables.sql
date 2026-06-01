-- Playground profile table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text not null default 'Anonymous',
  created_at timestamptz default now()
);

-- Playgrounds seeded from Google Places
create table public.playgrounds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lat float not null,
  lng float not null,
  google_place_id text unique not null,
  avg_rating float default 0,
  rating_count int default 0,
  city text,
  country text check (country in ('CA', 'US')),
  created_at timestamptz default now()
);

-- User ratings
create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  playground_id uuid references public.playgrounds(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  stars int not null check (stars between 1 and 5),
  amenities jsonb not null default '{}',
  comment text check (char_length(comment) <= 280),
  created_at timestamptz default now(),
  unique(playground_id, user_id)  -- one rating per user per playground
);

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Recalculate avg_rating and rating_count when a rating is inserted/updated/deleted
create or replace function public.update_playground_rating()
returns trigger as $$
begin
  update public.playgrounds
  set
    avg_rating = (select coalesce(avg(stars), 0) from public.ratings where playground_id = coalesce(new.playground_id, old.playground_id)),
    rating_count = (select count(*) from public.ratings where playground_id = coalesce(new.playground_id, old.playground_id))
  where id = coalesce(new.playground_id, old.playground_id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_rating_change
  after insert or update or delete on public.ratings
  for each row execute procedure public.update_playground_rating();
