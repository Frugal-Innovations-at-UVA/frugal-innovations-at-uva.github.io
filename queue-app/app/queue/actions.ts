"use server";

import { randomUUID, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createSessionCookie,
  destroySessionCookie,
  getSession,
  updateSessionName,
} from "@/lib/session";
import {
  PRINT_FILES_BUCKET,
  supabaseAdmin,
  type ActivityLogEntry,
  type Location,
  type Printer,
  type PrinterStatus,
  type PrintRequest,
  type PrintStatus,
  type TeamRoutingRule,
} from "@/lib/supabase";
import { sendConfirmationEmail, sendStatusChangeEmail } from "@/lib/email";
import { resolveLocationId } from "@/lib/routing";
import { logActivity } from "@/lib/activity";

export type LoginState = { error?: string } | undefined;

const FINISHED_STATUSES: PrintStatus[] = ["completed", "rejected", "cancelled"];

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.DASHBOARD_PASSWORD;

  if (!expected || !password || !safeEqual(password, expected)) {
    return { error: "Incorrect password." };
  }

  await createSessionCookie();
  revalidatePath("/queue/dashboard");
  return undefined;
}

export async function logout() {
  await destroySessionCookie();
  redirect("/queue/dashboard");
}

async function requireSession(): Promise<{ name: string | null }> {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");
  return { name: session.name };
}

export async function setAdminName(name: string): Promise<void> {
  await requireSession();
  await updateSessionName(name);
  revalidatePath("/queue/dashboard");
}

export async function createUploadUrl(fileName: string) {
  const extension = fileName.includes(".") ? fileName.split(".").pop() : "";
  const path = `${randomUUID()}${extension ? `.${extension}` : ""}`;

  const { data, error } = await supabaseAdmin()
    .storage.from(PRINT_FILES_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create upload URL");
  }

  return { path, signedUrl: data.signedUrl, token: data.token };
}

export interface SubmitRequestInput {
  teamName: string;
  teamNumber: number | null;
  requesterName: string;
  computingId: string;
  groupNumber: string;
  email: string;
  notes: string;
  filePath: string;
  fileName: string;
  originalFilePath: string;
  originalFileName: string;
  previewThumbnailPath: string | null;
  estimatedSeconds: number | null;
  estimatedWeightG: number | null;
  sliceMetadata: Record<string, unknown> | null;
}

export async function submitRequest(input: SubmitRequestInput): Promise<number> {
  const { data: rules } = await supabaseAdmin().from("team_routing_rules").select("*");
  const locationId = resolveLocationId(input.teamNumber, (rules as TeamRoutingRule[]) ?? []);

  const { data, error } = await supabaseAdmin()
    .from("print_requests")
    .insert({
      team_name: input.teamName,
      team_number: input.teamNumber,
      requester_name: input.requesterName,
      computing_id: input.computingId,
      group_number: input.groupNumber,
      email: input.email,
      notes: input.notes || null,
      file_path: input.filePath,
      file_name: input.fileName,
      original_file_path: input.originalFilePath,
      original_file_name: input.originalFileName,
      preview_thumbnail_path: input.previewThumbnailPath,
      slice_metadata: input.sliceMetadata,
      status: "queue",
      estimated_seconds: input.estimatedSeconds,
      estimated_weight_g: input.estimatedWeightG,
      location_id: locationId,
    })
    .select("id, print_number")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not submit request");
  }

  const row = data as { id: string; print_number: number };

  await logActivity(row.id, "submitted", "Request submitted", null);

  await sendConfirmationEmail({
    to: input.email,
    teamName: input.teamName,
    fileName: input.fileName,
    printNumber: row.print_number,
  });

  return row.print_number;
}

export interface RequestWithUrls extends PrintRequest {
  downloadUrl: string | null;
  originalDownloadUrl: string | null;
  thumbnailUrl: string | null;
}

