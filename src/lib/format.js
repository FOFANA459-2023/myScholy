/**
 * Formatting helpers.
 *
 * `Intl.DateTimeFormat` is comparatively expensive to construct, and the old
 * code built a fresh one inside every table cell via `toLocaleDateString`. The
 * formatters here are created once and reused.
 */

const longDate = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const shortDate = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const number = new Intl.NumberFormat("en-US");

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value) {
  const date = toDate(value);
  return date ? longDate.format(date) : "-";
}

export function formatShortDate(value) {
  const date = toDate(value);
  return date ? shortDate.format(date) : "-";
}

export function formatNumber(value) {
  return typeof value === "number" ? number.format(value) : "-";
}

/** "in 12 days" / "3 days ago", used for deadline urgency. */
export function formatRelativeDays(value) {
  const date = toDate(value);
  if (!date) return "";
  const days = daysUntil(date);
  if (days === 0) return "today";
  if (Math.abs(days) < 31) return relative.format(days, "day");
  return relative.format(Math.round(days / 30), "month");
}

export function daysUntil(value) {
  const date = toDate(value);
  if (!date) return Number.NaN;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(0, 0, 0, 0);
  return Math.round((end - start) / 86_400_000);
}

/**
 * Deadline status used for the badge on scholarship cards.
 * @returns {'closed'|'urgent'|'soon'|'open'}
 */
export function deadlineStatus(value) {
  const days = daysUntil(value);
  if (Number.isNaN(days)) return "open";
  if (days < 0) return "closed";
  if (days <= 7) return "urgent";
  if (days <= 30) return "soon";
  return "open";
}

/** Split textarea content into bullet lines, skipping blanks and list markers. */
export function toBulletPoints(text) {
  if (!text) return [];
  return String(text)
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-*•]\s*/, ""))
    .filter(Boolean);
}

/** Date string for a native <input type="date"> value. */
export function toDateInputValue(value) {
  const date = toDate(value);
  return date ? date.toISOString().slice(0, 10) : "";
}

export function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}
