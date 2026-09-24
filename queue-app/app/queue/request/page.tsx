"use client";

import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { createUploadUrl, submitRequest } from "../actions";
import { extractThumbnail, formatDuration, parsePrintFileMetadata, type PrintFileMetadata } from "@/lib/printFile";

const MAX_FILE_SIZE = 300 * 1024 * 1024; // 300MB

export default function RequestPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printNumber, setPrintNumber] = useState<number | null>(null);
  const [detected, setDetected] = useState<PrintFileMetadata | null>(null);
  const [slicedFile, setSlicedFile] = useState<File | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);

  async function handleSlicedFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSlicedFile(file);
    setDetected(null);
    setError(null);

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".3mf")) {
      setError("Sliced print file must be the .3mf export from Bambu Studio.");
      setSlicedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File is too large (300MB max).");
      setSlicedFile(null);
      return;
    }

    setParsing(true);
    try {
      setDetected(await parsePrintFileMetadata(file));
    } finally {
      setParsing(false);
    }
  }

  function handleOriginalFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setError(null);

    if (!file) {
      setOriginalFile(null);
      return;
    }

    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".stl") && !lower.endsWith(".3mf")) {
      setError("Original design file must be a .stl or .3mf file.");
      setOriginalFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File is too large (300MB max).");
      setOriginalFile(null);
      return;
    }

    setOriginalFile(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    if (!slicedFile) {
      setError("Please attach the sliced .3mf print file.");
      return;
    }
    if (!originalFile) {
      setError("Please attach your original design file (.stl or .3mf).");
      return;
    }

    const teamNumberRaw = String(formData.get("teamNumber") ?? "").trim();
    const teamNumber = teamNumberRaw ? parseInt(teamNumberRaw, 10) : null;

    setSubmitting(true);

    try {
      const [slicedUpload, originalUpload] = await Promise.all([
        createUploadUrl(slicedFile.name),
        createUploadUrl(originalFile.name),
      ]);

      const [slicedUploadRes, originalUploadRes] = await Promise.all([
        fetch(slicedUpload.signedUrl, {
          method: "PUT",
          body: slicedFile,
          headers: { "Content-Type": "application/octet-stream" },
        }),
        fetch(originalUpload.signedUrl, {
          method: "PUT",
          body: originalFile,
          headers: { "Content-Type": "application/octet-stream" },
        }),
      ]);

      if (!slicedUploadRes.ok || !originalUploadRes.ok) {
        throw new Error("File upload failed. Please try again.");
      }

      let previewThumbnailPath: string | null = null;
      const thumbnail = await extractThumbnail(slicedFile);
      if (thumbnail) {
        const thumbUpload = await createUploadUrl(`preview.${thumbnail.ext}`);
        const thumbUploadRes = await fetch(thumbUpload.signedUrl, {
          method: "PUT",
          body: thumbnail.blob,
          headers: { "Content-Type": `image/${thumbnail.ext}` },
        });
        if (thumbUploadRes.ok) previewThumbnailPath = thumbUpload.path;
      }

      const sliceMetadata = detected
        ? {
            bedType: detected.bedType,
            filamentType: detected.filamentType,
            nozzleDiameterMm: detected.nozzleDiameterMm,
            infillDensityPercent: detected.infillDensityPercent,
            infillPattern: detected.infillPattern,
            supportType: detected.supportType,
            printerModel: detected.printerModel,
          }
        : null;

      const number = await submitRequest({
        teamName: String(formData.get("teamName") ?? ""),
        teamNumber: teamNumber != null && Number.isFinite(teamNumber) ? teamNumber : null,
        requesterName: String(formData.get("requesterName") ?? ""),
        computingId: String(formData.get("computingId") ?? ""),
        groupNumber: String(formData.get("groupNumber") ?? ""),
        email: String(formData.get("email") ?? ""),
        notes: String(formData.get("notes") ?? ""),
        filePath: slicedUpload.path,
        fileName: slicedFile.name,
        originalFilePath: originalUpload.path,
        originalFileName: originalFile.name,
        previewThumbnailPath,
        estimatedSeconds: detected?.estimatedSeconds ?? null,
        estimatedWeightG: detected?.estimatedWeightG ?? null,
        sliceMetadata,
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
                We&apos;ve got your files. You&apos;ll get an email confirmation,
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
                  <label htmlFor="teamNumber">Team number</label>
                  <input
                    className="queue-input"
                    id="teamNumber"
                    name="teamNumber"
                    type="number"
                    min={1}
                    required
                  />
                  <span className="queue-hint">
                    Used to route your print to the right farm — ask your organizer if you&apos;re unsure.
                  </span>
                </div>
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
                <label htmlFor="originalFile">Original design file</label>
                <div className="queue-file-drop">
                  <input
                    id="originalFile"
                    name="originalFile"
                    type="file"
                    accept=".stl,.3mf"
                    onChange={handleOriginalFileChange}
                    required
                  />
                  <p style={{ marginTop: 8 }}>
                    <strong>Unsliced .stl or .3mf</strong> — your original CAD export, 300MB max
                  </p>
                </div>
              </div>

              <div className="queue-field">
                <label htmlFor="slicedFile">Sliced print file</label>
                <div className="queue-file-drop">
                  <input
                    id="slicedFile"
                    name="slicedFile"
                    type="file"
                    accept=".3mf"
                    onChange={handleSlicedFileChange}
                    required
                  />
                  <p style={{ marginTop: 8 }}>
                    <strong>Sliced .3mf export</strong> from Bambu Studio — 300MB max
                  </p>
                </div>
              </div>

              {slicedFile && (
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