export async function listRequests(): Promise<RequestWithUrls[]> {
  await requireSession();

  const { data, error } = await supabaseAdmin()
    .from("print_requests")
    .select("*")
    .order("created_at", { ascending: true });

  if (error || !data) {
    throw new Error(error?.message ?? "Could not load requests");
  }

  const rows = data as PrintRequest[];

  const withUrls = await Promise.all(
    rows.map(async (row) => {
      const [sliced, original, thumbnail] = await Promise.all([
        supabaseAdmin().storage.from(PRINT_FILES_BUCKET).createSignedUrl(row.file_path, 60 * 10),
        row.original_file_path
          ? supabaseAdmin()
              .storage.from(PRINT_FILES_BUCKET)
              .createSignedUrl(row.original_file_path, 60 * 10)
          : Promise.resolve({ data: null }),
        row.preview_thumbnail_path
          ? supabaseAdmin()
              .storage.from(PRINT_FILES_BUCKET)
              .createSignedUrl(row.preview_thumbnail_path, 60 * 10)
          : Promise.resolve({ data: null }),
      ]);

      return {
        ...row,
        downloadUrl: sliced.data?.signedUrl ?? null,
        originalDownloadUrl: original.data?.signedUrl ?? null,
        thumbnailUrl: thumbnail.data?.signedUrl ?? null,
      };
    })
  );

  return withUrls;
}

export interface UpdateStatusOptions {
  finishedNotes?: string;
  printerId?: string;
}

const STATUS_LABEL: Record<PrintStatus, string> = {
  queue: "Moved back to queue",
  printing: "Started printing",
  completed: "Marked completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export async function updateStatus(
  id: string,
  status: PrintStatus,
  options?: UpdateStatusOptions
) {
  const session = await requireSession();

  // Look up the request's current printer before mutating, so we can free
  // it back up if this transition moves the request out of "printing".
  const { data: existing } = await supabaseAdmin()
    .from("print_requests")
    .select("printer_id")
    .eq("id", id)
    .single();

  const previousPrinterId =
    (existing as { printer_id: string | null } | null)?.printer_id ?? null;

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "printing") {
    updates.printing_started_at = new Date().toISOString();
    if (options?.printerId) updates.printer_id = options.printerId;
  }

  if (FINISHED_STATUSES.includes(status) && options?.finishedNotes) {
    updates.finished_notes = options.finishedNotes;
  }

  const { data, error } = await supabaseAdmin()
    .from("print_requests")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not update request");
  }

  const row = data as PrintRequest;

  // Keep printer statuses in sync with the request that's occupying them:
  // mark a newly-assigned printer busy, and free up whichever printer this
  // request is leaving behind (guarded so we don't clobber a printer that's
  // since been marked offline or picked up by a different request).
  if (status === "printing" && options?.printerId) {
    await supabaseAdmin()
      .from("printers")
      .update({ status: "printing", updated_at: new Date().toISOString() })
      .eq("id", options.printerId);
  }

  if (status !== "printing" && previousPrinterId) {
    await supabaseAdmin()
      .from("printers")
      .update({ status: "ready", updated_at: new Date().toISOString() })
      .eq("id", previousPrinterId)
      .eq("status", "printing");
  }

  let activityMessage = STATUS_LABEL[status];
  if (status === "printing" && options?.printerId) {
    const { data: printer } = await supabaseAdmin()
      .from("printers")
      .select("name")
      .eq("id", options.printerId)
      .single();
    if (printer) activityMessage += ` on ${(printer as { name: string }).name}`;
  }
  if (FINISHED_STATUSES.includes(status) && options?.finishedNotes) {
    activityMessage += `: ${options.finishedNotes}`;
  }
  await logActivity(id, "status_change", activityMessage, session.name);

  await sendStatusChangeEmail({
    to: row.email,
    teamName: row.team_name,
    fileName: row.file_name,
    status,
    printNumber: row.print_number,
    finishedNotes: FINISHED_STATUSES.includes(status) ? options?.finishedNotes : undefined,
  });

  revalidatePath("/queue/dashboard");
  revalidatePath("/queue/dashboard/config");
  revalidatePath("/queue");
}

