"use client";

import { useState } from "react";
import { setAdminName } from "../actions";

interface NameModalProps {
  onSaved: (name: string) => void;
}

// One-time "what's your name?" prompt, shown whenever the current session
// doesn't have a name attached yet. Not a per-admin account system — the
// dashboard still uses one shared DASHBOARD_PASSWORD — this just labels
// whichever admin is at the keyboard for the Activity timeline.
export default function NameModal({ onSaved }: NameModalProps) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await setAdminName(trimmed);
      onSaved(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your name.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="queue-modal-overlay" role="dialog" aria-modal="true">
      <div className="queue-modal">
        <h2 className="queue-modal__title">What&apos;s your full name?</h2>
        <p className="queue-modal__subtitle">
          Your name will be attached to status changes and notes so the team knows who made
          each update.
        </p>
        <input
          className="queue-input"
          value={name}
          autoFocus
          placeholder="First and last name"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        {error && <p className="queue-error">{error}</p>}
        <div className="queue-modal__actions">
          <button
            type="button"
            className="queue-btn-accent"
            disabled={saving}
            onClick={handleSubmit}
          >
            {saving ? "Saving…" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
