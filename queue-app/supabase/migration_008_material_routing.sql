-- Run this once in the Supabase SQL editor, after migration_007.
-- Adds material-based routing: a request whose sliced file uses a given
-- filament type (e.g. TPU) is sent to a specific location, taking priority
-- over the team-number ranges in team_routing_rules. Managed from
-- /queue/dashboard/config.

create table if not exists public.material_routing_rules (
  id uuid primary key default gen_random_uuid(),
  material text not null,
  location_id uuid not null references public.locations(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.material_routing_rules enable row level security;
grant all on public.material_routing_rules to service_role;
