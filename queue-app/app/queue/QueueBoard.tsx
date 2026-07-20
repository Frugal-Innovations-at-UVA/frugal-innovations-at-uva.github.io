"use client";

import { useEffect, useState } from "react";
import { getPublicBoard, type PublicBoardEntry } from "./actions";
import { progressPercent } from "@/lib/printFile";

const POLL_MS = 15_000;
const TICK_MS = 15_000;

export default function QueueBoard({
  initialEntries,
}: {
  initialEntries: PublicBoardEntry[];
}) {
  const [entries, setEntries] = useState(initialEntries);
  // Starts null so the server-rendered HTML and the client's first render
  // match exactly (avoids a hydration mismatch from Date.now() differing
  // between server render time and client hydration time). The real value
  // is filled in immediately after mount, client-only.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const initialTick = setTimeout(() => setNow(Date.now()), 0);
    const pollInterval = setInterval(async () => {
      const fresh = await getPublicBoard();
      setEntries(fresh);
    }, POLL_MS);
    const tickInterval = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => {
      clearTimeout(initialTick);
      clearInterval(pollInterval);
      clearInterval(tickInterval);
    };
  }, []);

  if (entries.length === 0) {
    return <p className="queue-empty">No active prints right now.</p>;
  }

  return (
    <div className="queue-board-grid">
      {entries.map((entry) => {
        const isPrinting =
          entry.status === "printing" &&
          entry.printing_started_at != null &&
          entry.estimated_seconds != null &&
          now != null;
        const percent = isPrinting
          ? progressPercent(entry.printing_started_at!, entry.estimated_seconds!, now)
          : 0;

        return (
          <div
            key={entry.print_number}
            className={`queue-board-chip queue-board-chip--${entry.status}`}
          >
            <span className="queue-board-chip__number">#{entry.print_number}</span>
            {isPrinting && (
              <div className="queue-board-chip__bar">
                <div
                  className="queue-board-chip__bar-fill"
                  style={{ width: `${percent}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
