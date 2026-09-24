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
3. Run these migrations from `supabase/`, in this order, in that project's SQL editor:
   1. `migration.sql` — creates the `print_requests` table and the private `print-files`
      storage bucket.
   2. `migration_002_redesign.sql` — adds print numbers, admin notes, and the
      Queue/Printing/Completed/Rejected/Cancelled status taxonomy.
   3. `migration_003_printers.sql` — adds the (now-legacy) free-text printer column.
   4. `migration_004_locations_and_printers.sql` — adds multi-location ("farm") support:
      real `locations`/`printers` tables (replacing the old static printer list) and
      `team_routing_rules` for auto-assigning a request to a location by team number.
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

## Locations, printers, and the printer grid

Printers are no longer a static list in code — they (and the locations/"farms" they belong
to) are managed entirely from **`/queue/dashboard/config`**:

- **Add a location** with the "+ Add Location" field at the top. Use the pencil (✎) icon on a
  location's tab to rename it, or the ✕ icon to delete it — deleting is blocked if that
  location still has any printers or requests on it (move/reassign those first); any team
  routing rules for it are removed along with it.
- **Add, remove, or mark a printer offline/ready** from the printer list on the right of
  each location's tab. A printer that's marked offline can't be selected in the "Move to
  Printer" picker.
- **Arrange the printer layout** by dragging squares around the grid on the left. Positions
  save automatically; dropping a printer onto an already-occupied cell snaps it back.

An admin viewing one location's queue can still assign a print onto a printer that belongs to
a *different* location (useful when one farm is full) — the "Move to Printer" picker has its
own location switcher for this. When that happens, the request shows a
"`<Other Location>` → `<Printer Name>`" badge so it's clear the print physically lives
elsewhere.

## Team → location auto-routing

Each submission includes a numeric **Team Number**. On the same `/queue/dashboard/config`
page, the **"Team → Location Routing"** panel lets you map ranges of team numbers to a
location (e.g. teams 1–4 → Farm 1, 5–10 → Farm 2, 11–15 → Farm 3) — add or remove ranges
there before the event, no code changes needed. A request whose team number doesn't fall in
any configured range lands in the **Unassigned** tab on the dashboard; an admin sets its
location by hand from there (moving it into any location's Queue makes it show up under that
location going forward).

## Admin attribution

The dashboard still uses a single shared `DASHBOARD_PASSWORD` — there's no per-admin account
system. Each admin is asked their name once per browser session (a one-time prompt after
logging in), and that name gets attached to the status changes and notes they make afterward
so the team can see who did what.

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
