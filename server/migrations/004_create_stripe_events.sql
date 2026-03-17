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

create unique index if not exists stripe_events_event_id_key
  on public.stripe_events (event_id);

create index if not exists stripe_events_status_idx
  on public.stripe_events (status);

create index if not exists stripe_events_created_at_idx
  on public.stripe_events (created_at desc);

