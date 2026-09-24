-- Run after migration_004_locations_and_printers.sql.
-- Adds the second ("original design file") upload requirement, plus a
-- flexible JSON bucket for extra slicer metadata and a cached preview
-- thumbnail path — avoids one new column per metadata field.

alter table public.print_requests
  add column if not exists original_file_path text,
  add column if not exists original_file_name text,
  add column if not exists preview_thumbnail_path text,
  add column if not exists slice_metadata jsonb;

-- original_file_path/name are nullable: rows submitted before this migration
-- never collected a second file and are not backfilled.
