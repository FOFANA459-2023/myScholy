import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";

import { Button, Skeleton } from "../../components/ui/index.js";
import AuthorAvatar from "../insights/AuthorAvatar.jsx";
import { coverUrlOf } from "../insights/media.js";
import { topicOf } from "../insights/topics.js";
import cn from "../../lib/cn.js";
import { articles as articlesApi } from "../../lib/api/endpoints.js";
import { useApi, useMediaQuery } from "../../lib/hooks.js";
import { formatShortDate } from "../../lib/format.js";

// How many of the newest pieces take turns in the lead card, and how long each
// one holds the slot. Six seconds is long enough to read a headline and an
// excerpt without the card feeling static.
const LEAD_COUNT = 3;
const ROTATE_MS = 6000;

/**
 * The newest Insights pieces, on the landing page.
 *
 * Deliberately *not* the three-up card grid used on the Insights index. Three
 * equal cards give three equal emphases, which reads as a wall rather than a
 * recommendation - and with uneven cover images the row goes ragged, then
 * collapses into three tall boxes stacked down a phone screen.
 *
 * This is the newspaper answer instead: one lead piece carrying the image and
 * the weight, with the rest as compact thumbnail rows beside it on desktop and
 * beneath it on mobile. The hierarchy tells a reader where to start, and the
 * secondary rows cost ~90px each rather than ~500px, so all three fit on one
 * phone screen instead of three.
 */

/** Thumbnail for a secondary row: the cover, or the topic mark if there is none.
 *
 * The hairline ring is not decoration: covers are supplied by admins and a pale
 * one has no edge of its own against this section's near-white background, so
 * without it some rows would look like they were missing an image entirely.
 */
