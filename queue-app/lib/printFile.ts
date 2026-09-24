import { unzipSync, strFromU8 } from "fflate";

export interface PrintFileMetadata {
  estimatedSeconds: number | null;
  estimatedWeightG: number | null;
  // Best-effort extras pulled from Bambu Studio's project_settings.config
  // (a JSON file embedded in the sliced .3mf). Exact key names/shapes have
  // only been spot-checked against one Bambu Studio export — treat these as
  // "usually present, not guaranteed" and re-verify against a real file
  // from this event if any of them come back empty in practice.
  bedType: string | null;
  filamentType: string | null;
  nozzleDiameterMm: string | null;
  infillDensityPercent: string | null;
  infillPattern: string | null;
  supportType: string | null;
  printerModel: string | null;
  // Nothing above is dropped silently — every key project_settings.config
  // actually contained is kept here too, for the Metadata tab to fall back
  // on or for future fields without a schema change.
  raw: Record<string, unknown>;
}

const SLICE_INFO_PATH = "Metadata/slice_info.config";
const PROJECT_SETTINGS_PATH = "Metadata/project_settings.config";

// Bambu Studio's sliced export (.gcode.3mf) is a zip archive that embeds a
// plate thumbnail image. The exact filename can vary by Bambu Studio
// version/plate count — these are the paths seen in the wild; unverified
// against a real file from this specific event, so this degrades to "no
// preview" rather than throwing if none match.
const THUMBNAIL_CANDIDATE_PATHS = [
  "Metadata/plate_1.png",
  "Metadata/plate_1_small.png",
  "Metadata/plate_no_light_1.png",
  "Metadata/top_1.png",
];

function firstArrayOrString(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

// Bambu Studio's sliced export (.gcode.3mf) is a zip archive. The print time
// and filament weight Bambu Studio computed during slicing live in a small
// XML file inside it, e.g.:
//   <metadata key="prediction" value="3141"/>   (seconds)
//   <metadata key="weight" value="29.45"/>       (grams)
// Verified against a real Bambu Studio 02.07.01.62 export. The richer
// fields (bed type, filament, infill, etc.) come from a second embedded
// file, project_settings.config, a JSON dump of the slicer profile — spot
// checked, not exhaustively verified; see PrintFileMetadata's field docs.
export async function parsePrintFileMetadata(file: File): Promise<PrintFileMetadata> {
  const empty: PrintFileMetadata = {
    estimatedSeconds: null,
    estimatedWeightG: null,
    bedType: null,
    filamentType: null,
    nozzleDiameterMm: null,
    infillDensityPercent: null,
    infillPattern: null,
    supportType: null,
    printerModel: null,
    raw: {},
  };

  try {
    const buffer = new Uint8Array(await file.arrayBuffer());
    const entries = unzipSync(buffer, {
      filter: (entry) => entry.name === SLICE_INFO_PATH || entry.name === PROJECT_SETTINGS_PATH,
    });

    const result = { ...empty };

    const sliceInfoEntry = entries[SLICE_INFO_PATH];
    if (sliceInfoEntry) {
      const xmlText = strFromU8(sliceInfoEntry);
      const doc = new DOMParser().parseFromString(xmlText, "application/xml");

      const prediction = doc
        .querySelector('metadata[key="prediction"]')
        ?.getAttribute("value");
      const weight = doc.querySelector('metadata[key="weight"]')?.getAttribute("value");

      result.estimatedSeconds = prediction ? parseInt(prediction, 10) : null;
      result.estimatedWeightG = weight ? parseFloat(weight) : null;
    }

    const settingsEntry = entries[PROJECT_SETTINGS_PATH];
    if (settingsEntry) {
      try {
        const raw = JSON.parse(strFromU8(settingsEntry)) as Record<string, unknown>;
        result.raw = raw;
        result.bedType = firstArrayOrString(raw.bed_type ?? raw.curr_bed_type);
        result.filamentType = firstArrayOrString(raw.filament_type);
        result.nozzleDiameterMm = firstArrayOrString(raw.nozzle_diameter);
        result.infillDensityPercent = firstArrayOrString(raw.sparse_infill_density ?? raw.fill_density);
        result.infillPattern = firstArrayOrString(raw.sparse_infill_pattern ?? raw.fill_pattern);
        result.supportType = firstArrayOrString(raw.support_type);
        result.printerModel = firstArrayOrString(raw.printer_model ?? raw.printer_settings_id);
      } catch {
        // project_settings.config wasn't valid JSON in this export — the
        // core time/weight numbers above still work fine without it.
      }
    }

    return result;
  } catch {
    return empty;
  }
}

// Extracts a plate thumbnail image from a sliced .3mf, if one of the known
// candidate paths is present, for use as the Preview tab's static image.
// Returns null (not a throw) when none match, so callers can gracefully
// fall back to "no preview available".
export async function extractThumbnail(
  file: File
): Promise<{ blob: Blob; ext: string } | null> {
  try {
    const buffer = new Uint8Array(await file.arrayBuffer());
    const entries = unzipSync(buffer, {
      filter: (entry) => THUMBNAIL_CANDIDATE_PATHS.includes(entry.name),
    });

    for (const path of THUMBNAIL_CANDIDATE_PATHS) {
      const entry = entries[path];
      if (entry) {
        return { blob: new Blob([entry], { type: "image/png" }), ext: "png" };
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

// Percent of estimated print time elapsed since startedAt, clamped 0-100.
export function progressPercent(
  startedAt: string,
  estimatedSeconds: number,
  now: number
): number {
  const elapsedMs = now - new Date(startedAt).getTime();
  return Math.min(100, Math.max(0, (elapsedMs / (estimatedSeconds * 1000)) * 100));
}
