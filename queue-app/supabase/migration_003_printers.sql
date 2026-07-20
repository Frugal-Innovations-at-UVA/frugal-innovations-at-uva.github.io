-- Run this once in the Supabase SQL editor, after migration_002_redesign.sql.
-- Adds printer assignment, captured when a request moves to "printing".

alter table public.print_requests
  add column if not exists printer text;
