-- Supabase Advisor: enable RLS on public tables exposed to PostgREST.
-- Your Node server uses the service role key, which bypasses RLS — no policy changes needed for the API.
-- Anon/authenticated clients get no table access until you add explicit policies (recommended if you ever query from the browser).

ALTER TABLE IF EXISTS public.beats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.purchases ENABLE ROW LEVEL SECURITY;

-- stripe_events only exists after running 004_create_stripe_events.sql.
-- Use a guarded block so this migration never errors if 004 was not applied yet.
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'stripe_events'
  ) then
    alter table public.stripe_events enable row level security;
  end if;
end $$;

-- Optional later: if you need the storefront to read public beat availability via anon key,
-- add something like:
-- CREATE POLICY "Public read beats availability"
--   ON public.beats FOR SELECT TO anon
--   USING (true);
-- (Only add if you actually use Supabase client from the browser for this table.)
