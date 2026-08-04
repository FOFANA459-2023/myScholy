import { describe, expect, it } from "vitest";

import { filterScholarships, matchesView, paginate, splitTerms } from "./localFilter.js";

const row = (overrides) => ({
  id: 1,
  name: "Chevening Scholarship",
  host_country: "United Kingdom",
  degree_level: "Postgraduate",
  deadline: "2099-01-01",
  created_at: "2026-01-01T00:00:00Z",
  is_active: true,
  ...overrides,
});

const TODAY = "2026-08-04";

describe("splitTerms", () => {
  it("splits comma-separated values", () => {
    expect(splitTerms("Graduate, Postgraduate")).toEqual(["Graduate", "Postgraduate"]);
  });

  it("reads a parenthesised list", () => {
    expect(splitTerms("Multiple countries (France, Malta, Germany)")).toEqual([
      "France",
      "Malta",
      "Germany",
    ]);
  });

  it("splits on 'and', '&', '/' and ';'", () => {
    expect(splitTerms("Masters and PhD")).toEqual(["Masters", "PhD"]);
    expect(splitTerms("Masters & PhD")).toEqual(["Masters", "PhD"]);
    expect(splitTerms("Masters/PhD; Doctorate")).toEqual(["Masters", "PhD", "Doctorate"]);
  });

  it("deduplicates case-insensitively and handles empty input", () => {
    expect(splitTerms("PhD, phd")).toEqual(["PhD"]);
    expect(splitTerms("")).toEqual([]);
    expect(splitTerms(null)).toEqual([]);
  });
});

describe("filterScholarships", () => {
  const rows = [
    row({ id: 1, name: "Chevening", host_country: "United Kingdom", created_at: "2026-03-01T00:00:00Z" }),
    row({
      id: 2,
      name: "DAAD",
      host_country: "Germany",
      degree_level: "Graduate, Postgraduate",
      created_at: "2026-02-01T00:00:00Z",
    }),
    row({
      id: 3,
      name: "Erasmus",
      host_country: "Multiple countries (France, Malta, Germany)",
      degree_level: "Undergraduate",
      deadline: "2020-01-01",
      created_at: "2026-01-01T00:00:00Z",
    }),
  ];
  const values = (overrides) => ({
    q: "",
    country: "",
    degree: "",
    ordering: "newest",
    ...overrides,
  });
  const all = (vals) => filterScholarships(rows, vals, TODAY, "all");

  it("searches name, country and degree level, case-insensitively", () => {
    expect(all(values({ q: "chev" })).map((r) => r.id)).toEqual([1]);
    expect(all(values({ q: "germ" })).map((r) => r.id)).toEqual([2, 3]);
    expect(all(values({ q: "undergrad" })).map((r) => r.id)).toEqual([3]);
  });

  it("matches country by parsed term, including parenthesised lists", () => {
    expect(all(values({ country: "Germany" })).map((r) => r.id)).toEqual([2, 3]);
    expect(all(values({ country: "Malta" })).map((r) => r.id)).toEqual([3]);
  });

  it("matches degree terms exactly, not by substring", () => {
    const graduate = all(values({ degree: "Graduate" })).map((r) => r.id);
    expect(graduate).toEqual([2]); // "Postgraduate"/"Undergraduate" must not match
  });

  it("sorts by each ordering", () => {
    expect(all(values({ ordering: "oldest" })).map((r) => r.id)).toEqual([3, 2, 1]);
    expect(all(values({ ordering: "name" })).map((r) => r.id)).toEqual([1, 2, 3]);
    expect(all(values({ ordering: "deadline" })).map((r) => r.id)).toEqual([3, 1, 2]);
  });

  it("splits the catalogue into live and archived views", () => {
    // Row 3 is expired (deadline 2020); rows 1-2 are live.
    expect(filterScholarships(rows, values(), TODAY, "live").map((r) => r.id)).toEqual([1, 2]);
    expect(filterScholarships(rows, values(), TODAY, "archived").map((r) => r.id)).toEqual([3]);
  });
});

describe("matchesView", () => {
  it("treats hidden rows as archived even when the deadline is ahead", () => {
    const hidden = row({ is_active: false });
    expect(matchesView(hidden, "live", TODAY)).toBe(false);
    expect(matchesView(hidden, "archived", TODAY)).toBe(true);
    expect(matchesView(hidden, "all", TODAY)).toBe(true);
  });

  it("treats expired rows as archived even when still active", () => {
    const expired = row({ deadline: "2026-08-03" });
    expect(matchesView(expired, "live", TODAY)).toBe(false);
    expect(matchesView(expired, "archived", TODAY)).toBe(true);
  });

  it("keeps active rows with today's deadline live", () => {
    const closesToday = row({ deadline: TODAY });
    expect(matchesView(closesToday, "live", TODAY)).toBe(true);
  });
});

describe("paginate", () => {
  const rows = Array.from({ length: 30 }, (_, i) => ({ id: i + 1 }));

  it("slices pages of 24 and reports totals", () => {
    const first = paginate(rows, 1);
    expect(first.count).toBe(30);
    expect(first.total_pages).toBe(2);
    expect(first.results).toHaveLength(24);
    expect(paginate(rows, 2).results.map((r) => r.id)[0]).toBe(25);
  });

  it("clamps out-of-range pages", () => {
    expect(paginate(rows, 99).page).toBe(2);
    expect(paginate(rows, 0).page).toBe(1);
  });

  it("handles an empty result set", () => {
    const empty = paginate([], 1);
    expect(empty.count).toBe(0);
    expect(empty.total_pages).toBe(1);
    expect(empty.results).toEqual([]);
  });
});
