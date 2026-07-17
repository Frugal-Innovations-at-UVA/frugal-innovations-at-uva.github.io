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
  email: string;
  material: string;
  color: string;
  notes: string;
  filePath: string;
  fileName: string;
}

export async function submitRequest(input: SubmitRequestInput) {
  const { error } = await supabaseAdmin()
    .from("print_requests")
    .insert({
      team_name: input.teamName,
      requester_name: input.requesterName,
      email: input.email,
      material: input.material,
      color: input.color,
      notes: input.notes || null,
      file_path: input.filePath,
      file_name: input.fileName,
      status: "pending",
    });

  if (error) {
    throw new Error(error.message);
  }

  await sendConfirmationEmail({
    to: input.email,
    teamName: input.teamName,
    fileName: input.fileName,
  });
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

export async function updateStatus(id: string, status: PrintStatus) {
  await requireSession();

  const { data, error } = await supabaseAdmin()
    .from("print_requests")
    .update({ status, updated_at: new Date().toISOString() })
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
  });

  revalidatePath("/queue/dashboard");
}
