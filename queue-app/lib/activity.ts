import { supabaseAdmin } from "./supabase";
import type { ActivityEventType } from "./supabase";

// Insert wrapper shared by every mutating action that should leave a trace
// on a request's Activity timeline (submission, status changes, notes).
// Best-effort: a logging failure never blocks the action that triggered it.
export async function logActivity(
  printRequestId: string,
  eventType: ActivityEventType,
  message: string,
  adminName: string | null
): Promise<void> {
  const { error } = await supabaseAdmin().from("activity_log").insert({
    print_request_id: printRequestId,
    event_type: eventType,
    message,
    admin_name: adminName,
  });

  if (error) {
    console.error("logActivity failed:", error);
  }
}
