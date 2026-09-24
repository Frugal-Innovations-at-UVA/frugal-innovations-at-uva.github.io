-- Run after migration_005_dual_upload_and_metadata.sql.
-- Chronological, per-request activity timeline: submission, status
-- transitions, and admin notes, each optionally attributed to the admin's
-- session-captured name. Distinct from the existing admin_notes column,
-- which stays a private, single-value scratchpad not shown in this timeline.

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  print_request_id uuid not null references public.print_requests(id) on delete cascade,
  event_type text not null
    check (event_type in ('submitted', 'status_change', 'note')),
  message text not null,
  admin_name text,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_print_request_id_idx
  on public.activity_log (print_request_id);

alter table public.activity_log enable row level security;
grant all on public.activity_log to service_role;
