export interface GcodeMetadata {
  estimatedSeconds: number | null;
  estimatedWeightG: number | null;
}

function parseDuration(text: string): number | null {
  const hours = /(\d+)\s*h/i.exec(text);
  const minutes = /(\d+)\s*m(?!m)/i.exec(text);
  const seconds = /(\d+)\s*s/i.exec(text);

  if (!hours && !minutes && !seconds) return null;

  return (
    (hours ? parseInt(hours[1], 10) * 3600 : 0) +
    (minutes ? parseInt(minutes[1], 10) * 60 : 0) +
    (seconds ? parseInt(seconds[1], 10) : 0)
  );
}

// Parses the Bambu Studio / OrcaSlicer header comment block, which is
// always near the top of the file, e.g.:
//   ; model printing time: 1h 2m 3s; total estimated time: 1h 10m 45s
//   ; total filament weight [g] : 15.23
// Callers should pass only the first few KB of the file (the header block),
// not the whole gcode, since that's all this ever needs to look at.
export function parseGcodeMetadata(headerText: string): GcodeMetadata {
  let estimatedSeconds: number | null = null;
  const totalTimeMatch = /total estimated time\s*:\s*([^\n;]+)/i.exec(headerText);
  if (totalTimeMatch) {
    estimatedSeconds = parseDuration(totalTimeMatch[1]);
  }
  if (estimatedSeconds === null) {
    const modelTimeMatch = /model printing time\s*:\s*([^\n;]+)/i.exec(headerText);
    if (modelTimeMatch) estimatedSeconds = parseDuration(modelTimeMatch[1]);
  }

  let estimatedWeightG: number | null = null;
  const weightMatch = /total filament weight \[g\]\s*:\s*([\d.]+)/i.exec(headerText);
  if (weightMatch) estimatedWeightG = parseFloat(weightMatch[1]);

  return { estimatedSeconds, estimatedWeightG };
}

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}
