import type { TeamRoutingRule } from "./supabase";

// Matches a submitted team number against the admin-configured routing
// ranges (managed from /queue/dashboard/config) and returns the location a
// request should land in. Returns null on no match (or no team number),
// leaving the request "Unassigned" so an admin can set its location by hand
// instead of silently defaulting somewhere wrong.
export function resolveLocationId(
  teamNumber: number | null,
  rules: TeamRoutingRule[]
): string | null {
  if (teamNumber == null || !Number.isFinite(teamNumber)) return null;

  const match = rules.find(
    (rule) => teamNumber >= rule.min_team && teamNumber <= rule.max_team
  );

  return match?.location_id ?? null;
}
