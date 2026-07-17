"use client";

import { useEffect, useState } from "react";
import { getPublicBoard, type PublicBoardEntry } from "./actions";

const POLL_MS = 15_000;

export default function QueueBoard({
  initialEntries,
}: {
  initialEntries: PublicBoardEntry[];
}) {
  const [entries, setEntries] = useState(initialEntries);

  useEffect(() => {
    const interval = setInterval(async () => {
      const fresh = await getPublicBoard();
      setEntries(fresh);
    }, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  if (entries.length === 0) {
    return <p className="queue-empty">No active prints right now.</p>;
  }

  return (
    <div className="queue-board-grid">
      {entries.map((entry) => (
        <div
          key={entry.print_number}
          className={`queue-board-chip queue-board-chip--${entry.status}`}
        >
          #{entry.print_number}
        </div>
      ))}
    </div>
  );
}
