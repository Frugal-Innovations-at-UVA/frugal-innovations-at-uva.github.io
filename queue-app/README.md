# Print Queue (`/queue`)

Next.js app for the make-a-thon 3D print request/queue system. Deployed separately from the
main static site (Vercel), reachable at `frugal-innovations.com/queue` via a Cloudflare Worker
route that proxies `/queue*` to this app — everything else on the domain still comes from
GitHub Pages untouched. See `cloudflare-worker.js` for that proxy script.

Pages render the *live* FISH header/footer/nav/CSS by fetching them from `/css`, `/js`,
`/partials`, etc. at request time (those requests fall through to GitHub Pages in production).
`next.config.ts` rewrites those same paths to `frugal-innovations.com` in local dev so this
still looks right without the Cloudflare layer in front of it.

## Setup

1. `npm install`
2. Copy `.env.local.example` to `.env.local` and fill in:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — from a Supabase project
   - `DASHBOARD_PASSWORD` — the admin dashboard password
   - `SESSION_SECRET` — any long random string (`openssl rand -base64 32`)
   - `RESEND_API_KEY` — from a Resend account (email notifications)
3. Run `supabase/migration.sql` in that project's SQL editor (creates the
   `print_requests` table and the private `print-files` storage bucket).
4. `npm run dev` — visit `http://localhost:3000/queue`.

## Deploying

Create a Vercel project from this repo with **Root Directory = `queue-app`**, add the same
env vars from step 2 above, deploy. Then update `VERCEL_HOST` in `cloudflare-worker.js` to the
resulting production domain and add it as a Cloudflare Worker with a route for
`frugal-innovations.com/queue*`.
