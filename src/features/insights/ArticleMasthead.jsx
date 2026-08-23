import React from "react";
import { Link } from "react-router";

import cn from "../../lib/cn.js";
import { formatDate } from "../../lib/format.js";
import { Badge } from "../../components/ui/index.js";
import AuthorAvatar from "./AuthorAvatar.jsx";
import { topicOf } from "./topics.js";

/**
 * The opener for one article.
 *
 * The previous version washed the whole band in the topic's gradient with the
 * title on top - which is the default blog-header shape and said nothing this
 * particular piece could not have said. This one is built as a magazine
 * opening spread instead:
 *
 * * the canvas is the section's deep navy, and the topic colour is used as
 *   *accent* - a spine down the left of the title, a bloom behind the
 *   portrait, the rule along the bottom - rather than as wallpaper;
 * * the writer is a co-star, not a footnote. Their photograph is the second
 *   largest thing in the hero, because "who is telling me this" is the whole
 *   reason to trust the advice;
 * * the facts sit in a ruled spec row at the foot, the way a masthead prints
 *   its issue line.
 *
 * It shares the dot lattice and glass panels with the Insights index, so the
 * two read as the same publication without being the same layout.
 */
export default function ArticleMasthead({ article }) {
  const topic = topicOf(article.topic);

  return (
    <header className="relative isolate overflow-hidden bg-brand-950">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[0.22]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      {/* The topic colour arrives as light behind the portrait rather than as
          a flat fill over everything. The light ramp, because the card
          gradient's dark stops would be invisible against this navy. */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute -right-24 top-0 -z-10 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br opacity-30 blur-[110px]",
          topic.onDark,
        )}
      />

      <div className="container py-9 sm:py-12">
        <Link
          to="/insights"
          className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-white/70 transition-colors hover:text-white"
        >
          <span aria-hidden="true">&larr;</span> All insights
        </Link>

        <div className="mt-8 grid items-center gap-10 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-14">
          {/* Title block, hung off a topic-coloured spine */}
          <div className="relative pl-5 sm:pl-7">
            <span
              aria-hidden="true"
              className={cn(
                "absolute left-0 top-1 h-[calc(100%-0.5rem)] w-1.5 rounded-full bg-gradient-to-b",
                topic.onDark,
              )}
            />

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={topic.icon}
                  />
                </svg>
                {topic.label}
              </span>
              {!article.is_published && (
                <Badge tone="neutral">Draft &mdash; only visible to admins</Badge>
              )}
            </div>

            <h1 className="mt-4 text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl xl:text-5xl">
              {article.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
              {article.excerpt}
            </p>
          </div>

          {/* The writer, given real estate */}
          <div className="lg:justify-self-end">
            <div className="flex items-center gap-5 rounded-2xl border border-white/15 bg-white/[0.06] p-5 backdrop-blur sm:gap-6 sm:p-6 lg:flex-col lg:items-start lg:gap-4">
              <AuthorAvatar
                name={article.author_name}
                topic={article.topic}
                photo={article.author_photo}
                size="2xl"
                shape="portrait"
                eager
                className="ring-white/25 lg:ring-4"
              />
              <div className="min-w-0">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-gold-300">
                  Written by
                </p>
                <p className="mt-1.5 text-lg font-semibold leading-tight text-white">
                  {article.author_name}
                </p>
                {article.author_role && (
                  <p className="mt-1 text-sm leading-snug text-white/60">
                    {article.author_role}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Issue line */}
        <dl className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/15 pt-5 text-sm">
          <div className="flex items-center gap-2">
            <dt className="text-white/40">Published</dt>
            <dd className="font-medium text-white/85">
              {formatDate(article.published_at || article.created_at)}
            </dd>
          </div>
          <span className="hidden h-4 w-px bg-white/15 sm:block" aria-hidden="true" />
          <div className="flex items-center gap-2">
            <dt className="text-white/40">Reading time</dt>
            <dd className="font-medium text-white/85">
              {article.read_minutes} min
            </dd>
          </div>
          <span className="hidden h-4 w-px bg-white/15 sm:block" aria-hidden="true" />
          <div className="flex items-center gap-2">
            <dt className="text-white/40">Topic</dt>
            <dd className="font-medium text-white/85">{article.topic_label}</dd>
          </div>
        </dl>
      </div>

      {/* The topic's own colour closes the masthead off. */}
      <div
        aria-hidden="true"
        className={cn("h-1.5 w-full bg-gradient-to-r", topic.gradient)}
      />
    </header>
  );
}
