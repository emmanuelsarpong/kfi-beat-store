-- Create beats table if it does not exist (e.g. new env).
-- Sync/seed will populate rows; this only ensures the schema exists.

CREATE TABLE IF NOT EXISTS public.beats (
  id text PRIMARY KEY,
  title text,
  sold boolean NOT NULL DEFAULT false,
  sold_at timestamptz NULL,
  exclusive_available boolean NOT NULL DEFAULT true,
  first_lease_at timestamptz NULL
);

-- Ensure columns exist for existing tables that may have been created with fewer columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beats' AND column_name = 'exclusive_available') THEN
    ALTER TABLE public.beats ADD COLUMN exclusive_available boolean NOT NULL DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beats' AND column_name = 'first_lease_at') THEN
    ALTER TABLE public.beats ADD COLUMN first_lease_at timestamptz NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beats' AND column_name = 'sold_at') THEN
    ALTER TABLE public.beats ADD COLUMN sold_at timestamptz NULL;
  END IF;
END
$$;
