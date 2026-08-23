import React, { useState } from "react";
import { Link, useLocation } from "react-router";

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
import AuthorAvatar from "../../features/insights/AuthorAvatar.jsx";
import { TOPICS, topicOf } from "../../features/insights/topics.js";
import cn from "../../lib/cn.js";
import { articles as articlesApi } from "../../lib/api/endpoints.js";
import { useApi, useDebouncedValue, useMutation } from "../../lib/hooks.js";
import { formatShortDate } from "../../lib/format.js";

const statIcon = (path) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className="h-5 w-5"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

function ConfirmDelete({ article, onCancel, onConfirm, isPending }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink-900/50 p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-article-title"
    >
      <div className="surface w-full max-w-md p-6">
        <h2 id="delete-article-title" className="text-lg font-semibold text-ink-900">
          Delete this article?
        </h2>
        <p className="mt-2 text-sm text-ink-600">
          <span className="font-medium text-ink-800">{article.title}</span> will be
          permanently removed from Insights. This cannot be undone.
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

/**
 * Editorial desk: every piece, drafts included.
 *
 * Open to admins and super admins alike - publishing mentor advice is the same
 * kind of editorial work as posting a scholarship, which every admin already
 * does.
 */
export default function AdminArticlesPage() {
  const location = useLocation();
  const [notice, setNotice] = useState(
    location.state?.flash ? { tone: "success", text: location.state.flash } : null,
  );
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState(null);

  const debouncedSearch = useDebouncedValue(search, 300);

  const feed = useApi(
    ({ signal }) =>
      articlesApi.adminList(
        { q: debouncedSearch || undefined, topic: topic || undefined, page },
        { signal },
      ),
    [debouncedSearch, topic, page],
    { keepPreviousData: true },
  );

  const remove = useMutation(articlesApi.remove);

  const handleDelete = async () => {
    const result = await remove.mutate(pendingDelete.id);
    setNotice(
      result.ok
        ? { tone: "success", text: `"${pendingDelete.title}" was deleted.` }
        : { tone: "error", text: result.error.message },
    );
    setPendingDelete(null);
    if (result.ok) feed.refetch();
  };

  const rows = feed.data?.results ?? [];
  const published = rows.filter((row) => row.is_published).length;

  return (
    <Page width="wide">
      <PageHeader
        back={{ to: "/admin", label: "Dashboard" }}
        title="Insights articles"
        description="Advice, tips and experience from mentors and contributing writers. Drafts stay invisible to students until you publish them."
        actions={
          <>
            <Button variant="outline" to="/insights">
              View public feed
            </Button>
            <Button to="/admin/articles/new">Write an article</Button>
          </>
        }
      />

      {notice && (
        <Alert tone={notice.tone} className="mb-6" onDismiss={() => setNotice(null)}>
          {notice.text}
        </Alert>
      )}

      {feed.data && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          <Stat
            label="Total articles"
            value={feed.data.count}
            tone="ink"
            icon={statIcon("M4 6h16M4 10h16M4 14h10M4 18h7")}
          />
          <Stat
            label="Published on this page"
            value={published}
            tone="emerald"
            icon={statIcon("M3.5 12.5 9 18 20.5 6.5")}
          />
          <Stat
            label="Drafts on this page"
            value={rows.length - published}
            tone="gold"
            icon={statIcon("m16.9 3.6 3.5 3.5L8.5 19H5v-3.5L16.9 3.6Z")}
          />
        </div>
      )}

      <div className="surface mb-6 flex flex-col gap-3 p-4 sm:flex-row">
        <label htmlFor="article-search" className="sr-only">
          Search articles
        </label>
        <input
          id="article-search"
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search by title, summary or writer..."
          className="h-11 flex-1 rounded-lg border border-ink-300 px-3.5 text-sm transition-colors hover:border-ink-400"
        />
        <label htmlFor="article-topic" className="sr-only">
          Filter by topic
        </label>
        <select
          id="article-topic"
          value={topic}
          onChange={(event) => {
            setTopic(event.target.value);
            setPage(1);
          }}
          className="h-11 rounded-lg border border-ink-300 px-3 pr-8 text-sm transition-colors hover:border-ink-400 sm:w-56"
        >
          <option value="">All topics</option>
          {TOPICS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {feed.error ? (
        <ErrorState error={feed.error} onRetry={feed.refetch} />
      ) : rows.length === 0 && !feed.isLoading ? (
        <EmptyState
          title="No articles yet"
          description={
            search || topic
              ? "Nothing matches that search."
              : "Publish your first piece of mentor advice to open the Insights feed."
          }
          action={<Button to="/admin/articles/new">Write an article</Button>}
        />
      ) : (
        <Card className={feed.isRefreshing ? "opacity-60 transition-opacity" : undefined}>
          <ul className="divide-y divide-ink-200/70">
            {rows.map((article) => {
              const meta = topicOf(article.topic);
              return (
                <li
                  key={article.id}
                  className="flex flex-col gap-4 p-4 transition-colors hover:bg-ink-50/70 sm:flex-row sm:items-center sm:p-5"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "hidden h-12 w-1.5 shrink-0 rounded-full bg-gradient-to-b sm:block",
                      meta.gradient,
                    )}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={meta.chip}>{meta.label}</Badge>
                      {article.is_published ? (
                        <Badge tone="success">Published</Badge>
                      ) : (
                        <Badge tone="neutral">Draft</Badge>
                      )}
                      {article.is_featured && <Badge tone="gold">Featured</Badge>}
                    </div>

                    <h3 className="mt-2 truncate text-sm font-semibold text-ink-900">
                      {article.is_published ? (
                        <Link
                          to={`/insights/${article.slug}`}
                          className="rounded hover:text-brand-700"
                        >
                          {article.title}
                        </Link>
                      ) : (
                        article.title
                      )}
                    </h3>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                      <span className="inline-flex items-center gap-1.5">
                        <AuthorAvatar
                          name={article.author_name}
                          topic={article.topic}
                          size="sm"
                          className="h-6 w-6 text-[0.6rem] ring-0"
                        />
                        {article.author_name}
                      </span>
                      <span>{article.read_minutes} min read</span>
                      <span>
                        {article.is_published
                          ? `Published ${formatShortDate(article.published_at)}`
                          : `Created ${formatShortDate(article.created_at)}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      to={`/admin/articles/${article.id}/edit`}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setPendingDelete(article)}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Pagination
        className="mt-8"
        page={feed.data?.page ?? 1}
        totalPages={feed.data?.total_pages ?? 1}
        onChange={setPage}
      />

      {pendingDelete && (
        <ConfirmDelete
          article={pendingDelete}
          isPending={remove.isPending}
          onCancel={() => setPendingDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </Page>
  );
}