function Thumbnail({ article, className }) {
  const topic = topicOf(article.topic);
  const cover = coverUrlOf(article);
  const shared = "shrink-0 rounded-xl ring-1 ring-inset ring-ink-900/10";

  if (cover) {
    return (
      <img
        src={cover}
        alt=""
        loading="lazy"
        decoding="async"
        className={cn(shared, "bg-ink-100 object-cover", className)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        shared,
        "flex items-center justify-center bg-gradient-to-br text-white",
        topic.gradient,
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={topic.icon} />
      </svg>
    </span>
  );
}

/** The lead: image-forward, with the type sitting over a scrim. */
function LeadArticle({ article }) {
  const topic = topicOf(article.topic);
  const cover = coverUrlOf(article);

  return (
    <Link
      to={`/insights/${article.slug}`}
      className={cn(
        "group relative flex min-h-[22rem] flex-col justify-end overflow-hidden rounded-2xl shadow-card transition-shadow hover:shadow-card-hover sm:min-h-[26rem] lg:min-h-full",
        // With no cover the topic gradient becomes the artwork, so the lead
        // never falls back to a bare white box.
        !cover && cn("bg-gradient-to-br", topic.gradient),
      )}
    >
      {cover && (
        <>
          <img
            src={cover}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
          {/* Scrim: the type has to stay readable over any photo an admin picks. */}
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-ink-900/90 via-ink-900/55 to-ink-900/10"
          />
        </>
      )}

      <div className="relative p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
              className="h-3.5 w-3.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={topic.icon} />
            </svg>
            {topic.label}
          </span>
          <span className="text-xs text-white/70">
            {article.read_minutes} min read
          </span>
        </div>

        <h3 className="on-brand mt-4 text-2xl font-bold leading-tight sm:text-3xl">
          {article.title}
        </h3>
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-white/80 sm:text-base">
          {article.excerpt}
        </p>

        <div className="mt-5 flex items-center gap-3">
          <AuthorAvatar
            name={article.author_name}
            topic={article.topic}
            photo={article.author_photo}
            size="sm"
            className="ring-white/40"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {article.author_name}
            </p>
            {article.author_role && (
              <p className="truncate text-xs text-white/65">
                {article.author_role}
              </p>
            )}
          </div>
          <span
            aria-hidden="true"
            className="ml-auto hidden shrink-0 text-white transition-transform group-hover:translate-x-1 sm:block"
          >
            &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}

/** A secondary piece: thumbnail, title, one meta line. */
function CompactArticle({ article }) {
  const topic = topicOf(article.topic);

  return (
    <Link
      to={`/insights/${article.slug}`}
      className="group flex items-start gap-4 rounded-xl p-3 transition-colors hover:bg-white sm:gap-5"
    >
      <Thumbnail article={article} className="h-20 w-20 sm:h-24 sm:w-24" />

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span
            className={cn(
              "font-semibold uppercase tracking-wide",
              // Card gradients are tuned for white; the text needs a solid
              // brand colour rather than a gradient here.
              "text-brand-700",
            )}
          >
            {topic.label}
          </span>
          <span className="text-ink-400">{article.read_minutes} min read</span>
        </p>

        <h3 className="mt-1.5 line-clamp-2 text-base font-semibold leading-snug text-ink-900 transition-colors group-hover:text-brand-800">
          {article.title}
        </h3>

        <p className="mt-1.5 truncate text-xs text-ink-500">
          {article.author_name}
          <span className="mx-1.5" aria-hidden="true">
            &middot;
          </span>
          {formatShortDate(article.published_at || article.created_at)}
        </p>
      </div>
    </Link>
  );
}

/**
 * The lead slot, taking turns between the newest pieces.
 *
 * Slides are stacked in one grid cell rather than positioned absolutely, so
 * the container takes the height of the tallest and nothing jumps as the
 * cards swap - a headline two lines longer than the last would otherwise
 * resize the whole section mid-rotation.
 *
 * Rotation stops while the pointer or keyboard focus is inside the card (a
 * reader part-way through an excerpt must not have it swapped out from under
 * them), while the tab is hidden, and entirely for anyone who has asked for
 * reduced motion - they still get the dots to move through it by hand.
 */
function RotatingLead({ articles }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const containerRef = useRef(null);

  const count = articles.length;
  const show = useCallback(
    (next) => setIndex(((next % count) + count) % count),
    [count],
  );

  useEffect(() => {
    if (count < 2 || paused || reduceMotion) return undefined;

    const timer = setInterval(() => {
      // A background tab should not burn through the queue unseen.
      if (!document.hidden) setIndex((current) => (current + 1) % count);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [count, paused, reduceMotion]);

  // An index left over from a longer list would point at nothing once the
  // feed refreshes with fewer pieces.
  useEffect(() => {
    setIndex((current) => (current < count ? current : 0));
  }, [count]);

  return (
    <div
      ref={containerRef}
      className="relative"
      // Pointer and focus both pause: the card is a link, so a keyboard user
      // tabbing into it is reading it just as much as a mouse user hovering.
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget)) setPaused(false);
      }}
      aria-roledescription="carousel"
      aria-label="Latest insights"
    >
      <div className="grid">
        {articles.map((article, slideIndex) => {
          const isActive = slideIndex === index;
          return (
            <div
              key={article.id}
              // Every slide occupies the same grid cell, so the stack is as
              // tall as the tallest card and never reflows.
              className={cn(
                "col-start-1 row-start-1 transition-opacity duration-500",
                isActive ? "opacity-100" : "pointer-events-none opacity-0",
              )}
              aria-hidden={!isActive}
              // Hidden slides keep their links out of the tab order.
              {...(isActive ? {} : { inert: "" })}
            >
              <LeadArticle article={article} />
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <div className="mt-2 flex items-center justify-center lg:absolute lg:bottom-2 lg:right-4 lg:mt-0 lg:justify-end">
          {articles.map((article, dotIndex) => (
            // The button carries padding so the tap target clears the 24px
            // minimum on touch, while the dot inside it stays small.
            <button
              key={article.id}
              type="button"
              onClick={() => show(dotIndex)}
              aria-label={`Show "${article.title}"`}
              aria-current={dotIndex === index ? "true" : undefined}
              className="group/dot grid h-11 w-7 place-items-center"
            >
              <span
                className={cn(
                  "block h-2.5 rounded-full transition-all duration-300",
                  dotIndex === index
                    ? "w-7 bg-brand-700 lg:bg-white"
                    : "w-2.5 bg-ink-300 group-hover/dot:bg-ink-400 lg:bg-white/45 lg:group-hover/dot:bg-white/70",
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-10">
      <Skeleton className="min-h-[22rem] rounded-2xl sm:min-h-[26rem]" />
      <div className="space-y-4">
        {Array.from({ length: 2 }, (_, index) => (
          <div
            key={index}
            className="flex gap-4 p-3"
            style={{ "--skeleton-delay": `${index * 140}ms` }}
          >
            <Skeleton className="h-20 w-20 shrink-0 rounded-xl sm:h-24 sm:w-24" />
            <div className="flex-1 space-y-2 py-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LatestInsights() {
  // Six: three take turns in the lead card, three fill the column beside it.
  const feed = useApi(
    ({ signal }) => articlesApi.list({ page_size: 6 }, { signal }),
    [],
  );
  const highlights = useApi(
    ({ signal }) => articlesApi.highlights({ signal }),
    [],
  );

  const rows = feed.data?.results ?? [];
  if (!feed.isLoading && rows.length === 0) return null;

  // The newest pieces rotate through the lead; whatever is left fills the
  // column beside it. Splitting rather than overlapping means a piece is never
  // shown twice in the same section.
  const leadArticles = rows.slice(0, LEAD_COUNT);
  const sideArticles = rows.slice(leadArticles.length);
  const contributors = highlights.data?.contributors ?? [];

  return (
    <section className="bg-ink-50 py-16 sm:py-20">
      <div className="container">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              myScholy Insights
            </p>
            <h2 className="mt-2 text-2xl font-bold text-ink-900 sm:text-3xl">
              Advice from people who already won
            </h2>
            <p className="mt-1.5 max-w-xl text-sm text-ink-500">
              Essays, interviews and application strategy, written by mentors and
              scholars who have been through it.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            {contributors.length > 0 && (
              <div className="flex items-center gap-2.5">
                <div className="flex -space-x-2.5">
                  {contributors.slice(0, 4).map((person) => (
                    <AuthorAvatar
                      key={person.name}
                      name={person.name}
                      topic={person.topic}
                      photo={person.photo}
                      size="sm"
                    />
                  ))}
                </div>
                <span className="text-xs text-ink-500">
                  {highlights.data.total_contributors} writers &middot;{" "}
                  {highlights.data.total_articles} pieces
                </span>
              </div>
            )}
            <Button to="/insights" variant="outline">
              Read all insights
              <span aria-hidden="true">&rarr;</span>
            </Button>
          </div>
        </div>

        {feed.isLoading ? (
          <LoadingState />
        ) : (
          <div
            className={cn(
              "grid gap-6 lg:gap-10",
              // With nothing to put beside it, the lead takes the full width
              // rather than sitting next to an empty column.
              sideArticles.length > 0 &&
                "lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]",
            )}
          >
            <RotatingLead articles={leadArticles} />

            {sideArticles.length > 0 && (
              // Hairlines between rows rather than card borders: boxed cards
              // beside a boxed lead would put four frames on screen.
              <ul className="divide-y divide-ink-200/70 lg:-my-3">
                {sideArticles.map((article) => (
                  <li key={article.id} className="py-1">
                    <CompactArticle article={article} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