export async function restartPrintTimer(id: string) {
  await requireSession();

  const { error } = await supabaseAdmin()
    .from("print_requests")
    .update({
      printing_started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "printing");

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/queue/dashboard");
  revalidatePath("/queue");
}

// Manually sets a request's home location — used from the "Unassigned" tab
// when a submitted team number didn't match any routing rule, or to move a
// request to a different location's queue entirely.
export async function assignLocation(id: string, locationId: string): Promise<void> {
  const session = await requireSession();

  const { data: location } = await supabaseAdmin()
    .from("locations")
    .select("name")
    .eq("id", locationId)
    .single();

  const { error } = await supabaseAdmin()
    .from("print_requests")
    .update({ location_id: locationId, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  const locationName = (location as { name: string } | null)?.name ?? "a location";
  await logActivity(id, "status_change", `Assigned to ${locationName}`, session.name);

  revalidatePath("/queue/dashboard");
}

export async function updateAdminNotes(id: string, notes: string) {
  await requireSession();

  const { error } = await supabaseAdmin()
    .from("print_requests")
    .update({ admin_notes: notes || null })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/queue/dashboard");
}

export async function listActivity(printRequestId: string): Promise<ActivityLogEntry[]> {
  await requireSession();

  const { data, error } = await supabaseAdmin()
    .from("activity_log")
    .select("*")
    .eq("print_request_id", printRequestId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    throw new Error(error?.message ?? "Could not load activity");
  }

  return data as ActivityLogEntry[];
}

export async function addActivityNote(id: string, message: string): Promise<void> {
  const session = await requireSession();

  const trimmed = message.trim();
  if (!trimmed) throw new Error("Note cannot be empty");

  await logActivity(id, "note", trimmed, session.name);
  revalidatePath("/queue/dashboard");
}

export interface PublicBoardEntry {
  print_number: number;
  status: PrintStatus;
  printing_started_at: string | null;
  estimated_seconds: number | null;
}

export async function getPublicBoard(): Promise<PublicBoardEntry[]> {
  const { data, error } = await supabaseAdmin()
    .from("print_requests")
    .select("print_number, status, printing_started_at, estimated_seconds")
    .in("status", ["queue", "printing", "completed"])
    .order("print_number", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as PublicBoardEntry[];
}

// ---------------------------------------------------------------------------
// Locations, printers, and team-number routing rules — managed from
// /queue/dashboard/config. All admin-only, same session gate as everything
// above.
// ---------------------------------------------------------------------------

export async function listLocations(): Promise<Location[]> {
  await requireSession();

  const { data, error } = await supabaseAdmin()
    .from("locations")
    .select("*")
    .order("created_at", { ascending: true });

  if (error || !data) {
    throw new Error(error?.message ?? "Could not load locations");
  }

  return data as Location[];
}

export async function createLocation(name: string): Promise<Location> {
  await requireSession();

  const trimmed = name.trim();
  if (!trimmed) throw new Error("Location name is required");

  const { data, error } = await supabaseAdmin()
    .from("locations")
    .insert({ name: trimmed })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create location");
  }

  revalidatePath("/queue/dashboard/config");
  revalidatePath("/queue/dashboard");
  return data as Location;
}

export async function renameLocation(id: string, name: string): Promise<void> {
  await requireSession();

  const trimmed = name.trim();
  if (!trimmed) throw new Error("Location name is required");

  const { error } = await supabaseAdmin()
    .from("locations")
    .update({ name: trimmed })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/queue/dashboard/config");
  revalidatePath("/queue/dashboard");
}

// Deletes a location outright. Blocked (rather than cascading) if the
// location still has printers or requests pointing at it — those need to be
// moved/reassigned first, since silently orphaning a printer or a team's
// request onto a location that no longer exists would be confusing mid-event.
// Team routing rules for this location are deleted along with it (that's
// just config, easy to re-add) via the table's own ON DELETE CASCADE.
export async function deleteLocation(id: string): Promise<void> {
  await requireSession();

  const [{ count: printerCount }, { count: requestCount }] = await Promise.all([
    supabaseAdmin()
      .from("printers")
      .select("id", { count: "exact", head: true })
      .eq("location_id", id),
    supabaseAdmin()
      .from("print_requests")
      .select("id", { count: "exact", head: true })
      .eq("location_id", id),
  ]);

  if ((printerCount ?? 0) > 0) {
    throw new Error("Delete or move this location's printers first.");
  }
  if ((requestCount ?? 0) > 0) {
    throw new Error("This location still has requests assigned to it.");
  }

  const { error } = await supabaseAdmin().from("locations").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/queue/dashboard/config");
  revalidatePath("/queue/dashboard");
}

export async function listPrinters(): Promise<Printer[]> {
  await requireSession();

  const { data, error } = await supabaseAdmin()
    .from("printers")
    .select("*")
    .order("created_at", { ascending: true });

  if (error || !data) {
    throw new Error(error?.message ?? "Could not load printers");
  }

  return data as Printer[];
}

export async function createPrinter(
  name: string,
  locationId: string,
  gridX: number,
  gridY: number
): Promise<Printer> {
  await requireSession();

  const trimmed = name.trim();
  if (!trimmed) throw new Error("Printer name is required");

  const { data, error } = await supabaseAdmin()
    .from("printers")
    .insert({ name: trimmed, location_id: locationId, grid_x: gridX, grid_y: gridY })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create printer");
  }

  revalidatePath("/queue/dashboard/config");
  revalidatePath("/queue/dashboard");
  return data as Printer;
}

export async function updatePrinterPosition(
  id: string,
  gridX: number,
  gridY: number
): Promise<void> {
  await requireSession();

  const { error } = await supabaseAdmin()
    .from("printers")
    .update({ grid_x: gridX, grid_y: gridY, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/queue/dashboard/config");
}

export async function updatePrinterStatus(
  id: string,
  status: PrinterStatus
): Promise<void> {
  await requireSession();

  const { error } = await supabaseAdmin()
    .from("printers")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/queue/dashboard/config");
  revalidatePath("/queue/dashboard");
}

export async function deletePrinter(id: string): Promise<void> {
  await requireSession();

  const { error } = await supabaseAdmin().from("printers").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/queue/dashboard/config");
  revalidatePath("/queue/dashboard");
}

export async function listRoutingRules(): Promise<TeamRoutingRule[]> {
  await requireSession();

  const { data, error } = await supabaseAdmin()
    .from("team_routing_rules")
    .select("*")
    .order("min_team", { ascending: true });

  if (error || !data) {
    throw new Error(error?.message ?? "Could not load routing rules");
  }

  return data as TeamRoutingRule[];
}

export async function createRoutingRule(
  minTeam: number,
  maxTeam: number,
  locationId: string
): Promise<TeamRoutingRule> {
  await requireSession();

  if (!Number.isFinite(minTeam) || !Number.isFinite(maxTeam) || maxTeam < minTeam) {
    throw new Error("Invalid team number range");
  }

  const { data, error } = await supabaseAdmin()
    .from("team_routing_rules")
    .insert({ min_team: minTeam, max_team: maxTeam, location_id: locationId })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create routing rule");
  }

  revalidatePath("/queue/dashboard/config");
  return data as TeamRoutingRule;
}

export async function deleteRoutingRule(id: string): Promise<void> {
  await requireSession();

  const { error } = await supabaseAdmin().from("team_routing_rules").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/queue/dashboard/config");
}
