import React, { useMemo } from "react";
import { useSearchParams } from "react-router";

import { Page, PageHeader } from "../../components/layout/SiteLayout.jsx";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Pagination,
  Skeleton,
} from "../../components/ui/index.js";
import { admin as adminApi } from "../../lib/api/endpoints.js";
import { useApi, useDebouncedValue, useMutation } from "../../lib/hooks.js";
import { formatDateTime, formatShortDate } from "../../lib/format.js";

const ROLE_TONE = {
  "Super Admin": "gold",
  Admin: "brand",
  Student: "success",
  User: "neutral",
};

function RoleBadge({ role }) {
  return <Badge tone={ROLE_TONE[role] ?? "neutral"}>{role}</Badge>;
}

function fullName(row) {
  return `${row.first_name || ""} ${row.last_name || ""}`.trim();
}

/**
 * Read-only roster of every account - the on-screen version of the users CSV.
 *
 * Privacy over speed here: this data is personal, so unlike the scholarship
 * board there is no client-side index and nothing is written to session
 * storage or the browser HTTP cache. Each page is fetched on demand (server-
 * side cached for 30s in the versioned users namespace) and exists only in
 * component state.
 */
export default function AdminUserDirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const debouncedQuery = useDebouncedValue(q, 300);

  const requestParams = useMemo(
    () => ({ q: debouncedQuery || undefined, page: page > 1 ? page : undefined }),
    [debouncedQuery, page],
  );

  const roster = useApi(
    ({ signal }) => adminApi.userDirectory(requestParams, { signal }),
    [JSON.stringify(requestParams)],
    { keepPreviousData: true },
  );

  const exportCsv = useMutation(adminApi.exportUsersCsv);

  const setParam = (key, value) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(key, String(value));
        else next.delete(key);
        if (key !== "page") next.delete("page");
        return next;
      },
      { replace: true },
    );
  };

  const rows = roster.data?.results ?? [];
  const count = roster.data?.count ?? null;

  return (
    <Page width="wide">
      <PageHeader
        back={{ to: "/admin", label: "Dashboard" }}
        title="User directory"
        description="Every registered account, column for column the same as the users CSV export. Super admins only."
        actions={
          <Button variant="outline" onClick={exportCsv.mutate} loading={exportCsv.isPending}>
            Export users CSV
          </Button>
        }
      />

      <div className="surface mb-6 p-4">
        <label htmlFor="directory-search" className="sr-only">
          Search users
        </label>
        <input
          id="directory-search"
          type="search"
          value={q}
          onChange={(event) => setParam("q", event.target.value)}
          placeholder="Search by name, username or email..."
          className="h-11 w-full rounded-lg border border-ink-300 px-3.5 text-sm transition-colors hover:border-ink-400"
        />
        <p className="mt-3 text-sm text-ink-500" aria-live="polite">
          {count === null ? "Loading users..." : `${count} user${count === 1 ? "" : "s"} found`}
        </p>
      </div>

      {roster.error ? (
        <ErrorState error={roster.error} onRetry={roster.refetch} />
      ) : roster.isLoading ? (
        <Card className="p-5">
          <div className="space-y-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton
                key={index}
                className="h-12"
                style={{ "--skeleton-delay": `${index * 140}ms` }}
              />
            ))}
          </div>
        </Card>
      ) : rows.length === 0 ? (
        <EmptyState
          title={q ? "No users match that search" : "No users yet"}
          description={q ? "Try a different name, username or email." : undefined}
        />
      ) : (
        <Card className={roster.isRefreshing ? "opacity-60 transition-opacity" : undefined}>
          {/* Desktop table: one column per users-CSV column, same order.
              The wide set scrolls horizontally inside the card. */}
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-ink-200">
              <thead className="bg-ink-50">
                <tr>
                  {[
                    "ID",
                    "Username",
                    "First Name",
                    "Last Name",
                    "Email",
                    "User Type",
                    "Phone",
                    "Country of Citizenship",
                    "Country of Residence",
                    "Education Level",
                    "Date Joined",
                    "Last Login",
                    "Is Active",
                  ].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200/70">
                {rows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-ink-50/70">
                    <td className="whitespace-nowrap px-4 py-3 text-sm tabular-nums text-ink-500">
                      {row.id}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-ink-900">
                      {row.username}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-600">
                      {row.first_name || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-600">
                      {row.last_name || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-600">
                      {row.email || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <RoleBadge role={row.user_type} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-600">
                      {row.phone || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-600">
                      {row.country_of_citizenship || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-600">
                      {row.country_of_residence || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-600">
                      {row.education_level || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-600">
                      {formatShortDate(row.date_joined)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-600">
                      {row.last_login ? formatDateTime(row.last_login) : "Never"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge tone={row.is_active ? "success" : "neutral"}>
                        {row.is_active ? "Yes" : "No"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="divide-y divide-ink-200/70 md:hidden">
            {rows.map((row) => (
              <li key={row.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-900">
                      {fullName(row) || row.username}
                    </p>
                    <p className="truncate text-xs text-ink-500">
                      @{row.username} &middot; {row.email}
                    </p>
                  </div>
                  <RoleBadge role={row.user_type} />
                </div>
                <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                  {[
                    ["ID", row.id],
                    ["Phone", row.phone],
                    ["Citizenship", row.country_of_citizenship],
                    ["Residence", row.country_of_residence],
                    ["Education", row.education_level],
                    ["Joined", formatShortDate(row.date_joined)],
                    ["Last login", row.last_login ? formatDateTime(row.last_login) : "Never"],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <dt className="text-xs uppercase tracking-wide text-ink-400">{label}</dt>
                      <dd className="truncate text-ink-700">{value || "-"}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Pagination
        className="mt-8"
        page={roster.data?.page ?? page}
        totalPages={roster.data?.total_pages ?? 0}
        onChange={(next) => {
          setParam("page", next > 1 ? next : "");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </Page>
  );
}
