-- Run this once in the Supabase SQL editor, after migration.sql.
-- Adds order numbers, admin-only fields, gcode-derived estimates, and the
-- new Queue/Printing/Finished(Completed/Rejected/Cancelled) status taxonomy.

alter table public.print_requests
  add column if not exists print_number bigserial,
  add column if not exists computing_id text,
  add column if not exists group_number text,
  add column if not exists admin_notes text,
  add column if not exists finished_notes text,
  add column if not exists estimated_seconds integer,
  add column if not exists estimated_weight_g numeric,
  add column if not exists printing_started_at timestamptz;

update public.print_requests set status = 'queue' where status = 'pending';
update public.print_requests set status = 'completed' where status = 'done';

alter table public.print_requests drop constraint if exists print_requests_status_check;
alter table public.print_requests add constraint print_requests_status_check
  check (status in ('queue', 'printing', 'completed', 'rejected', 'cancelled'));
alter table public.print_requests alter column status set default 'queue';

alter table public.print_requests drop column if exists material;
alter table public.print_requests drop column if exists color;

-- "Automatically expose new tables" was left off in project setup (see
-- migration.sql), which means service_role gets no privileges on new
-- objects either — including the sequence bigserial columns create
-- automatically. Grant it explicitly, same as migration.sql did for the
-- table itself.
grant usage, select on sequence public.print_requests_print_number_seq to service_role;
