"use server";

import { randomUUID, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createSessionCookie,
  destroySessionCookie,
  hasValidSession,
} from "@/lib/session";
import {
  PRINT_FILES_BUCKET,
  supabaseAdmin,
  type PrintRequest,
  type PrintStatus,
} from "@/lib/supabase";
import { sendConfirmationEmail, sendStatusChangeEmail } from "@/lib/email";

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

async function requireSession() {
  const ok = await hasValidSession();
  if (!ok) throw new Error("Not authenticated");
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
  requesterName: string;
  computingId: string;
  groupNumber: string;
  email: string;
  notes: string;
  filePath: string;
  fileName: string;
  estimatedSeconds: number | null;
  estimatedWeightG: number | null;
}

export async function submitRequest(input: SubmitRequestInput): Promise<number> {
  const { data, error } = await supabaseAdmin()
    .from("print_requests")
    .insert({
      team_name: input.teamName,
      requester_name: input.requesterName,
      computing_id: input.computingId,
      group_number: input.groupNumber,
      email: input.email,
      notes: input.notes || null,
      file_path: input.filePath,
      file_name: input.fileName,
      status: "queue",
      estimated_seconds: input.estimatedSeconds,
      estimated_weight_g: input.estimatedWeightG,
    })
    .select("print_number")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not submit request");
  }

  const printNumber = (data as { print_number: number }).print_number;

  await sendConfirmationEmail({
    to: input.email,
    teamName: input.teamName,
    fileName: input.fileName,
    printNumber,
  });

  return printNumber;
}

export async function listRequests(): Promise<
  (PrintRequest & { downloadUrl: string | null })[]
> {
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
      const { data: signed } = await supabaseAdmin()
        .storage.from(PRINT_FILES_BUCKET)
        .createSignedUrl(row.file_path, 60 * 10);

      return { ...row, downloadUrl: signed?.signedUrl ?? null };
    })
  );

  return withUrls;
}

export interface UpdateStatusOptions {
  finishedNotes?: string;
  printer?: string;
}

export async function updateStatus(
  id: string,
  status: PrintStatus,
  options?: UpdateStatusOptions
) {
  await requireSession();

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "printing") {
    updates.printing_started_at = new Date().toISOString();
    if (options?.printer) updates.printer = options.printer;
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

  await sendStatusChangeEmail({
    to: row.email,
    teamName: row.team_name,
    fileName: row.file_name,
    status,
    printNumber: row.print_number,
    finishedNotes: FINISHED_STATUSES.includes(status) ? options?.finishedNotes : undefined,
  });

  revalidatePath("/queue/dashboard");
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
