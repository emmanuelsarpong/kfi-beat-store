# KFI Beat Store

Premium beats for the modern sound. Frontend built with Vite + React + TypeScript + Tailwind + shadcn-ui.

## Architecture

- Frontend: Vite + React (TypeScript) in the root (`src/`), built with Tailwind and shadcn-ui.
- Backend: Express (Node) in `server/`.
  - App assembly and middleware live in `server/app.js` (helmet, compression, CORS allowlist, logging, rate limiting, centralized error handling).
  - Entrypoint `server/index.js` just boots the app.
- Note: The legacy Next.js app (`kfi-music/`) has been removed as unused.

## Setup

1. Create a `.env` file at the repo root and fill in values (Stripe, Supabase service key, Resend, allowed origins, etc.).
2. Install deps and start the dev server.
   ```sh
   npm i
   npm run dev
   ```
3. Start the backend in another terminal if you want to test server routes locally:
   ```sh
   npm run server
   ```

## Local development

```sh
npm i
npm run dev
```

## Build

```sh
npm run build
npm run preview
```

Environment variables for the frontend (Vite) include `VITE_SERVER_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY`. See your `.env`.

## Deployment

### Frontend (Vercel)

- Set project env:
  - `VITE_SERVER_URL` → your backend URL (e.g. https://api.yourdomain.com)
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Configure your custom domain and ensure it matches `FRONTEND_URL` on the backend.
- Build command: `npm run build` (default)

### Backend (Railway/Render/Fly)

- Env required:
  - `PORT` (platform provides or set 8787 locally)
  - `FRONTEND_URL` (e.g. https://yourdomain.com)
  - `ORIGIN_WHITELIST` (comma-separated additional origins, e.g. https://www.yourdomain.com)
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET` (from Stripe Dashboard or `stripe listen`)
  - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
  - `RESEND_API_KEY`, `RESEND_FROM`, `CONTACT_RECIPIENTS`
  - `STRIPE_PRICE_ID_<BEAT_ID_OR_SLUG>` for each beat (value may be a `price_...` or `prod_...`)
- Start command: `npm start`
- Expose `/webhook/stripe` public URL and add it in Stripe Dashboard → Developers → Webhooks.

### Test the webhook with Stripe CLI (optional)

```sh
# Terminal A: run the backend locally
npm run server

# Terminal B: forward events to your local server
stripe listen --forward-to localhost:8787/webhook/stripe

# Trigger a test event
stripe trigger payment_intent.succeeded
```

Note: The webhook endpoint verifies the Stripe signature. In production, ensure `STRIPE_WEBHOOK_SECRET` matches the endpoint secret shown by Stripe (it’s different per endpoint).
