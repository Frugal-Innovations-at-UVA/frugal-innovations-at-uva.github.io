-- Run after migration_003_printers.sql.
-- Introduces multi-location ("farm") support: printers move from the static
-- lib/printers.ts array into a real table, keyed to a new locations table.
-- print_requests gains a home location_id (auto-routed at submission time
-- from a team_number field, see lib/routing.ts) and a printer_id FK. The old
-- free-text `printer` column is left in place, unused by new code, so
-- historical rows already printed under "Printer N" stay legible.

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.locations enable row level security;
grant all on public.locations to service_role;

create table if not exists public.printers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location_id uuid not null references public.locations(id) on delete restrict,
  grid_x integer not null default 0,
  grid_y integer not null default 0,
  status text not null default 'ready'
    check (status in ('ready', 'printing', 'offline')),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

alter table public.printers enable row level security;
grant all on public.printers to service_role;

create table if not exists public.team_routing_rules (
  id uuid primary key default gen_random_uuid(),
  min_team integer not null,
  max_team integer not null check (max_team >= min_team),
  location_id uuid not null references public.locations(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.team_routing_rules enable row level security;
grant all on public.team_routing_rules to service_role;

alter table public.print_requests
  add column if not exists team_number integer,
  add column if not exists location_id uuid references public.locations(id),
  add column if not exists printer_id uuid references public.printers(id) on delete set null;

-- Seed data so a fresh deploy isn't left with an empty printer picker.
-- Rename/re-arrange freely from /queue/dashboard/config afterward.
insert into public.locations (name)
values ('Main Farm')
on conflict (name) do nothing;

insert into public.printers (name, location_id, grid_x, grid_y)
select v.name, l.id, v.x, 0
from (values
  ('Printer 1', 0), ('Printer 2', 1), ('Printer 3', 2),
  ('Printer 4', 3), ('Printer 5', 4), ('Printer 6', 5)
) as v(name, x)
join public.locations l on l.name = 'Main Farm'
where not exists (select 1 from public.printers p where p.name = v.name);
