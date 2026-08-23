import React, { useState } from "react";
import { Link, useSearchParams } from "react-router";

import { Page } from "../components/layout/SiteLayout.jsx";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Pagination,
  SkeletonGrid,
} from "../components/ui/index.js";
import ArticleCard from "../features/insights/ArticleCard.jsx";
import AuthorAvatar from "../features/insights/AuthorAvatar.jsx";
import InsightsMasthead from "../features/insights/InsightsMasthead.jsx";
import { coverUrlOf } from "../features/insights/media.js";
import { TOPICS, topicOf } from "../features/insights/topics.js";
import cn from "../lib/cn.js";
import { articles as articlesApi } from "../lib/api/endpoints.js";
import { useApi, useDebouncedValue } from "../lib/hooks.js";
import { formatDate } from "../lib/format.js";

/**
 * The lead piece, rendered as a full-bleed editorial card over the topic's own
 * gradient. It is deliberately not an ArticleCard: the whole point of the
 * featured slot is that it does not look like the grid below it.
 */
function FeaturedArticle({ article }) {
  const topic = topicOf(article.topic);
  const cover = coverUrlOf(article);

  return (
    <Link
      to={`/insights/${article.slug}`}
      className={cn(
        "group relative mb-10 block overflow-hidden rounded-2xl bg-gradient-to-br shadow-card transition-shadow hover:shadow-card-hover",
        topic.gradient,
      )}
    >
      {/* The cover sits behind the wash rather than beside it, so the type
          stays legible whatever photo an admin picks. */}
      {cover && (
        <img
          src={cover}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-25 transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/10 to-transparent" />

      <div className="relative p-6 sm:p-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur">
            Featured
          </span>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">
            {topic.label}
          </span>
        </div>

        <h2 className="on-brand mt-4 max-w-3xl text-2xl font-bold leading-tight sm:text-4xl">
          {article.title}
        </h2>
        <p className="on-brand mt-3 max-w-2xl text-sm leading-relaxed opacity-95 sm:text-base">
          {article.excerpt}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <AuthorAvatar
            name={article.author_name}
            topic={article.topic}
            photo={article.author_photo}
            className="ring-white/50"
          />
          <div>
            <p className="on-brand text-sm font-semibold">{article.author_name}</p>
            <p className="text-xs text-white/80">
              {article.author_role || formatDate(article.published_at)}
              <span className="mx-1.5" aria-hidden="true">
                &middot;
              </span>
              {article.read_minutes} min read
            </p>
          </div>
          <span className="ml-auto hidden items-center gap-1.5 text-sm font-medium text-white sm:inline-flex">
            Read the piece
            <span
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-1"
            >
              &rarr;
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Horizontal, scrollable row of topic filters with live counts. */
function TopicChips({ topics, active, onChange }) {
  const chipClass = (isActive) =>
    cn(
      "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
      isActive
        ? "border-brand-900 bg-brand-900 text-white"
        : "border-ink-300 bg-white text-ink-700 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-900",
    );

  return (
    <div
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="group"
      aria-label="Filter by topic"
    >
      <button type="button" className={chipClass(!active)} onClick={() => onChange("")}>
        All topics
      </button>
      {TOPICS.map((topic) => {
        // Counts arrive from the API; a topic nobody has written for yet is
        // shown disabled rather than hidden, so the row keeps its shape.
        const count = topics?.find((row) => row.value === topic.value)?.count ?? 0;
        return (
          <button
            key={topic.value}
            type="button"
            disabled={count === 0 && active !== topic.value}
            onClick={() => onChange(topic.value)}
            className={cn(
              chipClass(active === topic.value),
              count === 0 && active !== topic.value && "opacity-40",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "h-2 w-2 rounded-full bg-gradient-to-br",
                topic.gradient,
                active === topic.value && "bg-white bg-none",
              )}
            />
            {topic.label}
            {count > 0 && (
              <span
                className={cn(
                  "text-xs",
                  active === topic.value ? "text-white/70" : "text-ink-400",
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Insights: advice, tips and lived experience from myScholy mentors and
 * contributing writers.
 *
 * Topic and page live in the query string rather than component state, so a
 * filtered view is a shareable URL and the back button steps through filters
 * the way a reader expects.
 */
export default function InsightsPage() {
  const [params, setParams] = useSearchParams();
  const topic = params.get("topic") || "";
  const page = Number(params.get("page")) || 1;

  const [search, setSearch] = useState(params.get("q") || "");
  const debouncedSearch = useDebouncedValue(search, 300);

  const feed = useApi(
    ({ signal }) =>
      articlesApi.list(
        { topic: topic || undefined, q: debouncedSearch || undefined, page },
        { signal },
      ),
    [topic, debouncedSearch, page],
    { keepPreviousData: true },
  );
  const topics = useApi(({ signal }) => articlesApi.topics({ signal }), []);
  const highlights = useApi(({ signal }) => articlesApi.highlights({ signal }), []);

  // Any filter change resets to page 1: staying on page 3 of a narrower
  // result set would land the reader on an empty page.
  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    if (!("page" in changes)) next.delete("page");
    setParams(next, { replace: true });
  };

  const results = feed.data?.results ?? [];
  // The lead card is only earned on the unfiltered first page - inside a
  // search or a topic it would just be the first result, dressed up.
  const isBrowsingAll = !topic && !debouncedSearch && page === 1;
  const featured = isBrowsingAll && results[0]?.is_featured ? results[0] : null;
  const gridArticles = featured ? results.slice(1) : results;

  return (
    <>
      <InsightsMasthead
        highlights={highlights.data}
        search={search}
        onSearch={(value) => {
          setSearch(value);
          update({ q: value });
        }}
      />

      <Page width="wide">
        <div className="mb-8">
          <TopicChips
            topics={topics.data}
            active={topic}
            onChange={(value) => update({ topic: value })}
          />
        </div>

        {feed.error ? (
          <ErrorState error={feed.error} onRetry={feed.refetch} />
        ) : feed.isLoading ? (
          <SkeletonGrid count={6} />
        ) : results.length === 0 ? (
          <EmptyState
            title="Nothing here yet"
            description={
              debouncedSearch || topic
                ? "No pieces match that search yet. Try another topic."
                : "Our mentors are writing. Check back shortly for the first piece."
            }
            action={
              debouncedSearch || topic ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    update({ topic: "", q: "" });
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button to="/scholarships">Browse scholarships</Button>
              )
            }
          />
        ) : (
          <div className={feed.isRefreshing ? "opacity-60 transition-opacity" : undefined}>
            {featured && <FeaturedArticle article={featured} />}

            {gridArticles.length > 0 && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {gridArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    className="animate-fade-in"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <Pagination
          className="mt-10"
          page={feed.data?.page ?? 1}
          totalPages={feed.data?.total_pages ?? 1}
          onChange={(next) => update({ page: String(next) })}
        />

        {/* The feed exists to move readers toward the board; say so once, at
            the end, rather than with a banner competing for attention. */}
        <div className="mt-14 overflow-hidden rounded-2xl border border-gold-200 bg-gold-50/70 p-6 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-8">
          <div>
            <Badge tone="gold">Put it into practice</Badge>
            <h2 className="mt-3 text-xl font-bold text-ink-900">
              Found the advice useful? Go and apply it.
            </h2>
            <p className="mt-1.5 text-sm text-ink-600">
              Hundreds of live, fully funded scholarships are on the board right
              now - filtered by country, degree level and deadline.
            </p>
          </div>
          <Button to="/scholarships" size="lg" className="mt-5 shrink-0 sm:mt-0">
            Browse scholarships
            <span aria-hidden="true">&rarr;</span>
          </Button>
        </div>
      </Page>
    </>
  );
}
