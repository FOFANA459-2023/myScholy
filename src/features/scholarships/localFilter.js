/**
 * Client-side scholarship filtering.
 *
 * Mirrors the backend's filter semantics (scholarships/filters.py) so that
 * once the slim catalogue has loaded, every keystroke and dropdown change is
 * answered from memory - zero network round trips, zero waiting. The server
 * remains the source of truth: this module only ever re-derives what the
 * server would have returned for the same params.
 */

export const PAGE_SIZE = 24;

// A parenthesised list, e.g. "Multiple countries (France, Malta, Germany)".
const LIST_IN_PARENS = /\(([^)]*,[^)]*)\)/;
const SEPARATORS = /[,/;]|\band\b|&/i;

/**
 * Break a stored field into the individual terms it represents.
 * Port of `split_terms` on the backend: "Graduate, Postgraduate" yields both
 * terms, and "Multiple countries (France, Malta)" yields the inner list.
 */
export function splitTerms(value) {
  let text = (value || "").trim();
  if (!text) return [];

  const inner = LIST_IN_PARENS.exec(text);
  if (inner) text = inner[1];

  const terms = [];
  const seen = new Set();
  for (const part of text.split(SEPARATORS)) {
    const term = (part || "").replace(/^[\s.]+|[\s.]+$/g, "");
    const key = term.toLowerCase();
    if (term && !seen.has(key)) {
      seen.add(key);
      terms.push(term);
    }
  }
  return terms;
}

function hasTerm(raw, wanted) {
  const target = wanted.toLowerCase();
  return splitTerms(raw).some((term) => term.toLowerCase() === target);
}

// ISO strings ("2026-08-04", "2026-08-04T10:00:00Z") compare correctly as text.
const byText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

const ORDERINGS = {
  newest: (a, b) => byText(b.created_at, a.created_at),
  oldest: (a, b) => byText(a.created_at, b.created_at),
  deadline: (a, b) => byText(a.deadline, b.deadline) || byText(b.created_at, a.created_at),
  name: (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
};

/** Today's date in UTC, matching the backend's timezone.now().date(). */
export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Which slice of the catalogue a row belongs to, mirroring the backend:
 * "live" is active with the deadline still ahead; "archived" is hidden by an
 * admin or past its deadline; "all" is everything.
 */
export function matchesView(row, view, today = todayISO()) {
  if (view === "all") return true;
  const archived = row.is_active === false || row.deadline < today;
  return view === "archived" ? archived : !archived;
}

/** Filter and sort the catalogue exactly the way the server would. */
export function filterScholarships(rows, values, today = todayISO(), view = "live") {
  let out = rows.filter((row) => matchesView(row, view, today));

  const q = (values.q || "").trim().toLowerCase();
  if (q) {
    out = out.filter((row) =>
      [row.name, row.host_country, row.degree_level].some((field) =>
        (field || "").toLowerCase().includes(q),
      ),
    );
  }

  if (values.country) out = out.filter((row) => hasTerm(row.host_country, values.country));
  if (values.degree) out = out.filter((row) => hasTerm(row.degree_level, values.degree));

  return out.sort(ORDERINGS[values.ordering] || ORDERINGS.newest);
}

/** Slice one page, in the same response shape the API's paginator returns. */
export function paginate(rows, page, pageSize = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * pageSize;
  return {
    count: rows.length,
    page: current,
    total_pages: totalPages,
    results: rows.slice(start, start + pageSize),
  };
}
