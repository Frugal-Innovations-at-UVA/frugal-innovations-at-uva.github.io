import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const PRINT_FILES_BUCKET = "print-files";

export type PrintStatus =
  | "queue"
  | "printing"
  | "completed"
  | "rejected"
  | "cancelled";

export type PrinterStatus = "ready" | "printing" | "offline";

export interface Location {
  id: string;
  name: string;
  created_at: string;
}

export interface Printer {
  id: string;
  name: string;
  location_id: string;
  grid_x: number;
  grid_y: number;
  status: PrinterStatus;
  created_at: string;
  updated_at: string | null;
}

export interface TeamRoutingRule {
  id: string;
  min_team: number;
  max_team: number;
  location_id: string;
  created_at: string;
}

export type ActivityEventType = "submitted" | "status_change" | "note";

export interface ActivityLogEntry {
  id: string;
  print_request_id: string;
  event_type: ActivityEventType;
  message: string;
  admin_name: string | null;
  created_at: string;
}

export interface PrintRequest {
  id: string;
  created_at: string;
  updated_at: string | null;
  print_number: number;
  team_name: string;
  requester_name: string;
  computing_id: string;
  group_number: string;
  team_number: number | null;
  email: string;
  notes: string | null;
  admin_notes: string | null;
  finished_notes: string | null;
  file_path: string;
  file_name: string;
  original_file_path: string | null;
  original_file_name: string | null;
  preview_thumbnail_path: string | null;
  slice_metadata: Record<string, unknown> | null;
  status: PrintStatus;
  estimated_seconds: number | null;
  estimated_weight_g: number | null;
  printing_started_at: string | null;
  // Legacy free-text printer name, set by pre-migration_004 code. No longer
  // written; kept only so historical rows stay legible if ever displayed.
  printer: string | null;
  location_id: string | null;
  printer_id: string | null;
}

// No generated Supabase types for this short-lived project — the schema is
// small (one table) and defined in supabase/migration.sql. Row shapes are
// asserted at the call sites via PrintRequest instead of a generic Database type.
/* eslint-disable @typescript-eslint/no-explicit-any */
let client: SupabaseClient<any, "public", any> | null = null;

export function supabaseAdmin() {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set");
  }

  client = createClient<any, "public", any>(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return client;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
