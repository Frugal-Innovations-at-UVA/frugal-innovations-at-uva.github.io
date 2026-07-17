import { Resend } from "resend";
import type { PrintStatus } from "./supabase";

function resendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

const FROM_ADDRESS = "FISH Print Queue <onboarding@resend.dev>";

const STATUS_LABEL: Record<PrintStatus, string> = {
  pending: "Pending",
  printing: "Printing",
  done: "Done",
  cancelled: "Cancelled",
};

export async function sendConfirmationEmail(params: {
  to: string;
  teamName: string;
  fileName: string;
}) {
  const resend = resendClient();
  if (!resend) return;

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: params.to,
    subject: `Print request received — ${params.teamName}`,
    text: `Hi ${params.teamName},\n\nWe received your print request for "${params.fileName}". You'll get another email when its status changes.\n\n— FISH at UVA Make-A-Thon`,
  });
}

export async function sendStatusChangeEmail(params: {
  to: string;
  teamName: string;
  fileName: string;
  status: PrintStatus;
}) {
  const resend = resendClient();
  if (!resend) return;

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: params.to,
    subject: `Print update: ${params.fileName} — ${STATUS_LABEL[params.status]}`,
    text: `Hi ${params.teamName},\n\nYour print request for "${params.fileName}" is now: ${STATUS_LABEL[params.status]}.\n\n— FISH at UVA Make-A-Thon`,
  });
}
