"use client";

import { useEffect, useState } from "react";
import type { ActivityLogEntry } from "@/lib/supabase";
import { addActivityNote, listActivity } from "../actions";

function formatEntryDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const EVENT_LABEL: Record<ActivityLogEntry["event_type"], string> = {
  submitted: "Request submitted",
  status_change: "Status update",
  note: "Note",
};

export default function ActivityLog({ printRequestId }: { printRequestId: string }) {
  const [entries, setEntries] = useState<ActivityLogEntry[] | null>(null);
  const [note, setNote] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listActivity(printRequestId)
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      });
    return () => {
      cancelled = true;
    };
  }, [printRequestId]);

  async function handleAddNote() {
    const trimmed = note.trim();
    if (!trimmed) return;
    setPosting(true);
    setError(null);
    try {
      await addActivityNote(printRequestId, trimmed);
      setEntries((prev) => [
        ...(prev ?? []),
        {
          id: `local-${Date.now()}`,
          print_request_id: printRequestId,
          event_type: "note",
          message: trimmed,
          admin_name: null,
          created_at: new Date().toISOString(),
        },
      ]);
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add note.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="queue-activity-log">
      <h3 className="queue-activity-log__title">Activity</h3>

      {entries === null ? (
        <p className="queue-hint">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="queue-hint">No activity yet.</p>
      ) : (
        <div className="queue-activity-log__list">
          {entries.map((entry) => (
            <div key={entry.id} className="queue-activity-log__entry">
              <div className="queue-activity-log__entry-header">
                <span className="queue-activity-log__entry-title">
                  {EVENT_LABEL[entry.event_type]}
                </span>
                <span className="queue-activity-log__entry-time">
                  {formatEntryDate(entry.created_at)}
                </span>
              </div>
              <p className="queue-activity-log__entry-message">{entry.message}</p>
              {entry.admin_name && (
                <p className="queue-activity-log__entry-admin">— {entry.admin_name}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="queue-activity-log__form">
        <input
          className="queue-input"
          placeholder="Add note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
        />
        <button
          type="button"
          className="queue-btn-accent"
          disabled={posting || !note.trim()}
          onClick={handleAddNote}
        >
          Send
        </button>
      </div>
      {error && <p className="queue-error">{error}</p>}
    </div>
  );
}
