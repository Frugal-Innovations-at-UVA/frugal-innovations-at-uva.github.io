import type { Location, Printer, PrintRequest } from "./supabase";

// Renders how an assigned printer should be labeled for a request: its
// plain name when it's in the request's home location, or
// "<Other Location> → <Printer Name>" when the request was pulled onto a
// printer that physically lives elsewhere (see PrinterPickerModal — cross-
// location assignment when one farm is full).
export function printerDisplayLabel(
  row: Pick<PrintRequest, "printer_id" | "location_id" | "printer">,
  printers: Printer[],
  locations: Location[]
): string | null {
  if (row.printer_id) {
    const printer = printers.find((p) => p.id === row.printer_id);
    if (printer) {
      if (row.location_id && printer.location_id !== row.location_id) {
        const otherLocation = locations.find((l) => l.id === printer.location_id);
        return `${otherLocation?.name ?? "Other Location"} → ${printer.name}`;
      }
      return printer.name;
    }
  }

  // Legacy rows written before migration_004 only have the free-text
  // `printer` column set (no printer_id/location_id).
  return row.printer;
}
