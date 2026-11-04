import type { PrintStatus } from "./supabase";

export const STATUS_DISPLAY_LABEL: Record<PrintStatus, string> = {
  queue: "In Queue",
  printing: "Printing",
  completed: "Complete",
  ready_for_pickup: "Ready for Pickup",
  picked_up: "Picked Up",
  rejected: "Rejected",
  cancelled: "Cancelled",
};
