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
  Stat,
} from "../../components/ui/index.js";
import { admin as adminApi, scholarships as scholarshipsApi } from "../../lib/api/endpoints.js";
import { useApi, useMutation } from "../../lib/hooks.js";
import { deadlineStatus, formatNumber, formatShortDate } from "../../lib/format.js";
import useScholarshipQuery from "../../features/scholarships/useScholarshipQuery.js";

const STATUS_TONE = { closed: "neutral", urgent: "danger", soon: "gold", open: "success" };

function ConfirmDelete({ scholarship, onCancel, onConfirm, isPending }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink-900/50 p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-title"
    >
      <div className="surface w-full max-w-md p-6">
        <h2 id="delete-title" className="text-lg font-semibold text-ink-900">
          Delete this scholarship?
        </h2>
        <p className="mt-2 text-sm text-ink-600">
          <span className="font-medium text-ink-800">{scholarship.name}</span> will be
          permanently removed from the board. This cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="subtle" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={isPending}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminScholarshipsPage() {
  const query = useScholarshipQuery({ admin: true });
  const stats = useApi(({ signal }) => adminApi.statistics({ signal }), []);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [notice, setNotice] = useState(null);

  const remove = useMutation(scholarshipsApi.remove);
  const exportCsv = useMutation(scholarshipsApi.exportCsv);

  const handleDelete = async () => {
    const result = await remove.mutate(pendingDelete.id);
    if (result.ok) {
      setNotice({ tone: "success", text: `"${pendingDelete.name}" was deleted.` });
      setPendingDelete(null);
      query.refetch();
      stats.refetch();
    } else {
      setNotice({ tone: "error", text: result.error.message });
      setPendingDelete(null);
    }
  };

  return (
    <Page width="wide">
      <PageHeader
        title="Manage scholarships"
        description="The live board: everything here is visible and still accepting applications. Closed and hidden scholarships move to the archive."
        actions={
          <>
            <Button variant="outline" to="/admin/scholarships/archive">
              View archive
            </Button>
            <Button variant="outline" onClick={exportCsv.mutate} loading={exportCsv.isPending}>
              Export CSV
            </Button>
            <Button to="/admin/scholarships/new">Post a scholarship</Button>
          </>
        }
      />

      {notice && (
        <Alert tone={notice.tone} className="mb-6" onDismiss={() => setNotice(null)}>
          {notice.text}
        </Alert>
      )}

      {stats.data && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Stat label="Total" value={formatNumber(stats.data.total_scholarships)} />
          <Stat label="Active" value={formatNumber(stats.data.active_scholarships)} />
          <Stat
            label="Accepting applications"
            value={formatNumber(stats.data.open_scholarships)}
          />
          <Stat
            label="Added this month"
            value={formatNumber(stats.data.recent_scholarships)}
            hint="last 30 days"
          />
        </div>
      )}

      <div className="surface mb-6 p-4">
        <label htmlFor="admin-search" className="sr-only">
          Search scholarships
        </label>
        <input
          id="admin-search"
          type="search"
          value={query.values.q}
          onChange={(event) => query.setValue("q", event.target.value)}
          placeholder="Search by name, country or degree level..."
          className="h-11 w-full rounded-lg border border-ink-300 px-3.5 text-sm transition-colors hover:border-ink-400"
        />
      </div>

      {query.error ? (
        <ErrorState error={query.error} onRetry={query.refetch} />
      ) : query.results.length === 0 && !query.isLoading ? (
        <EmptyState
          title="Nothing here yet"
          description={
            query.values.q
              ? "No scholarships match that search."
              : "Post your first scholarship to get the board started."
          }
          action={<Button to="/admin/scholarships/new">Post a scholarship</Button>}
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
                {query.results.map((scholarship) => (
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
                      {scholarship.is_active ? (
                        <Badge tone={STATUS_TONE[deadlineStatus(scholarship.deadline)]}>
                          {deadlineStatus(scholarship.deadline) === "closed"
                            ? "Closed"
                            : "Live"}
                        </Badge>
                      ) : (
                        <Badge tone="neutral">Hidden</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          to={`/admin/scholarships/${scholarship.id}/edit`}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setPendingDelete(scholarship)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <ul className="divide-y divide-ink-200/70 md:hidden">
            {query.results.map((scholarship) => (
              <li key={scholarship.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-ink-900">{scholarship.name}</h3>
                  <Badge
                    tone={
                      scholarship.is_active
                        ? STATUS_TONE[deadlineStatus(scholarship.deadline)]
                        : "neutral"
                    }
                  >
                    {scholarship.is_active ? "Live" : "Hidden"}
                  </Badge>
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
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    to={`/admin/scholarships/${scholarship.id}/edit`}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setPendingDelete(scholarship)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Pagination
        className="mt-8"
        page={query.page}
        totalPages={query.totalPages}
        onChange={query.setPage}
      />

      {pendingDelete && (
        <ConfirmDelete
          scholarship={pendingDelete}
          isPending={remove.isPending}
          onCancel={() => setPendingDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </Page>
  );
}
