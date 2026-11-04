import type { MaterialRoutingRule, TeamRoutingRule } from "./supabase";

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

// Full routing for a new request: a material rule (e.g. TPU → Stacey) wins
// over the team-number ranges, so a TPU print from any team lands at the
// location that can print it. Falls back to resolveLocationId when no
// filament was detected or no material rule matches.
export function resolveRequestLocationId(
  teamNumber: number | null,
  teamRules: TeamRoutingRule[],
  materialRules: MaterialRoutingRule[],
  filamentTypes: string[]
): string | null {
  const present = new Set(filamentTypes.map((f) => f.trim().toLowerCase()));
  const materialMatch = materialRules.find((rule) =>
    present.has(rule.material.trim().toLowerCase())
  );

  return materialMatch?.location_id ?? resolveLocationId(teamNumber, teamRules);
}
