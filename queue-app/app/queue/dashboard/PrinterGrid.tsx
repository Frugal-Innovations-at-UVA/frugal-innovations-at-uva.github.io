"use client";

import type { Printer } from "@/lib/supabase";
import { PRINTER_GRID_COLUMNS, PRINTER_GRID_ROWS } from "@/lib/printerGrid";

interface PrinterGridProps {
  printers: Printer[];
  selectedPrinterId?: string | null;
  onSelectPrinter?: (printer: Printer) => void;
  // printerId -> print_number currently occupying it. Passed in from the
  // caller since "busy" depends on all requests app-wide, not just the
  // printers being rendered here.
  busyPrintNumbers?: Map<string, number>;
}

export default function PrinterGrid({
  printers,
  selectedPrinterId,
  onSelectPrinter,
  busyPrintNumbers,
}: PrinterGridProps) {
  if (printers.length === 0) {
    return <p className="queue-empty">No printers in this location yet.</p>;
  }

  return (
    <div
      className="queue-printer-grid"
      style={{
        gridTemplateColumns: `repeat(${PRINTER_GRID_COLUMNS}, 1fr)`,
        gridTemplateRows: `repeat(${PRINTER_GRID_ROWS}, 1fr)`,
      }}
    >
      {printers.map((printer) => {
        const busyNumber = busyPrintNumbers?.get(printer.id);
        const clickable = Boolean(onSelectPrinter) && printer.status !== "offline" && !busyNumber;
        // Derive the displayed status from live request data (busyNumber)
        // rather than trusting printer.status alone for "printing" — that
        // way this stays accurate even without re-fetching printers after
        // every status change, only "offline" is a direct printer field.
        const effectiveStatus =
          printer.status === "offline" ? "offline" : busyNumber != null ? "printing" : "ready";

        return (
          <button
            key={printer.id}
            type="button"
            disabled={!clickable}
            onClick={() => clickable && onSelectPrinter?.(printer)}
            className={`queue-printer-square queue-printer-square--${effectiveStatus}${
              selectedPrinterId === printer.id ? " is-selected" : ""
            }`}
            style={{ gridColumn: printer.grid_x + 1, gridRow: printer.grid_y + 1 }}
            title={busyNumber ? `Busy — print #${busyNumber}` : effectiveStatus}
          >
            <span className="queue-printer-square__name">{printer.name}</span>
            {busyNumber != null && (
              <span className="queue-printer-square__badge">#{busyNumber}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
