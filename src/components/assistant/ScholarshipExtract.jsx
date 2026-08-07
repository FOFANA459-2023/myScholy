import React, { useState } from "react";

import { assistant } from "../../lib/api/endpoints.js";
import { Alert, Button, TextAreaField } from "../ui/index.js";

/**
 * Paste-and-auto-fill helper for the admin posting form.
 *
 * The admin pastes a scholarship announcement (from a website, email or PDF),
 * the backend extracts the form fields with Gemini, and `onExtract` receives
 * only the fields the text actually contained - anything missing stays blank
 * for the admin to fill in by hand. Nothing is posted automatically; the
 * admin reviews the populated form and clicks the normal submit button.
 */
export default function ScholarshipExtract({ onExtract }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const extract = async () => {
    if (busy) return;
    setError(null);
    setDone(false);
    setBusy(true);
    try {
      const data = await assistant.extractScholarship(text);
      const fields = Object.fromEntries(
        Object.entries(data.fields || {}).filter(([, value]) => value),
      );
      onExtract(fields);
      setDone(true);
    } catch (requestError) {
      setError(
        requestError?.message || "Extraction failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4 sm:p-5">
      <p className="text-sm font-semibold text-brand-900">
        Auto-fill with AI
      </p>
      <p className="mb-3 mt-0.5 text-sm text-ink-500">
        Paste the scholarship announcement and the form below fills itself.
        Fields the text doesn&apos;t mention stay blank - review everything
        before posting.
      </p>

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

      <TextAreaField
        label="Announcement text"
        name="ai_source_text"
        rows={5}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Paste the scholarship description, deadline, benefits, eligibility…"
      />
      <Button
        type="button"
        className="mt-3"
        onClick={extract}
        loading={busy}
        disabled={text.trim().length < 40 || busy}
      >
        {busy ? "Extracting…" : "Extract details"}
      </Button>
    </div>
  );
}
