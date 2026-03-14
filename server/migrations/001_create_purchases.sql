create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  stripe_checkout_session_id text not null,
  stripe_payment_intent_id text,
  stripe_price_id text,
  stripe_product_id text,
  buyer_email text,
  beat_id text,
  beat_title_snapshot text,
  product_name_snapshot text,
  license_type text,
  amount_total bigint,
  currency text,
  payment_status text,
  raw_metadata jsonb,
  fulfilled boolean not null default false
);

create unique index if not exists purchases_stripe_checkout_session_id_key
  on public.purchases (stripe_checkout_session_id);

create index if not exists purchases_beat_id_idx
  on public.purchases (beat_id);

create index if not exists purchases_buyer_email_idx
  on public.purchases (buyer_email);

