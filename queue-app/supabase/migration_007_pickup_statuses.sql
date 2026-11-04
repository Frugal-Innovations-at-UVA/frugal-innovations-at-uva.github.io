-- Run this once in the Supabase SQL editor, after migration_006.
-- Adds the pickup workflow: completed -> ready_for_pickup -> picked_up.
-- Existing 'completed' rows are untouched.

alter table public.print_requests drop constraint if exists print_requests_status_check;
alter table public.print_requests add constraint print_requests_status_check
  check (status in (
    'queue', 'printing', 'completed', 'ready_for_pickup', 'picked_up', 'rejected', 'cancelled'
  ));
