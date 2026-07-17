-- Run this once in the Supabase SQL editor for the queue project.

create table if not exists public.print_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  team_name text not null,
  requester_name text not null,
  email text not null,
  material text not null,
  color text,
  notes text,
  file_path text not null,
  file_name text not null,
  status text not null default 'pending'
    check (status in ('pending', 'printing', 'done', 'cancelled'))
);

alter table public.print_requests enable row level security;
-- No policies are added: all access goes through the Next.js server using the
-- service-role key, so RLS stays default-deny for the anon/public key.

-- "Automatically expose new tables" was left off in project setup, so grant
-- service_role access explicitly (it otherwise gets no privileges on new
-- tables either, not just anon/authenticated).
grant all on public.print_requests to service_role;

insert into storage.buckets (id, name, public)
values ('print-files', 'print-files', false)
on conflict (id) do nothing;
