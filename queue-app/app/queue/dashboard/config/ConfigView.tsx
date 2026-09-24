"use client";

import { useMemo, useState } from "react";
import type { Location, Printer, PrinterStatus, TeamRoutingRule } from "@/lib/supabase";
import {
  createLocation,
  createPrinter,
  createRoutingRule,
  deleteLocation,
  deletePrinter,
  deleteRoutingRule,
  renameLocation,
  updatePrinterStatus,
} from "../../actions";
import DraggablePrinterGrid from "./DraggablePrinterGrid";

type PrinterFilter = "all" | PrinterStatus;

const PRINTER_FILTERS: { key: PrinterFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "ready", label: "Ready" },
  { key: "printing", label: "Printing" },
  { key: "offline", label: "Offline" },
];

export default function ConfigView({
  initialLocations,
  initialPrinters,
  initialRoutingRules,
}: {
  initialLocations: Location[];
  initialPrinters: Printer[];
  initialRoutingRules: TeamRoutingRule[];
}) {
  const [locations, setLocations] = useState(initialLocations);
  const [printers, setPrinters] = useState(initialPrinters);
  const [routingRules, setRoutingRules] = useState(initialRoutingRules);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    initialLocations[0]?.id ?? null
  );
  const [printerFilter, setPrinterFilter] = useState<PrinterFilter>("all");
  const [newLocationName, setNewLocationName] = useState("");
  const [newPrinterName, setNewPrinterName] = useState("");
  const [renamingLocationId, setRenamingLocationId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [ruleMin, setRuleMin] = useState("");
  const [ruleMax, setRuleMax] = useState("");
  const [ruleLocationId, setRuleLocationId] = useState<string>(initialLocations[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);

  const printersHere = useMemo(
    () => printers.filter((p) => p.location_id === selectedLocationId),
    [printers, selectedLocationId]
  );

  const filteredPrinters = useMemo(() => {
    if (printerFilter === "all") return printersHere;
    return printersHere.filter((p) => p.status === printerFilter);
  }, [printersHere, printerFilter]);

  const statusCounts = useMemo(
    () => ({
      all: printersHere.length,
      ready: printersHere.filter((p) => p.status === "ready").length,
      printing: printersHere.filter((p) => p.status === "printing").length,
      offline: printersHere.filter((p) => p.status === "offline").length,
    }),
    [printersHere]
  );

  function locationName(id: string) {
    return locations.find((l) => l.id === id)?.name ?? "Unknown";
  }

  async function runAction(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  function handleCreateLocation() {
    const name = newLocationName.trim();
    if (!name) return;
    runAction(async () => {
      const created = await createLocation(name);
      setLocations((prev) => [...prev, created]);
      setNewLocationName("");
      setSelectedLocationId(created.id);
      setRuleLocationId((prev) => prev || created.id);
    });
  }

  function handleRenameLocation(id: string) {
    const name = renameDraft.trim();
    setRenamingLocationId(null);
    if (!name) return;
    runAction(async () => {
      await renameLocation(id, name);
      setLocations((prev) => prev.map((l) => (l.id === id ? { ...l, name } : l)));
    });
  }

  function handleDeleteLocation(location: Location) {
    if (
      !window.confirm(
        `Delete "${location.name}"? This can't be undone. Any team-routing rules for it will be removed too — it must have no printers or requests left on it first.`
      )
    ) {
      return;
    }
    runAction(async () => {
      await deleteLocation(location.id);
      setLocations((prev) => prev.filter((l) => l.id !== location.id));
      setRoutingRules((prev) => prev.filter((r) => r.location_id !== location.id));
      setSelectedLocationId((prev) =>
        prev === location.id ? (locations.find((l) => l.id !== location.id)?.id ?? null) : prev
      );
    });
  }

  function handleCreatePrinter() {
    const name = newPrinterName.trim();
    if (!name || !selectedLocationId) return;

    // Place the new printer in the first open cell along row 0, scanning
    // outward — a reasonable starting spot; admins drag it wherever
    // afterward on this same grid.
    const takenX = new Set(printersHere.filter((p) => p.grid_y === 0).map((p) => p.grid_x));
    let x = 0;
    while (takenX.has(x)) x += 1;

    runAction(async () => {
      const created = await createPrinter(name, selectedLocationId, x, 0);
      setPrinters((prev) => [...prev, created]);
      setNewPrinterName("");
    });
  }

  function handleToggleOffline(printer: Printer) {
    const nextStatus: PrinterStatus = printer.status === "offline" ? "ready" : "offline";
    runAction(async () => {
      await updatePrinterStatus(printer.id, nextStatus);
      setPrinters((prev) =>
        prev.map((p) => (p.id === printer.id ? { ...p, status: nextStatus } : p))
      );
    });
  }

  function handleDeletePrinter(printer: Printer) {
    if (!window.confirm(`Delete "${printer.name}"? This can't be undone.`)) return;
    runAction(async () => {
      await deletePrinter(printer.id);
      setPrinters((prev) => prev.filter((p) => p.id !== printer.id));
    });
  }

  function handlePositionChange(printerId: string, x: number, y: number) {
    setPrinters((prev) =>
      prev.map((p) => (p.id === printerId ? { ...p, grid_x: x, grid_y: y } : p))
    );
  }

  function handleCreateRule() {
    const min = parseInt(ruleMin, 10);
    const max = parseInt(ruleMax, 10);
    if (!Number.isFinite(min) || !Number.isFinite(max) || !ruleLocationId) {
      setError("Enter a valid min/max team number and pick a location.");
      return;
    }
    runAction(async () => {
      const created = await createRoutingRule(min, max, ruleLocationId);
      setRoutingRules((prev) => [...prev, created].sort((a, b) => a.min_team - b.min_team));
      setRuleMin("");
      setRuleMax("");
    });
  }

  function handleDeleteRule(id: string) {
    runAction(async () => {
      await deleteRoutingRule(id);
      setRoutingRules((prev) => prev.filter((r) => r.id !== id));
    });
  }

  return (
    <div className="queue-config">
      <div className="queue-config-tabs">
        {locations.map((location) => (
          <div key={location.id} className="queue-config-tab-wrap">
            {renamingLocationId === location.id ? (
              <input
                className="queue-input queue-config-tab-rename"
                value={renameDraft}
                autoFocus
                onChange={(e) => setRenameDraft(e.target.value)}
                onBlur={() => handleRenameLocation(location.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameLocation(location.id);
                  if (e.key === "Escape") setRenamingLocationId(null);
                }}
              />
            ) : (
              <div
                className={`queue-config-tab${selectedLocationId === location.id ? " is-active" : ""}`}
              >
                <button
                  type="button"
                  className="queue-config-tab__name"
                  onClick={() => setSelectedLocationId(location.id)}
                >
                  {location.name}
                </button>
                <button
                  type="button"
                  className="queue-config-tab__icon-btn"
                  title="Rename location"
                  aria-label={`Rename ${location.name}`}
                  onClick={() => {
                    setRenamingLocationId(location.id);
                    setRenameDraft(location.name);
                  }}
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="queue-config-tab__icon-btn queue-config-tab__icon-btn--danger"
                  title="Delete location"
                  aria-label={`Delete ${location.name}`}
                  onClick={() => handleDeleteLocation(location)}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        ))}
        <div className="queue-config-add-location">
          <input
            className="queue-input"
            placeholder="New location name"
            value={newLocationName}
            onChange={(e) => setNewLocationName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateLocation()}
          />
          <button type="button" className="queue-btn-light" onClick={handleCreateLocation}>
            + Add Location
          </button>
        </div>
      </div>

      {error && <p className="queue-error">{error}</p>}

      <div className="queue-config-layout">
        <div className="queue-config-panel">
          <h2 className="title-lg">Printer Layout</h2>
          <p className="queue-hint">Drag printers to reposition them.</p>
          {selectedLocationId ? (
            <DraggablePrinterGrid
              printers={printersHere}
              onPositionChange={handlePositionChange}
            />
          ) : (
            <p className="queue-empty">Create a location to get started.</p>
          )}
        </div>

        <div className="queue-config-panel">
          <h2 className="title-lg">Printers</h2>
          <div className="queue-config-add-printer">
            <input
              className="queue-input"
              placeholder="New printer name"
              value={newPrinterName}
              onChange={(e) => setNewPrinterName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreatePrinter()}
              disabled={!selectedLocationId}
            />
            <button
              type="button"
              className="queue-btn-accent"
              onClick={handleCreatePrinter}
              disabled={!selectedLocationId}
            >
              Create New Printer
            </button>
          </div>

          <div className="queue-tabs queue-config-status-chips">
            {PRINTER_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={`queue-tab${printerFilter === f.key ? " is-active" : ""}`}
                onClick={() => setPrinterFilter(f.key)}
              >
                {f.label} ({statusCounts[f.key]})
              </button>
            ))}
          </div>

          <div className="queue-config-printer-list">
            {filteredPrinters.length === 0 ? (
              <p className="queue-empty">No printers in this view.</p>
            ) : (
              filteredPrinters.map((printer) => (
                <div key={printer.id} className="queue-config-printer-row">
                  <span
                    className={`queue-status-badge queue-status-badge--${
                      printer.status === "printing"
                        ? "printing"
                        : printer.status === "offline"
                          ? "rejected"
                          : "completed"
                    }`}
                  >
                    {printer.status}
                  </span>
                  <span className="queue-config-printer-row__name">{printer.name}</span>
                  <div className="queue-config-printer-row__actions">
                    <button
                      type="button"
                      className="queue-btn-light"
                      onClick={() => handleToggleOffline(printer)}
                    >
                      {printer.status === "offline" ? "Mark Ready" : "Mark Offline"}
                    </button>
                    <button
                      type="button"
                      className="queue-btn-light"
                      onClick={() => handleDeletePrinter(printer)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="queue-config-panel">
        <h2 className="title-lg">Team → Location Routing</h2>
        <p className="queue-hint">
          Requests are auto-assigned to a location based on the Team Number submitted with the
          request. Add a range per location below; a team number with no matching range leaves
          its request &quot;Unassigned&quot; until an admin sets its location manually from the
          dashboard.
        </p>

        <div className="queue-config-rule-list">
          {routingRules.length === 0 ? (
            <p className="queue-empty">No routing rules yet — all requests will be Unassigned.</p>
          ) : (
            routingRules.map((rule) => (
              <div key={rule.id} className="queue-config-rule-row">
                <span>
                  Teams {rule.min_team}–{rule.max_team} → <strong>{locationName(rule.location_id)}</strong>
                </span>
                <button
                  type="button"
                  className="queue-btn-light"
                  onClick={() => handleDeleteRule(rule.id)}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>

        <div className="queue-config-rule-form">
          <input
            className="queue-input"
            type="number"
            placeholder="Min team #"
            value={ruleMin}
            onChange={(e) => setRuleMin(e.target.value)}
          />
          <input
            className="queue-input"
            type="number"
            placeholder="Max team #"
            value={ruleMax}
            onChange={(e) => setRuleMax(e.target.value)}
          />
          <select
            className="queue-select"
            value={ruleLocationId}
            onChange={(e) => setRuleLocationId(e.target.value)}
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <button type="button" className="queue-btn-accent" onClick={handleCreateRule}>
            Add Rule
          </button>
        </div>
      </div>
    </div>
  );
}
