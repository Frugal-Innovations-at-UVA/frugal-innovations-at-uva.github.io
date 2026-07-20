import { unzipSync, strFromU8 } from "fflate";

export interface PrintFileMetadata {
  estimatedSeconds: number | null;
  estimatedWeightG: number | null;
}

const SLICE_INFO_PATH = "Metadata/slice_info.config";

// Bambu Studio's sliced export (.gcode.3mf) is a zip archive. The print time
// and filament weight Bambu Studio computed during slicing live in a small
// XML file inside it, e.g.:
//   <metadata key="prediction" value="3141"/>   (seconds)
//   <metadata key="weight" value="29.45"/>       (grams)
// Verified against a real Bambu Studio 02.07.01.62 export.
export async function parsePrintFileMetadata(file: File): Promise<PrintFileMetadata> {
  const empty: PrintFileMetadata = { estimatedSeconds: null, estimatedWeightG: null };

  try {
    const buffer = new Uint8Array(await file.arrayBuffer());
    const entries = unzipSync(buffer, {
      filter: (entry) => entry.name === SLICE_INFO_PATH,
    });

    const entry = entries[SLICE_INFO_PATH];
    if (!entry) return empty;

    const xmlText = strFromU8(entry);
    const doc = new DOMParser().parseFromString(xmlText, "application/xml");

    const prediction = doc
      .querySelector('metadata[key="prediction"]')
      ?.getAttribute("value");
    const weight = doc.querySelector('metadata[key="weight"]')?.getAttribute("value");

    return {
      estimatedSeconds: prediction ? parseInt(prediction, 10) : null,
      estimatedWeightG: weight ? parseFloat(weight) : null,
    };
  } catch {
    return empty;
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
