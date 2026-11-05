import React from "react";
import { Link } from "react-router";

import { deadlineStatus, formatRelativeDays, formatShortDate } from "../../lib/format.js";
import { Badge, Card } from "../../components/ui/index.js";
import CountryFlag from "../../components/ui/CountryFlag.jsx";
import MatchScore from "../../components/ui/MatchScore.jsx";

const DEADLINE_TONE = {
  closed: { tone: "neutral", label: "Closed" },
  urgent: { tone: "danger", label: "Closing soon" },
  soon: { tone: "gold", label: "Closing this month" },
  open: { tone: "success", label: "Open" },
};

function Meta({ label, value, prefix }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="flex items-center gap-1.5 text-sm text-ink-700">
        {prefix}
        <span className="truncate">{value || "-"}</span>
      </dd>
    </div>
  );
}

/**
 * Memoized: the list re-renders on every keystroke in the search box, and there
 * is no reason to re-render 24 unchanged cards each time.
 */
const ScholarshipCard = React.memo(function ScholarshipCard({ scholarship, showMatch = false }) {
  const status = deadlineStatus(scholarship.deadline);
  const badge = DEADLINE_TONE[status];
  // Present only on the "For You" feed, which adds these to the same payload.
  const blockers = scholarship.match_blockers ?? [];
  const reasons = scholarship.match_reasons ?? [];

  return (
    <Card
      as="article"
      interactive
      className="group relative flex h-full flex-col overflow-hidden"
    >
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={badge.tone}>{badge.label}</Badge>
            {showMatch && (
              <MatchScore score={scholarship.match_score} blocked={blockers.length > 0} />
            )}
          </div>
          <span className="shrink-0 text-xs text-ink-400">
            {formatShortDate(scholarship.created_at)}
          </span>
        </div>

        <h3 className="text-lg font-semibold leading-snug text-ink-900">
          {/* Stretched link keeps the whole card clickable without nesting
              interactive elements inside each other. */}
          <Link
            to={`/scholarships/${scholarship.slug || scholarship.id}`}
            className="rounded after:absolute after:inset-0 after:content-[''] group-hover:text-brand-800"
          >
            {scholarship.name}
          </Link>
        </h3>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
          <Meta
            label="Country"
            value={scholarship.host_country}
            prefix={
              <CountryFlag
                country={scholarship.host_country}
                className="shrink-0"
              />
            }
          />
          <Meta label="Level" value={scholarship.degree_level} />
          <Meta label="Deadline" value={formatShortDate(scholarship.deadline)} />
          <Meta label="Posted by" value={scholarship.author} />
        </dl>

        {showMatch && (reasons.length > 0 || blockers.length > 0) && (
          <div className="mt-4 space-y-1.5 border-t border-ink-200/70 pt-4">
            {reasons.slice(0, 3).map((reason) => (
              <p key={reason} className="flex gap-2 text-xs text-ink-600">
                <span aria-hidden="true" className="text-emerald-600">
                  &#10003;
                </span>
                <span>{reason}</span>
              </p>
            ))}
            {/* Shown, never used to silently drop the listing: the facets are
                AI-extracted and can be wrong, and only the student can judge
                whether a stated rule really applies to them. */}
            {blockers.map((blocker) => (
              <p key={blocker} className="flex gap-2 text-xs text-gold-800">
                <span aria-hidden="true">&#33;</span>
                <span>{blocker}</span>
              </p>
            ))}
          </div>
        )}

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
