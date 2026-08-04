import React from "react";

import { Button } from "../../components/ui/index.js";

const selectClass =
  "h-11 w-full rounded-lg border border-ink-300 bg-white px-3 text-sm text-ink-900 " +
  "transition-colors hover:border-ink-400";

/**
 * Filter bar. Values are owned by the page and mirrored into the URL, so a
 * filtered view can be shared or refreshed without losing state.
 */
const ScholarshipFilters = React.memo(function ScholarshipFilters({
  values,
  onChange,
  onReset,
  facets,
  resultCount,
  isBusy,
}) {
  const set = (key) => (event) => {
    const target = event.target;
    onChange(key, target.type === "checkbox" ? target.checked : target.value);
  };

  const hasFilters =
    values.q || values.country || values.degree || values.ordering !== "newest";

  return (
    <section className="surface mb-8 p-4 sm:p-5" aria-label="Filter scholarships">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 1 0 3.39 9.83l3.14 3.14a.75.75 0 1 0 1.06-1.06l-3.14-3.14A5.5 5.5 0 0 0 9 3.5ZM5 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
            clipRule="evenodd"
          />
        </svg>
        <label htmlFor="scholarship-search" className="sr-only">
          Search scholarships
        </label>
        <input
          id="scholarship-search"
          type="search"
          value={values.q}
          onChange={set("q")}
          placeholder="Search by name, country or degree level..."
          className="h-11 w-full rounded-lg border border-ink-300 bg-white pl-10 pr-4 text-sm transition-colors hover:border-ink-400"
        />
      </div>

      {/* Every scholarship on the board is still accepting applications -
          closed and hidden ones live in the admin archive - so there is no
          longer an "ongoing" toggle here. */}
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="filter-country" className="sr-only">
            Host country
          </label>
          <select
            id="filter-country"
            value={values.country}
            onChange={set("country")}
            className={selectClass}
          >
            <option value="">All countries</option>
            {facets.countries.map((item) => (
              <option key={item.value} value={item.value}>
                {item.value} ({item.count})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-degree" className="sr-only">
            Degree level
          </label>
          <select
            id="filter-degree"
            value={values.degree}
            onChange={set("degree")}
            className={selectClass}
          >
            <option value="">All degree levels</option>
            {facets.degree_levels.map((item) => (
              <option key={item.value} value={item.value}>
                {item.value} ({item.count})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-ordering" className="sr-only">
            Sort order
          </label>
          <select
            id="filter-ordering"
            value={values.ordering}
            onChange={set("ordering")}
            className={selectClass}
          >
            <option value="newest">Newest first</option>
            <option value="deadline">Deadline soonest</option>
            <option value="name">Name A-Z</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink-200/70 pt-3">
        <p className="text-sm text-ink-500" aria-live="polite">
          {isBusy
            ? "Searching..."
            : resultCount === null
              ? ""
              : `${resultCount} scholarship${resultCount === 1 ? "" : "s"} found`}
        </p>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            Clear filters
          </Button>
        )}
      </div>
    </section>
  );
});

export default ScholarshipFilters;
