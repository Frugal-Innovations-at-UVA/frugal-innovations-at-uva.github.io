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
3. Run `supabase/migration.sql`, then `supabase/migration_002_redesign.sql`, then
   `supabase/migration_003_printers.sql`, in that project's SQL editor, in that order
   (creates the `print_requests` table and the private `print-files` storage bucket,
   adds print numbers/admin notes/the Queue/Printing/Completed/Rejected/Cancelled
   status taxonomy, then adds printer assignment).
4. `npm run dev` — visit `http://localhost:3000/queue`.

## How to run locally

This app is a **separate server** from the main static site — running one doesn't run the
other, and they don't talk to each other locally (only in production, via the Cloudflare
Worker). If you're used to running the main site with `python3 -m http.server 8000` from
the repo root, note that server has no idea `/queue` exists — visiting
`localhost:8000/queue` will just 404.

To run the queue app:

```
cd queue-app
npm run dev
```

Then visit **`http://localhost:3000/queue`** (not `:8000`, not `/queue` on the static
site's port). If you also want the main static site running at the same time, that's a
second terminal, second server, second port — both can run simultaneously, they just live
on different ports (`8000` for the static site, `3000` for this app).

## Changing the printer list

The dropdown admins use to assign a printer (and the "which printers are free" summary on
the Printing tab) both read from a single list in `lib/printers.ts`. To add, rename, or
remove a printer, edit the `PRINTERS` array there — nothing else in the app needs to change.

## Deploying

Create a Vercel project from this repo with **Root Directory = `queue-app`**, add the same
env vars from step 2 above, deploy. Then update `VERCEL_HOST` in `cloudflare-worker.js` to the
resulting production domain and add it as a Cloudflare Worker with a route for
`frugal-innovations.com/queue*`.

## Before the event

`print_number` is a `bigserial` — it does **not** reset when rows are deleted, only on
`TRUNCATE ... RESTART IDENTITY` or an explicit sequence reset. After all testing/dev work is
done and before real students start submitting, run this once in Supabase's SQL editor so the
first real submission is #1:

```sql
ALTER SEQUENCE print_requests_print_number_seq RESTART WITH 1;
```
