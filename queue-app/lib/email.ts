import { Resend } from "resend";
import type { PrintStatus } from "./supabase";

function resendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

const FROM_ADDRESS = "FISH Print Queue <queue@mail.frugal-innovations.com>";

const STATUS_LABEL: Record<PrintStatus, string> = {
  queue: "In Queue",
  printing: "Printing",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export async function sendConfirmationEmail(params: {
  to: string;
  teamName: string;
  fileName: string;
  printNumber: number;
}) {
  const resend = resendClient();
  if (!resend) return;

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: params.to,
    subject: `Print #${params.printNumber} received — ${params.teamName}`,
    text: `Hi ${params.teamName},\n\nWe received your print request for "${params.fileName}". Your print number is #${params.printNumber}. You'll get another email when its status changes.\n\n— FISH at UVA Make-A-Thon Team`,
  });

  if (error) console.error("sendConfirmationEmail failed:", error);
}

export async function sendStatusChangeEmail(params: {
  to: string;
  teamName: string;
  fileName: string;
  status: PrintStatus;
  printNumber: number;
  finishedNotes?: string;
}) {
  const resend = resendClient();
  if (!resend) return;

  const noteLine = params.finishedNotes
    ? `\n\nNote from the print team: ${params.finishedNotes}`
    : "";

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: params.to,
    subject: `Print #${params.printNumber} update: ${params.fileName} — ${STATUS_LABEL[params.status]}`,
    text: `Hi ${params.teamName},\n\nYour print #${params.printNumber} ("${params.fileName}") is now: ${STATUS_LABEL[params.status]}.${noteLine}\n\n— FISH at UVA Make-A-Thon Team`,
  });

  if (error) console.error("sendStatusChangeEmail failed:", error);
}
