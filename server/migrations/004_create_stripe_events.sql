-- Persistent Stripe webhook event storage for idempotency + retries.
-- Stores every verified event once (unique on event_id) and tracks processing status.

create table if not exists public.stripe_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  event_type text not null,
  status text not null default 'received',
  payload jsonb not null,
  error_message text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Allow only known statuses
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'stripe_events_status_check'
  ) then
    alter table public.stripe_events
      add constraint stripe_events_status_check
      check (status in ('received','processing','processed','failed'));
  end if;
end $$;

create unique index if not exists stripe_events_event_id_key
  on public.stripe_events (event_id);

create index if not exists stripe_events_status_idx
  on public.stripe_events (status);

create index if not exists stripe_events_created_at_idx
  on public.stripe_events (created_at desc);

-- Keep updated_at maintained automatically on updates
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists stripe_events_set_updated_at on public.stripe_events;
create trigger stripe_events_set_updated_at
before update on public.stripe_events
for each row
execute function public.set_updated_at();

