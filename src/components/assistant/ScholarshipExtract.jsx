import React, { useRef, useState } from "react";

import cn from "../../lib/cn.js";
import { assistant } from "../../lib/api/endpoints.js";
import { Alert, Button, TextAreaField, TextField } from "../ui/index.js";

const MODES = [
  { key: "text", label: "Paste text" },
  { key: "url", label: "Web link" },
  { key: "pdf", label: "PDF file" },
];

/**
 * Paste-and-auto-fill helper for the admin posting form.
 *
 * The admin provides a scholarship announcement as pasted text, a page link
 * (fetched server-side) or a PDF upload (read natively by the model, scanned
 * documents included). The backend extracts the form fields and `onExtract`
 * receives only the ones the source actually contained - anything missing
 * stays blank for the admin to fill in by hand. Nothing is posted
 * automatically; the admin reviews the populated form and submits as usual.
 */
export default function ScholarshipExtract({ onExtract }) {
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const fileRef = useRef(null);

  const ready =
    mode === "text"
      ? text.trim().length >= 40
      : mode === "url"
        ? /^https?:\/\/\S+\.\S+/i.test(url.trim())
        : Boolean(file);

  const extract = async () => {
    if (busy || !ready) return;
    setError(null);
    setDone(false);
    setBusy(true);
    try {
      const data =
        mode === "text"
          ? await assistant.extractScholarship(text)
          : mode === "url"
            ? await assistant.extractScholarshipUrl(url.trim())
            : await assistant.extractScholarshipPdf(file);
      const fields = Object.fromEntries(
        Object.entries(data.fields || {}).filter(([, value]) => value),
      );
      onExtract(fields);
      setDone(true);
    } catch (requestError) {
      setError(requestError?.message || "Extraction failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (next) => {
    setMode(next);
    setError(null);
    setDone(false);
  };

  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4 sm:p-5">
      <p className="text-sm font-semibold text-brand-900">Auto-fill with AI</p>
      <p className="mb-3 mt-0.5 text-sm text-ink-500">
        Paste the announcement, drop in the page link, or upload the PDF - the
        form below fills itself. Fields the source doesn&apos;t mention stay
        blank; review everything before posting.
      </p>

      <div
        role="tablist"
        aria-label="Announcement source"
        className="mb-4 inline-flex rounded-lg border border-ink-200 bg-white p-1"
      >
        {MODES.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={mode === key}
            onClick={() => switchMode(key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              mode === key
                ? "bg-brand-900 text-white"
                : "text-ink-500 hover:text-ink-900",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <Alert tone="error" className="mb-3">
          {error}
        </Alert>
      )}
      {done && !error && (
        <Alert tone="success" className="mb-3">
          Details extracted - review the form below, complete anything blank,
          then post.
        </Alert>
      )}

      {mode === "text" && (
        <TextAreaField
          label="Announcement text"
          name="ai_source_text"
          rows={5}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Paste the scholarship description, deadline, benefits, eligibility…"
        />
      )}

      {mode === "url" && (
        <TextField
          label="Scholarship page link"
          name="ai_source_url"
          type="url"
          inputMode="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.org/scholarship-announcement"
          hint="The page is fetched on the server; links to PDFs work too."
        />
      )}

      {mode === "pdf" && (
        <div>
          <label
            htmlFor="ai_source_pdf"
            className="mb-1.5 block text-sm font-medium text-ink-700"
          >
            Announcement PDF
          </label>
          <input
            ref={fileRef}
            id="ai_source_pdf"
            type="file"
            accept=".pdf,application/pdf"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="block w-full cursor-pointer rounded-lg border border-ink-200 bg-white text-sm text-ink-700 file:mr-3 file:cursor-pointer file:rounded-l-lg file:border-0 file:bg-brand-900 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-white"
          />
          <p className="mt-1.5 text-xs text-ink-400">
            Up to 10 MB. Scanned documents work too.
          </p>
        </div>
      )}

      <Button
        type="button"
        className="mt-3"
        onClick={extract}
        loading={busy}
        disabled={!ready || busy}
      >
        {busy ? "Extracting…" : "Extract details"}
      </Button>
    </div>
  );
}
