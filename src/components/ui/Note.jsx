import React from "react";

import cn from "../../lib/cn.js";

/**
 * A gold callout with a labelled chip: the site's way of saying "read this
 * before the rest of the page".
 *
 * The label carries the meaning ("Note", "Coming soon"), so one appearance
 * covers both and a reader learns the shape once. `ComingSoon` builds on it.
 */
export default function Note({ children, label = "Note", className }) {
  return (
    <aside
      className={cn(
        "surface border-l-4 border-gold-500 bg-gold-50/60 p-5 sm:p-6",
        className,
      )}
      aria-label={label}
    >
      <span className="inline-flex rounded-full bg-gold-200/80 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-gold-900">
        {label}
      </span>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-700">
        {children}
      </div>
    </aside>
  );
}
