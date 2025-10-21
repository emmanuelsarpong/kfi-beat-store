# KFI Music (Next.js 14)

Production-ready Next.js 14 app with App Router, Stripe Checkout, Supabase Storage, and Nodemailer for delivering signed download links after purchase.

## Features

- App Router with server components and server actions
- Stripe Checkout + Webhook handling
- Supabase admin client for generating signed download URLs
- Transactional email via Nodemailer
- TypeScript, ESLint, and strict mode

## Prerequisites

- Node.js 18+ and npm
- Supabase project with a `beats` storage bucket
- Stripe account with a Price ID for the beat
- SMTP credentials (e.g., Resend SMTP, Mailgun, SendGrid, or your provider)

## Setup

1. Copy envs:
   - cp .env.local.example .env.local
   - Fill in all variables (public + server-side)
2. Install dependencies:
   - npm install
3. Start dev server:
   - npm run dev

## Webhooks

- Run Stripe CLI to forward webhooks locally:
  - stripe listen --forward-to localhost:3000/api/webhook
  - Set STRIPE_WEBHOOK_SECRET to the signing secret from the CLI

## Notes

- Signed URLs are short-lived by default (1 hour). Adjust as needed in the code.
- For production, set NEXT_PUBLIC_SITE_URL to your deployed domain.

## License

MIT
