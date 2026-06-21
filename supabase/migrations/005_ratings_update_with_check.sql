-- The original update policy had `using` but no `with check`, so a user could
-- update their own row and reassign user_id to someone else. Add the check.
drop policy "Users can update own ratings" on public.ratings;
create policy "Users can update own ratings" on public.ratings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
