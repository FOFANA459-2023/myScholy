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

// ---------------------------------------------------------------------------
// Canonical filter categories - ports of classify_degree / classify_region in
// scholarships/filters.py. The dropdowns offer these fixed options; free-text
// row values are classified into them. Keep both sides in sync.
// ---------------------------------------------------------------------------

const DEGREE_LEVELS = new Set(["undergraduate", "graduate", "postgraduate", "non-degree"]);

const ALL_LEVEL_TERMS = new Set(["any", "any level", "all", "all levels", "all degree levels"]);

function classifyDegree(term) {
  const text = term.toLowerCase();
  if (ALL_LEVEL_TERMS.has(text)) {
    return new Set(["undergraduate", "graduate", "postgraduate"]);
  }
  const categories = new Set();
  if (text.includes("undergraduate") || text.includes("undergrad") || text.includes("bachelor")) {
    categories.add("undergraduate");
  }
  if (
    text.includes("postgraduate") ||
    text.includes("post-graduate") ||
    text.includes("postdoc") ||
    text.includes("post-doc") ||
    text.includes("phd") ||
    text.includes("ph.d") ||
    text.includes("doctor") ||
    text.includes("dphil")
  ) {
    categories.add("postgraduate");
  }
  if (
    text.includes("master") ||
    text.includes("msc") ||
    text.includes("m.sc") ||
    text.includes("mba") ||
    text.includes("mphil") ||
    (text.includes("graduate") &&
      !text.includes("undergraduate") &&
      !text.includes("postgraduate") &&
      !text.includes("post-graduate"))
  ) {
    categories.add("graduate");
  }
  return categories.size ? categories : new Set(["non-degree"]);
}

const REGIONS = new Set(["africa", "europe", "australia", "asia", "united states", "canada"]);

const REGION_COUNTRIES = {
  africa: [
    "algeria", "angola", "benin", "botswana", "burkina faso", "burundi",
    "cabo verde", "cape verde", "cameroon", "central african republic",
    "chad", "comoros", "congo", "democratic republic of the congo",
    "dr congo", "djibouti", "egypt", "equatorial guinea", "eritrea",
    "eswatini", "swaziland", "ethiopia", "gabon", "gambia", "the gambia",
    "ghana", "guinea", "guinea-bissau", "ivory coast", "cote d'ivoire",
    "côte d'ivoire", "kenya", "lesotho", "liberia", "libya", "madagascar",
    "malawi", "mali", "mauritania", "mauritius", "morocco", "mozambique",
    "namibia", "niger", "nigeria", "rwanda", "sao tome and principe",
    "senegal", "seychelles", "sierra leone", "somalia", "south africa",
    "south sudan", "sudan", "tanzania", "togo", "tunisia", "uganda",
    "zambia", "zimbabwe",
  ],
  europe: [
    "albania", "andorra", "austria", "belarus", "belgium",
    "bosnia and herzegovina", "bulgaria", "croatia", "cyprus",
    "czech republic", "czechia", "denmark", "estonia", "finland", "france",
    "germany", "greece", "hungary", "iceland", "ireland", "italy", "kosovo",
    "latvia", "liechtenstein", "lithuania", "luxembourg", "malta", "moldova",
    "monaco", "montenegro", "netherlands", "the netherlands",
    "north macedonia", "norway", "poland", "portugal", "romania", "russia",
    "san marino", "serbia", "slovakia", "slovenia", "spain", "sweden",
    "switzerland", "ukraine", "united kingdom", "uk", "great britain",
    "england", "scotland", "wales", "northern ireland",
  ],
  australia: [
    "australia", "new zealand", "fiji", "papua new guinea", "samoa",
    "solomon islands", "tonga", "vanuatu",
  ],
  asia: [
    "afghanistan", "armenia", "azerbaijan", "bahrain", "bangladesh",
    "bhutan", "brunei", "cambodia", "china", "georgia", "hong kong",
    "india", "indonesia", "iran", "iraq", "israel", "japan", "jordan",
    "kazakhstan", "kuwait", "kyrgyzstan", "laos", "lebanon", "macau",
    "malaysia", "maldives", "mongolia", "myanmar", "nepal", "north korea",
    "oman", "pakistan", "palestine", "philippines", "qatar", "saudi arabia",
    "singapore", "south korea", "korea", "sri lanka", "syria", "taiwan",
    "tajikistan", "thailand", "timor-leste", "turkey", "türkiye", "turkiye",
    "turkmenistan", "united arab emirates", "uae", "uzbekistan", "vietnam",
    "yemen",
  ],
  "united states": [
    "united states", "united states of america", "usa", "us", "u.s.",
    "u.s.a.", "america",
  ],
  canada: ["canada"],
};

const COUNTRY_TO_REGION = new Map();
for (const [region, countries] of Object.entries(REGION_COUNTRIES)) {
  for (const country of countries) COUNTRY_TO_REGION.set(country, region);
}

const GLOBAL_TERMS = new Set([
  "worldwide", "global", "international", "any", "any country", "various",
  "various countries", "all countries", "multiple countries", "anywhere",
  "online", "remote",
]);

const REGION_KEYWORDS = [
  ["africa", "africa"],
  ["europe", "europe"],
  ["asia", "asia"],
  ["australia", "australia"],
  ["australia", "oceania"],
  ["united states", "united states"],
  ["canada", "canada"],
];

function classifyRegion(term) {
  const text = term.toLowerCase().replace(/^[\s.]+|[\s.]+$/g, "");
  if (GLOBAL_TERMS.has(text)) return new Set(REGIONS);

  const region = COUNTRY_TO_REGION.get(text);
  if (region) return new Set([region]);

  const found = new Set();
  for (const [name, keyword] of REGION_KEYWORDS) {
    if (text.includes(keyword)) found.add(name);
  }
  return found;
}

/**
 * One dropdown value against one stored field. Canonical categories resolve
 * through the classifier; anything else (old bookmarked URLs) falls back to
 * exact term matching, exactly like `_rows_matching_filter` on the backend.
 */
function matchesFilter(raw, wanted, canonical, classifier) {
  const target = wanted.toLowerCase();
  if (canonical.has(target)) {
    return splitTerms(raw).some((term) => classifier(term).has(target));
  }
  return hasTerm(raw, wanted);
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

  if (values.country) {
    out = out.filter((row) =>
      matchesFilter(row.host_country, values.country, REGIONS, classifyRegion),
    );
  }
  if (values.degree) {
    out = out.filter((row) =>
      matchesFilter(row.degree_level, values.degree, DEGREE_LEVELS, classifyDegree),
    );
  }

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
