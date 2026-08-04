import React from "react";
import { Link } from "react-router";

import { deadlineStatus, formatRelativeDays, formatShortDate } from "../../lib/format.js";
import { Badge, Card } from "../../components/ui/index.js";

const DEADLINE_TONE = {
  closed: { tone: "neutral", label: "Closed" },
  urgent: { tone: "danger", label: "Closing soon" },
  soon: { tone: "gold", label: "Closing this month" },
  open: { tone: "success", label: "Open" },
};

function Meta({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="truncate text-sm text-ink-700">{value || "-"}</dd>
    </div>
  );
}

/**
 * Memoized: the list re-renders on every keystroke in the search box, and there
 * is no reason to re-render 24 unchanged cards each time.
 */
const ScholarshipCard = React.memo(function ScholarshipCard({ scholarship }) {
  const status = deadlineStatus(scholarship.deadline);
  const badge = DEADLINE_TONE[status];

  return (
    <Card
      as="article"
      interactive
      className="group relative flex h-full flex-col overflow-hidden"
    >
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <Badge tone={badge.tone}>{badge.label}</Badge>
          <span className="shrink-0 text-xs text-ink-400">
            {formatShortDate(scholarship.created_at)}
          </span>
        </div>

        <h3 className="text-lg font-semibold leading-snug text-ink-900">
          {/* Stretched link keeps the whole card clickable without nesting
              interactive elements inside each other. */}
          <Link
            to={`/scholarships/${scholarship.id}`}
            className="rounded after:absolute after:inset-0 after:content-[''] group-hover:text-brand-800"
          >
            {scholarship.name}
          </Link>
        </h3>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
          <Meta label="Country" value={scholarship.host_country} />
          <Meta label="Level" value={scholarship.degree_level} />
          <Meta label="Deadline" value={formatShortDate(scholarship.deadline)} />
          <Meta label="Posted by" value={scholarship.author} />
        </dl>

        <div className="mt-auto flex items-center justify-between pt-5">
          <span className="text-sm font-medium text-brand-800">View details &rarr;</span>
          {status !== "closed" && (
            <span className="text-xs text-ink-500">
              closes {formatRelativeDays(scholarship.deadline)}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
});

export default ScholarshipCard;
