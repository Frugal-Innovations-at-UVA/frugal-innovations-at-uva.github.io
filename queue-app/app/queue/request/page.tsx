"use client";

import { useState, type FormEvent } from "react";
import { createUploadUrl, submitRequest } from "../actions";

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
const ACCEPTED_EXTENSIONS = [".stl", ".3mf", ".obj"];

export default function RequestPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput?.files?.[0];

    if (!file) {
      setError("Please attach a print file.");
      return;
    }

    const lowerName = file.name.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext))) {
      setError("File must be .stl, .3mf, or .obj.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File is too large (200MB max).");
      return;
    }

    setSubmitting(true);

    try {
      const { path, signedUrl } = await createUploadUrl(file.name);

      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });

      if (!uploadRes.ok) {
        throw new Error("File upload failed. Please try again.");
      }

      await submitRequest({
        teamName: String(formData.get("teamName") ?? ""),
        requesterName: String(formData.get("requesterName") ?? ""),
        email: String(formData.get("email") ?? ""),
        material: String(formData.get("material") ?? ""),
        color: String(formData.get("color") ?? ""),
        notes: String(formData.get("notes") ?? ""),
        filePath: path,
        fileName: file.name,
      });

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="queue-section">
      <div className="container queue-form-wrap">
        <p className="queue-eyebrow">Submit a Print</p>
        <h1 className="title-lg">Get your file in the queue</h1>

        <div className="queue-card">
          {done ? (
            <div className="queue-success">
              <h2>Request received</h2>
              <p>
                We&apos;ve got your file. You&apos;ll get an email confirmation,
                and another when your print status changes.
              </p>
            </div>
          ) : (
            <form className="queue-form" onSubmit={handleSubmit}>
              <div className="queue-field-row">
                <div className="queue-field">
                  <label htmlFor="teamName">Team name</label>
                  <input
                    className="queue-input"
                    id="teamName"
                    name="teamName"
                    required
                  />
                </div>
                <div className="queue-field">
                  <label htmlFor="requesterName">Your name</label>
                  <input
                    className="queue-input"
                    id="requesterName"
                    name="requesterName"
                    required
                  />
                </div>
              </div>

              <div className="queue-field">
                <label htmlFor="email">Email</label>
                <input
                  className="queue-input"
                  id="email"
                  name="email"
                  type="email"
                  required
                />
                <span className="queue-hint">
                  We&apos;ll send status updates here.
                </span>
              </div>

              <div className="queue-field-row">
                <div className="queue-field">
                  <label htmlFor="material">Material</label>
                  <select
                    className="queue-select"
                    id="material"
                    name="material"
                    required
                    defaultValue="PLA"
                  >
                    <option value="PLA">PLA</option>
                    <option value="PETG">PETG</option>
                    <option value="TPU">TPU</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="queue-field">
                  <label htmlFor="color">Color preference</label>
                  <input
                    className="queue-input"
                    id="color"
                    name="color"
                    placeholder="Any / White / Black..."
                  />
                </div>
              </div>

              <div className="queue-field">
                <label htmlFor="file">Print file</label>
                <div className="queue-file-drop">
                  <input id="file" name="file" type="file" accept=".stl,.3mf,.obj" required />
                  <p style={{ marginTop: 8 }}>
                    <strong>.stl, .3mf, or .obj</strong> — 200MB max
                  </p>
                </div>
              </div>

              <div className="queue-field">
                <label htmlFor="notes">Notes (optional)</label>
                <textarea
                  className="queue-textarea"
                  id="notes"
                  name="notes"
                  placeholder="Infill, supports, orientation, anything the TAs should know..."
                />
              </div>

              {error && <p className="queue-error">{error}</p>}

              <button
                className="btn primary"
                type="submit"
                disabled={submitting}
                style={{ alignSelf: "flex-start" }}
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
