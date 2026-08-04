import React, { useState } from "react";
import { Link } from "react-router";

import { Page, PageHeader } from "../../components/layout/SiteLayout.jsx";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Pagination,
} from "../../components/ui/index.js";
import { scholarships as scholarshipsApi } from "../../lib/api/endpoints.js";
import { useMutation } from "../../lib/hooks.js";
import { daysUntil, formatShortDate } from "../../lib/format.js";
import useScholarshipQuery from "../../features/scholarships/useScholarshipQuery.js";

const CANNOT_REPOST =
  "Cannot repost: the deadline has passed. Edit it and set a new deadline first.";

/** Why the row is in the archive. A scholarship can be both hidden and past
 *  its deadline; expired is the more useful label because it also decides
 *  whether Repost is allowed. */
function archiveStatus(scholarship) {
  const expired = daysUntil(scholarship.deadline) < 0;
  if (expired) return { label: "Expired", tone: "danger", expired: true };
  return { label: "Hidden", tone: "neutral", expired: false };
}

function RepostActions({ scholarship, onRepost, isPending }) {
  const { expired } = archiveStatus(scholarship);
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" to={`/admin/scholarships/${scholarship.id}/edit`}>
          Edit
        </Button>
        <Button
          size="sm"
          disabled={expired}
          loading={isPending}
          title={expired ? CANNOT_REPOST : "Return this scholarship to the live board"}
          onClick={() => onRepost(scholarship)}
        >
          Repost
        </Button>
      </div>
      {expired && (
        <p className="max-w-52 text-right text-xs text-ink-400">
          Deadline has passed &mdash; edit it to set a new deadline before reposting.
        </p>
      )}
    </div>
  );
}

/**
 * The scholarship archive: everything hidden by an admin or past its
 * deadline. Runs on the same shared catalogue index as the live board, so
 * search is instant and opening this page after the board costs no request.
 */
export default function AdminArchivePage() {
  const query = useScholarshipQuery({ admin: true, view: "archived" });
  const [notice, setNotice] = useState(null);

  const repost = useMutation(scholarshipsApi.repost);

  const handleRepost = async (scholarship) => {
    const result = await repost.mutate(scholarship.id);
    if (result.ok) {
      setNotice({
        tone: "success",
        text: `"${scholarship.name}" is live on the board again.`,
      });
      query.refetch();
    } else {
      setNotice({ tone: "error", text: result.error.message });
    }
  };

  return (
    <Page width="wide">
      <PageHeader
        title="Scholarship archive"
        description="Closed and hidden opportunities. Repost one to put it back on the board, or edit it to extend a passed deadline."
        actions={<Button variant="outline" to="/admin/scholarships">Back to live board</Button>}
      />

      {notice && (
        <Alert tone={notice.tone} className="mb-6" onDismiss={() => setNotice(null)}>
          {notice.text}
        </Alert>
      )}

      <div className="surface mb-6 p-4">
        <label htmlFor="archive-search" className="sr-only">
          Search archived scholarships
        </label>
        <input
          id="archive-search"
          type="search"
          value={query.values.q}
          onChange={(event) => query.setValue("q", event.target.value)}
          placeholder="Search archived scholarships..."
          className="h-11 w-full rounded-lg border border-ink-300 px-3.5 text-sm transition-colors hover:border-ink-400"
        />
      </div>

      {query.error ? (
        <ErrorState error={query.error} onRetry={query.refetch} />
      ) : query.results.length === 0 && !query.isLoading ? (
        <EmptyState
          title={query.values.q ? "No archived scholarships match that search" : "The archive is empty"}
          description={
            query.values.q
              ? "Try a different name, country or degree level."
              : "When a scholarship closes or is taken off the board, it will appear here."
          }
          action={<Button to="/admin/scholarships">Back to live board</Button>}
        />
      ) : (
        <Card className={query.isRefreshing ? "opacity-60 transition-opacity" : undefined}>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-ink-200">
              <thead className="bg-ink-50">
                <tr>
                  {["Name", "Country", "Level", "Deadline", "Status", ""].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200/70">
                {query.results.map((scholarship) => {
                  const status = archiveStatus(scholarship);
                  return (
                    <tr key={scholarship.id} className="transition-colors hover:bg-ink-50/70">
                      <td className="px-5 py-3.5 text-sm font-medium text-ink-900">
                        <Link
                          to={`/scholarships/${scholarship.id}`}
                          className="rounded hover:text-brand-700"
                        >
                          {scholarship.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-ink-600">
                        {scholarship.host_country}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-ink-600">
                        {scholarship.degree_level}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-ink-600">
                        {formatShortDate(scholarship.deadline)}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <RepostActions
                          scholarship={scholarship}
                          onRepost={handleRepost}
                          isPending={repost.isPending}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <ul className="divide-y divide-ink-200/70 md:hidden">
            {query.results.map((scholarship) => {
              const status = archiveStatus(scholarship);
              return (
                <li key={scholarship.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-ink-900">{scholarship.name}</h3>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>
                  <dl className="mt-2 space-y-0.5 text-sm text-ink-600">
                    <div className="flex gap-1.5">
                      <dt className="text-ink-400">Country:</dt>
                      <dd>{scholarship.host_country}</dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt className="text-ink-400">Level:</dt>
                      <dd>{scholarship.degree_level}</dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt className="text-ink-400">Deadline:</dt>
                      <dd>{formatShortDate(scholarship.deadline)}</dd>
                    </div>
                  </dl>
                  <div className="mt-3 flex flex-col gap-1">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        to={`/admin/scholarships/${scholarship.id}/edit`}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        disabled={status.expired}
                        loading={repost.isPending}
                        title={status.expired ? CANNOT_REPOST : undefined}
                        onClick={() => handleRepost(scholarship)}
                      >
                        Repost
                      </Button>
                    </div>
                    {status.expired && (
                      <p className="text-xs text-ink-400">
                        Deadline has passed &mdash; edit it to set a new deadline before
                        reposting.
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Pagination
        className="mt-8"
        page={query.page}
        totalPages={query.totalPages}
        onChange={query.setPage}
      />
    </Page>
  );
}
