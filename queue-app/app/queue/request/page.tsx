"use client";

import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { createUploadUrl, submitRequest } from "../actions";
import { formatDuration, parsePrintFileMetadata } from "@/lib/printFile";

const MAX_FILE_SIZE = 300 * 1024 * 1024; // 300MB

interface Detected {
  estimatedSeconds: number | null;
  estimatedWeightG: number | null;
}

export default function RequestPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printNumber, setPrintNumber] = useState<number | null>(null);
  const [detected, setDetected] = useState<Detected | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setDetected(null);
    setError(null);

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".3mf")) {
      setError("File must be the sliced .3mf export from Bambu Studio.");
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File is too large (300MB max).");
      setSelectedFile(null);
      return;
    }

    setParsing(true);
    try {
      setDetected(await parsePrintFileMetadata(file));
    } finally {
      setParsing(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    if (!selectedFile) {
      setError("Please attach a sliced .3mf print file.");
      return;
    }

    setSubmitting(true);

    try {
      const { path, signedUrl } = await createUploadUrl(selectedFile.name);

      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        body: selectedFile,
        headers: { "Content-Type": "application/octet-stream" },
      });

      if (!uploadRes.ok) {
        throw new Error("File upload failed. Please try again.");
      }

      const number = await submitRequest({
        teamName: String(formData.get("teamName") ?? ""),
        requesterName: String(formData.get("requesterName") ?? ""),
        computingId: String(formData.get("computingId") ?? ""),
        groupNumber: String(formData.get("groupNumber") ?? ""),
        email: String(formData.get("email") ?? ""),
        notes: String(formData.get("notes") ?? ""),
        filePath: path,
        fileName: selectedFile.name,
        estimatedSeconds: detected?.estimatedSeconds ?? null,
        estimatedWeightG: detected?.estimatedWeightG ?? null,
      });

      setPrintNumber(number);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="queue-section">
      <div className="container queue-form-wrap">
        <Link className="queue-back-link" href="/queue">
          ← Back to Queue
        </Link>
        <p className="queue-eyebrow">Submit a Print</p>
        <h1 className="title-lg">Get your file in the queue</h1>

        <div className="queue-card">
          {printNumber !== null ? (
            <div className="queue-success">
              <h2>You&apos;re print #{printNumber}</h2>
              <p>
                We&apos;ve got your file. You&apos;ll get an email confirmation,
                and another when your print status changes.
              </p>
            </div>
          ) : (
            <form className="queue-form" onSubmit={handleSubmit}>
              <div className="queue-field-row">
                <div className="queue-field">
                  <label htmlFor="requesterName">Student full name</label>
                  <input
                    className="queue-input"
                    id="requesterName"
                    name="requesterName"
                    required
                  />
                </div>
                <div className="queue-field">
                  <label htmlFor="computingId">Computing ID</label>
                  <input
                    className="queue-input"
                    id="computingId"
                    name="computingId"
                    required
                  />
                </div>
              </div>

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
                  <label htmlFor="groupNumber">Group number</label>
                  <input
                    className="queue-input"
                    id="groupNumber"
                    name="groupNumber"
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

              <div className="queue-field">
                <label htmlFor="file">Print file</label>
                <div className="queue-file-drop">
                  <input id="file" name="file" type="file" accept=".3mf" onChange={handleFileChange} required />
                  <p style={{ marginTop: 8 }}>
                    <strong>Sliced .3mf export</strong> — 300MB max
                  </p>
                </div>
              </div>

              {selectedFile && (
                <div className="queue-detected-panel">
                  <p className="queue-detected-panel__title">Detected from file</p>
                  {parsing ? (
                    <p className="queue-hint">Reading file…</p>
                  ) : (
                    <div className="queue-detected-panel__grid">
                      <div>
                        <span>Estimated print time</span>
                        {detected?.estimatedSeconds != null
                          ? formatDuration(detected.estimatedSeconds)
                          : "Not detected — an admin will check manually"}
                      </div>
                      <div>
                        <span>Estimated filament weight</span>
                        {detected?.estimatedWeightG != null
                          ? `${detected.estimatedWeightG.toFixed(1)}g`
                          : "Not detected — an admin will check manually"}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="queue-field">
                <label htmlFor="notes">Notes (optional)</label>
                <textarea
                  className="queue-textarea"
                  id="notes"
                  name="notes"
                  placeholder="Infill, supports, orientation, anything the admins should know..."
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
