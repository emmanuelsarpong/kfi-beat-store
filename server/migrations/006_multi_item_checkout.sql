-- Multi-item checkout: one purchase row per (session, beat).
drop index if exists purchases_stripe_checkout_session_id_key;

create unique index if not exists purchases_session_beat_unique
  on public.purchases (stripe_checkout_session_id, beat_id);

-- Idempotent "order confirmation email" for a whole checkout session (multi-line carts).
create table if not exists public.checkout_order_emails (
  stripe_checkout_session_id text primary key,
  sent_at timestamptz not null default now()
);
