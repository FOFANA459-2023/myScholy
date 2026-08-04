import React, { useMemo } from "react";

import cn from "../../lib/cn.js";

/** Page numbers with ellipses, e.g. 1 … 4 5 6 … 20 */
function pageWindow(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set([1, total, current, current - 1, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((page) => pages.add(page));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((page) => pages.add(page));

  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);

  const withGaps = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) withGaps.push("gap");
    withGaps.push(page);
  });
  return withGaps;
}

export default function Pagination({ page, totalPages, onChange, className }) {
  const pages = useMemo(() => pageWindow(page, totalPages), [page, totalPages]);

  if (!totalPages || totalPages <= 1) return null;

  const buttonClass =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm transition-colors";

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex flex-wrap items-center justify-center gap-1.5", className)}
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className={cn(
          buttonClass,
          "border border-ink-300 bg-white text-ink-700 hover:bg-ink-50 disabled:opacity-40 disabled:hover:bg-white",
        )}
      >
        Previous
      </button>

      {pages.map((entry, index) =>
        entry === "gap" ? (
          <span key={`gap-${index}`} className="px-1.5 text-ink-400" aria-hidden="true">
            &hellip;
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            onClick={() => onChange(entry)}
            aria-current={entry === page ? "page" : undefined}
            className={cn(
              buttonClass,
              entry === page
                ? "bg-brand-900 font-semibold text-white"
                : "border border-ink-300 bg-white text-ink-700 hover:bg-ink-50",
            )}
          >
            {entry}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className={cn(
          buttonClass,
          "border border-ink-300 bg-white text-ink-700 hover:bg-ink-50 disabled:opacity-40 disabled:hover:bg-white",
        )}
      >
        Next
      </button>
    </nav>
  );
}
