"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { PrintRequest, PrintStatus } from "@/lib/supabase";
import { logout, updateStatus } from "../actions";

type Row = PrintRequest & { downloadUrl: string | null };

const TABS: { key: PrintStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "printing", label: "Printing" },
  { key: "done", label: "Done" },
  { key: "cancelled", label: "Cancelled" },
];

const NEXT_STATUS: Record<PrintStatus, { label: string; status: PrintStatus }[]> = {
  pending: [
    { label: "Start Printing", status: "printing" },
    { label: "Cancel", status: "cancelled" },
  ],
  printing: [
    { label: "Mark Done", status: "done" },
    { label: "Cancel", status: "cancelled" },
  ],
  done: [],
  cancelled: [{ label: "Reopen", status: "pending" }],
};

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DashboardView({
  initialRequests,
}: {
  initialRequests: Row[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [tab, setTab] = useState<PrintStatus | "all">("all");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(
    () => (tab === "all" ? requests : requests.filter((r) => r.status === tab)),
    [requests, tab]
  );

  function handleStatusChange(id: string, status: PrintStatus) {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
    startTransition(async () => {
      await updateStatus(id, status);
    });
  }

  return (
    <>
      <div className="queue-dashboard-header">
        <div>
          <Link className="queue-back-link" href="/queue">
            ← Back to Queue
          </Link>
          <p className="queue-eyebrow">Admin Dashboard</p>
          <h1 className="title-lg">Print Queue</h1>
        </div>
        <form className="queue-logout-form" action={logout}>
          <button className="queue-btn-light" type="submit">
            Log Out
          </button>
        </form>
      </div>

      <div className="queue-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`queue-tab${tab === t.key ? " is-active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="queue-empty">No requests in this view.</p>
      ) : (
        <div className="queue-requests-list">
          {filtered.map((row) => (
            <article className="queue-request-card" key={row.id}>
              <div className="queue-request-card__top">
                <span className="queue-request-card__team">
                  {row.team_name}
                </span>
                <span className={`queue-status-badge queue-status-badge--${row.status}`}>
                  {row.status}
                </span>
              </div>

              <div className="queue-request-card__meta">
                <div>
                  <span>Requester</span>
                  {row.requester_name}
                </div>
                <div>
                  <span>Email</span>
                  {row.email}
                </div>
                <div>
                  <span>Material</span>
                  {row.material}
                  {row.color ? ` / ${row.color}` : ""}
                </div>
                <div>
                  <span>Submitted</span>
                  {formatDate(row.created_at)}
                </div>
              </div>

              {row.notes && (
                <p className="queue-request-card__notes">{row.notes}</p>
              )}

              <div className="queue-request-card__actions">
                {row.downloadUrl && (
                  <a
                    className="queue-btn-light"
                    href={row.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download {row.file_name}
                  </a>
                )}
                {NEXT_STATUS[row.status].map((action) => (
                  <button
                    key={action.status}
                    type="button"
                    className="queue-btn-accent"
                    disabled={isPending}
                    onClick={() => handleStatusChange(row.id, action.status)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
