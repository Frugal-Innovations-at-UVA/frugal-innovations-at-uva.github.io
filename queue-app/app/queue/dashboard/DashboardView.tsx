"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { PrintRequest, PrintStatus } from "@/lib/supabase";
import { formatDuration } from "@/lib/gcode";
import {
  listRequests,
  logout,
  updateAdminNotes,
  updateStatus,
} from "../actions";

type Row = PrintRequest & { downloadUrl: string | null };

const FINISHED_STATUSES: PrintStatus[] = ["completed", "rejected", "cancelled"];

type MainTab = "queue" | "printing" | "finished";
type FinishedSubTab = "all" | "completed" | "rejected" | "cancelled";

const MAIN_TABS: { key: MainTab; label: string }[] = [
  { key: "queue", label: "Queue" },
  { key: "printing", label: "Printing" },
  { key: "finished", label: "Finished" },
];

const FINISHED_SUBTABS: { key: FinishedSubTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "completed", label: "Completed" },
  { key: "rejected", label: "Rejected" },
  { key: "cancelled", label: "Canceled" },
];

interface StatusAction {
  label: string;
  status: PrintStatus;
  needsNotes: boolean;
}

const NEXT_ACTIONS: Record<PrintStatus, StatusAction[]> = {
  queue: [
    { label: "Start Printing", status: "printing", needsNotes: false },
    { label: "Reject", status: "rejected", needsNotes: true },
    { label: "Cancel", status: "cancelled", needsNotes: true },
  ],
  printing: [
    { label: "Mark Completed", status: "completed", needsNotes: true },
    { label: "Reject", status: "rejected", needsNotes: true },
    { label: "Cancel", status: "cancelled", needsNotes: true },
  ],
  completed: [{ label: "Reopen", status: "queue", needsNotes: false }],
  rejected: [{ label: "Reopen", status: "queue", needsNotes: false }],
  cancelled: [{ label: "Reopen", status: "queue", needsNotes: false }],
};

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Countdown({
  startedAt,
  estimatedSeconds,
}: {
  startedAt: string;
  estimatedSeconds: number;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const remainingMs = new Date(startedAt).getTime() + estimatedSeconds * 1000 - now;

  if (remainingMs <= 0) {
    return (
      <span className="queue-countdown queue-countdown--overdue">
        Overdue by {formatDuration(Math.round(-remainingMs / 1000))}
      </span>
    );
  }

  return (
    <span className="queue-countdown">
      ~{formatDuration(Math.round(remainingMs / 1000))} left
    </span>
  );
}

function AdminNotes({ id, initialValue }: { id: string; initialValue: string | null }) {
  const [value, setValue] = useState(initialValue ?? "");
  const [isPending, startTransition] = useTransition();

  function handleBlur() {
    if (value === (initialValue ?? "")) return;
    startTransition(async () => {
      await updateAdminNotes(id, value);
    });
  }

  return (
    <div className="queue-admin-notes">
      <label>Admin notes (not shared with student)</label>
      <textarea
        className="queue-textarea"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        placeholder="Internal notes about this print..."
      />
      {isPending && <span className="queue-hint">Saving…</span>}
    </div>
  );
}

export default function DashboardView({
  initialRequests,
}: {
  initialRequests: Row[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [mainTab, setMainTab] = useState<MainTab>("queue");
  const [finishedSubTab, setFinishedSubTab] = useState<FinishedSubTab>("all");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    id: string;
    status: PrintStatus;
  } | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [isPending, startTransition] = useTransition();

  const tabFiltered = useMemo(() => {
    if (mainTab === "queue") return requests.filter((r) => r.status === "queue");
    if (mainTab === "printing") return requests.filter((r) => r.status === "printing");

    const finished = requests.filter((r) => FINISHED_STATUSES.includes(r.status));
    if (finishedSubTab === "all") return finished;
    return finished.filter((r) => r.status === finishedSubTab);
  }, [requests, mainTab, finishedSubTab]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tabFiltered;
    return tabFiltered.filter((r) =>
      [r.requester_name, r.team_name, r.computing_id, r.file_name]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [tabFiltered, search]);

  const counts = useMemo(
    () => ({
      queue: requests.filter((r) => r.status === "queue").length,
      printing: requests.filter((r) => r.status === "printing").length,
      finished: requests.filter((r) => FINISHED_STATUSES.includes(r.status)).length,
    }),
    [requests]
  );

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const fresh = await listRequests();
      setRequests(fresh);
    } finally {
      setRefreshing(false);
    }
  }

  function handleActionClick(id: string, action: StatusAction) {
    if (action.needsNotes) {
      setPendingAction({ id, status: action.status });
      setNotesDraft("");
      return;
    }
    applyStatusChange(id, action.status);
  }

  function applyStatusChange(id: string, status: PrintStatus, finishedNotes?: string) {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        return {
          ...r,
          status,
          printing_started_at:
            status === "printing" ? new Date().toISOString() : r.printing_started_at,
          finished_notes:
            FINISHED_STATUSES.includes(status) && finishedNotes
              ? finishedNotes
              : r.finished_notes,
        };
      })
    );
    setPendingAction(null);
    startTransition(async () => {
      await updateStatus(id, status, finishedNotes);
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
        <div className="queue-dashboard-header__actions">
          <button
            className="queue-btn-light"
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <form className="queue-logout-form" action={logout}>
            <button className="queue-btn-light" type="submit">
              Log Out
            </button>
          </form>
        </div>
      </div>

      <input
        className="queue-input queue-search-input"
        type="search"
        placeholder="Search by name, team, computing ID, or file..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="queue-tabs">
        {MAIN_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`queue-tab${mainTab === t.key ? " is-active" : ""}`}
            onClick={() => setMainTab(t.key)}
          >
            {t.label} ({counts[t.key]})
          </button>
        ))}
      </div>

      {mainTab === "finished" && (
        <div className="queue-subtabs">
          {FINISHED_SUBTABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`queue-tab${finishedSubTab === t.key ? " is-active" : ""}`}
              onClick={() => setFinishedSubTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="queue-empty">No requests in this view.</p>
      ) : (
        <div className="queue-requests-list">
          {filtered.map((row) => (
            <article className="queue-request-card" key={row.id}>
              <div className="queue-request-card__top">
                <span className="queue-number-badge">#{row.print_number}</span>
                <span className="queue-request-card__team">{row.team_name}</span>
                <span className={`queue-status-badge queue-status-badge--${row.status}`}>
                  {row.status}
                </span>
                {row.status === "queue" && row.estimated_seconds != null && (
                  <span className="queue-countdown">
                    Est. {formatDuration(row.estimated_seconds)}
                  </span>
                )}
                {row.status === "printing" && row.printing_started_at && row.estimated_seconds != null && (
                  <Countdown
                    startedAt={row.printing_started_at}
                    estimatedSeconds={row.estimated_seconds}
                  />
                )}
              </div>

              <div className="queue-request-card__meta">
                <div>
                  <span>Requester</span>
                  {row.requester_name}
                </div>
                <div>
                  <span>Computing ID</span>
                  {row.computing_id}
                </div>
                <div>
                  <span>Group</span>
                  {row.group_number}
                </div>
                <div>
                  <span>Email</span>
                  {row.email}
                </div>
                <div>
                  <span>Submitted</span>
                  {formatDate(row.created_at)}
                </div>
                {row.estimated_weight_g != null && (
                  <div>
                    <span>Est. Weight</span>
                    {row.estimated_weight_g.toFixed(1)}g
                  </div>
                )}
              </div>

              {row.notes && (
                <p className="queue-request-card__notes">{row.notes}</p>
              )}

              {row.finished_notes && (
                <p className="queue-request-card__notes">
                  <strong>Finished note sent:</strong> {row.finished_notes}
                </p>
              )}

              <AdminNotes id={row.id} initialValue={row.admin_notes} />

              {pendingAction?.id === row.id ? (
                <div className="queue-finish-prompt">
                  <textarea
                    className="queue-textarea"
                    placeholder="Optional note to include in the email to the student..."
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                  />
                  <div className="queue-request-card__actions">
                    <button
                      type="button"
                      className="queue-btn-accent"
                      disabled={isPending}
                      onClick={() =>
                        applyStatusChange(row.id, pendingAction.status, notesDraft || undefined)
                      }
                    >
                      Confirm {pendingAction.status}
                    </button>
                    <button
                      type="button"
                      className="queue-btn-light"
                      onClick={() => setPendingAction(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
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
                  {NEXT_ACTIONS[row.status].map((action) => (
                    <button
                      key={action.status}
                      type="button"
                      className="queue-btn-accent"
                      disabled={isPending}
                      onClick={() => handleActionClick(row.id, action)}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
