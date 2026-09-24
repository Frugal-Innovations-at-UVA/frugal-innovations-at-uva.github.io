"use client";

import { useMemo, useState } from "react";
import type { Location, Printer } from "@/lib/supabase";
import PrinterGrid from "./PrinterGrid";

interface PrinterPickerModalProps {
  locations: Location[];
  printers: Printer[];
  busyByPrinterId: Map<string, number>;
  initialLocationId: string | null;
  onConfirm: (printerId: string) => void;
  onCancel: () => void;
}

// Matches the "Move to Printer" modal from the reference app: pick a
// location (defaults to the request's home location, but any location's
// printers can be picked — that's how a print gets pulled cross-farm when
// one location is full), then a printer within it.
export default function PrinterPickerModal({
  locations,
  printers,
  busyByPrinterId,
  initialLocationId,
  onConfirm,
  onCancel,
}: PrinterPickerModalProps) {
  const [locationId, setLocationId] = useState<string | null>(
    initialLocationId ?? locations[0]?.id ?? null
  );
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | null>(null);

  const printersHere = useMemo(
    () => printers.filter((p) => p.location_id === locationId),
    [printers, locationId]
  );

  const availableCount = printersHere.filter(
    (p) => p.status !== "offline" && !busyByPrinterId.has(p.id)
  ).length;

  return (
    <div className="queue-modal-overlay" role="dialog" aria-modal="true">
      <div className="queue-modal">
        <h2 className="queue-modal__title">Move to Printer</h2>
        <p className="queue-modal__subtitle">Select an available printer</p>

        <div className="queue-modal__locations">
          <div className="queue-location-switcher">
            {locations.map((location) => (
              <button
                key={location.id}
                type="button"
                className={`queue-tab${locationId === location.id ? " is-active" : ""}`}
                onClick={() => {
                  setLocationId(location.id);
                  setSelectedPrinterId(null);
                }}
              >
                {location.name}
              </button>
            ))}
          </div>
          <span className="queue-hint">{availableCount} available</span>
        </div>

        <PrinterGrid
          printers={printersHere}
          selectedPrinterId={selectedPrinterId}
          onSelectPrinter={(printer) => setSelectedPrinterId(printer.id)}
          busyPrintNumbers={busyByPrinterId}
        />

        <div className="queue-modal__actions">
          <button type="button" className="queue-btn-light" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="queue-btn-accent"
            disabled={!selectedPrinterId}
            onClick={() => selectedPrinterId && onConfirm(selectedPrinterId)}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
