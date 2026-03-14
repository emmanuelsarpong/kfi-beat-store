-- Add exclusive availability tracking to beats table.
-- exclusive_available: false after first lease purchase OR after exclusive purchase.
-- first_lease_at: set on first lease purchase (starter/premium/unlimited).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'beats' AND column_name = 'exclusive_available'
  ) THEN
    ALTER TABLE public.beats
    ADD COLUMN exclusive_available boolean NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'beats' AND column_name = 'first_lease_at'
  ) THEN
    ALTER TABLE public.beats
    ADD COLUMN first_lease_at timestamptz NULL;
  END IF;
END
$$;
