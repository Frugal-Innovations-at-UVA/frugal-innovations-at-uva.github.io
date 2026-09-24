"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { PrintRequest } from "@/lib/supabase";
import { formatDuration } from "@/lib/printFile";

// three.js is only loaded once the "3D Model" tab is actually opened.
const ModelViewer = dynamic(() => import("./ModelViewer"), {
  ssr: false,
  loading: () => <div className="queue-model-viewer__status">Loading viewer…</div>,
});

type Tab = "preview" | "model" | "metadata";

const TABS: { key: Tab; label: string }[] = [
  { key: "preview", label: "Preview" },
  { key: "model", label: "3D Model" },
  { key: "metadata", label: "Metadata" },
];

interface SliceMetadata {
  bedType?: string | null;
  filamentType?: string | null;
  nozzleDiameterMm?: string | null;
  infillDensityPercent?: string | null;
  infillPattern?: string | null;
  supportType?: string | null;
  printerModel?: string | null;
}

type Row = PrintRequest & {
  downloadUrl: string | null;
  originalDownloadUrl: string | null;
  thumbnailUrl: string | null;
};

export default function FilePreviewTabs({ row }: { row: Row }) {
  const [tab, setTab] = useState<Tab>("preview");
  const metadata = (row.slice_metadata ?? {}) as SliceMetadata;

  const metadataRows: [string, string][] = (
    [
      ["Bed Type", metadata.bedType],
      ["Filament Type", metadata.filamentType],
      ["Nozzle Diameter", metadata.nozzleDiameterMm ? `${metadata.nozzleDiameterMm}mm` : null],
      ["Infill Density", metadata.infillDensityPercent],
      ["Infill Pattern", metadata.infillPattern],
      ["Support Type", metadata.supportType],
      ["Printer Model", metadata.printerModel],
    ] as [string, string | null | undefined][]
  ).filter((entry): entry is [string, string] => Boolean(entry[1]));

  const hasAnyMetadata =
    row.estimated_seconds != null || row.estimated_weight_g != null || metadataRows.length > 0;

  return (
    <div className="queue-preview-tabs">
      <div className="queue-preview-tabs__nav">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`queue-preview-tabs__tab${tab === t.key ? " is-active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="queue-preview-tabs__body">
        {tab === "preview" &&
          (row.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- external signed Supabase Storage URL, not a local/optimizable asset
            <img
              className="queue-preview-tabs__image"
              src={row.thumbnailUrl}
              alt={`Preview of ${row.file_name}`}
            />
          ) : (
            <p className="queue-empty">No preview available for this file.</p>
          ))}

        {tab === "model" &&
          (row.originalDownloadUrl ? (
            <ModelViewer
              fileUrl={row.originalDownloadUrl}
              fileName={row.original_file_name ?? row.file_name}
            />
          ) : (
            <p className="queue-empty">
              No original design file was submitted with this request.
            </p>
          ))}

        {tab === "metadata" &&
          (hasAnyMetadata ? (
            <div className="queue-properties-display">
              {row.estimated_seconds != null && (
                <>
                  <div className="queue-prop-key">Estimated Print Time</div>
                  <div className="queue-prop-value">{formatDuration(row.estimated_seconds)}</div>
                </>
              )}
              {row.estimated_weight_g != null && (
                <>
                  <div className="queue-prop-key">Estimated Weight</div>
                  <div className="queue-prop-value">{row.estimated_weight_g.toFixed(1)}g</div>
                </>
              )}
              {metadataRows.map(([label, value]) => (
                <>
                  <div className="queue-prop-key" key={`${label}-key`}>
                    {label}
                  </div>
                  <div className="queue-prop-value" key={`${label}-value`}>
                    {value}
                  </div>
                </>
              ))}
            </div>
          ) : (
            <p className="queue-empty">No metadata detected for this file.</p>
          ))}
      </div>
    </div>
  );
}
