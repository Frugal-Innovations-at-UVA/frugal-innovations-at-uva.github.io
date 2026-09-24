"use client";

import type { Location } from "@/lib/supabase";

interface LocationSwitcherProps {
  locations: Location[];
  selectedLocationId: string | null;
  onSelect: (locationId: string) => void;
  counts?: Map<string, number>;
  // Renders an extra tab for requests with no location_id (unmatched team
  // number, or submitted before routing existed).
  unassignedCount?: number;
  onSelectUnassigned?: () => void;
  isUnassignedSelected?: boolean;
}

export default function LocationSwitcher({
  locations,
  selectedLocationId,
  onSelect,
  counts,
  unassignedCount,
  onSelectUnassigned,
  isUnassignedSelected,
}: LocationSwitcherProps) {
  if (locations.length === 0) return null;

  return (
    <div className="queue-location-switcher">
      {locations.map((location) => (
        <button
          key={location.id}
          type="button"
          className={`queue-tab${
            !isUnassignedSelected && selectedLocationId === location.id ? " is-active" : ""
          }`}
          onClick={() => onSelect(location.id)}
        >
          {location.name}
          {counts?.has(location.id) ? ` (${counts.get(location.id)})` : ""}
        </button>
      ))}
      {onSelectUnassigned && (
        <button
          type="button"
          className={`queue-tab${isUnassignedSelected ? " is-active" : ""}`}
          onClick={onSelectUnassigned}
        >
          Unassigned{unassignedCount ? ` (${unassignedCount})` : ""}
        </button>
      )}
    </div>
  );
}
