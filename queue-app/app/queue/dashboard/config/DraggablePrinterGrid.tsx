"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { Printer } from "@/lib/supabase";
import { PRINTER_GRID_COLUMNS, PRINTER_GRID_ROWS } from "@/lib/printerGrid";
import { updatePrinterPosition } from "../../actions";

interface DraggablePrinterGridProps {
  printers: Printer[];
  onPositionChange: (printerId: string, x: number, y: number) => void;
}

// Click-and-drag printer layout editor for the config page. Positions snap
// to grid cells and persist via updatePrinterPosition on release; a drop
// onto an already-occupied cell is rejected (the square snaps back).
export default function DraggablePrinterGrid({
  printers,
  onPositionChange,
}: DraggablePrinterGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [previewCell, setPreviewCell] = useState<{ x: number; y: number } | null>(null);

  function cellFromPointer(clientX: number, clientY: number) {
    const grid = gridRef.current;
    if (!grid) return null;
    const rect = grid.getBoundingClientRect();
    const cellWidth = rect.width / PRINTER_GRID_COLUMNS;
    const cellHeight = rect.height / PRINTER_GRID_ROWS;
    const x = Math.min(
      PRINTER_GRID_COLUMNS - 1,
      Math.max(0, Math.floor((clientX - rect.left) / cellWidth))
    );
    const y = Math.min(
      PRINTER_GRID_ROWS - 1,
      Math.max(0, Math.floor((clientY - rect.top) / cellHeight))
    );
    return { x, y };
  }

  function handlePointerDown(printer: Printer, event: ReactPointerEvent) {
    event.preventDefault();
    setDraggingId(printer.id);
    setPreviewCell({ x: printer.grid_x, y: printer.grid_y });
  }

  function handlePointerMove(event: ReactPointerEvent) {
    if (!draggingId) return;
    const cell = cellFromPointer(event.clientX, event.clientY);
    if (cell) setPreviewCell(cell);
  }

  function handlePointerUp() {
    if (!draggingId || !previewCell) {
      setDraggingId(null);
      setPreviewCell(null);
      return;
    }

    const dragged = printers.find((p) => p.id === draggingId);
    const occupied = new Set(
      printers.filter((p) => p.id !== draggingId).map((p) => `${p.grid_x},${p.grid_y}`)
    );
    const collides = occupied.has(`${previewCell.x},${previewCell.y}`);

    if (dragged && !collides) {
      onPositionChange(draggingId, previewCell.x, previewCell.y);
      updatePrinterPosition(draggingId, previewCell.x, previewCell.y).catch(() => {
        // Best-effort: a failed save just means the position reverts on the
        // next reload, an acceptable degrade for a drag-and-drop action.
      });
    }

    setDraggingId(null);
    setPreviewCell(null);
  }

  return (
    <div
      ref={gridRef}
      className="queue-draggable-grid"
      style={{
        gridTemplateColumns: `repeat(${PRINTER_GRID_COLUMNS}, 1fr)`,
        gridTemplateRows: `repeat(${PRINTER_GRID_ROWS}, 1fr)`,
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => {
        if (draggingId) {
          setDraggingId(null);
          setPreviewCell(null);
        }
      }}
    >
      {Array.from({ length: PRINTER_GRID_COLUMNS * PRINTER_GRID_ROWS }).map((_, index) => {
        const x = index % PRINTER_GRID_COLUMNS;
        const y = Math.floor(index / PRINTER_GRID_COLUMNS);
        const isPreview = draggingId != null && previewCell?.x === x && previewCell?.y === y;
        return (
          <div
            key={`${x}-${y}`}
            className={`queue-draggable-grid__cell${isPreview ? " is-preview" : ""}`}
            style={{ gridColumn: x + 1, gridRow: y + 1 }}
          />
        );
      })}

      {printers.map((printer) => {
        const isDragging = draggingId === printer.id;
        const displayX = isDragging && previewCell ? previewCell.x : printer.grid_x;
        const displayY = isDragging && previewCell ? previewCell.y : printer.grid_y;
        return (
          <div
            key={printer.id}
            onPointerDown={(event) => handlePointerDown(printer, event)}
            className={`queue-printer-square queue-printer-square--${printer.status}${
              isDragging ? " is-dragging" : ""
            }`}
            style={{ gridColumn: displayX + 1, gridRow: displayY + 1 }}
          >
            <span className="queue-printer-square__name">{printer.name}</span>
          </div>
        );
      })}
    </div>
  );
}
