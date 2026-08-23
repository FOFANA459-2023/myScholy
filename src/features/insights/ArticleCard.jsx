import React from "react";
import { Link } from "react-router";

import cn from "../../lib/cn.js";
import { formatShortDate } from "../../lib/format.js";
import { Badge } from "../../components/ui/index.js";
import AuthorAvatar from "./AuthorAvatar.jsx";
import { coverUrlOf } from "./media.js";
import { topicOf } from "./topics.js";

/**
 * One piece in the Insights grid.
 *
 * The whole card is a single link (rather than a card containing a "Read more"
 * link) so the entire target area is clickable, matching the dashboard's
 * SectionCard. A gradient rail across the top carries the topic colour, which
 * is what lets a reader scan a mixed grid by subject rather than by title.
 */
export default function ArticleCard({ article, className }) {
  const topic = topicOf(article.topic);
  const cover = coverUrlOf(article);

  return (
    <Link
      to={`/insights/${article.slug}`}
      className={cn(
        "surface group relative flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("h-1.5 w-full shrink-0 bg-gradient-to-r", topic.gradient)}
      />

      {cover && (
        <div className="aspect-[16/9] w-full overflow-hidden bg-ink-100">
          <img
            src={cover}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={topic.chip}>{topic.label}</Badge>
          {!article.is_published && <Badge tone="neutral">Draft</Badge>}
          <span className="text-xs text-ink-400">{article.read_minutes} min read</span>
        </div>

        <h3 className="mt-3 text-lg font-semibold leading-snug text-ink-900 transition-colors group-hover:text-brand-800">
          {article.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-600">
          {article.excerpt}
        </p>

        {/* mt-auto pins the byline to the bottom, so cards in a row line up
            their author strips however uneven the titles above them are. */}
        <div className="mt-auto flex items-center gap-3 border-t border-ink-200/70 pt-4">
          <AuthorAvatar
            name={article.author_name}
            topic={article.topic}
            photo={article.author_photo}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink-800">
              {article.author_name}
            </p>
            <p className="truncate text-xs text-ink-500">
              {article.author_role ||
                formatShortDate(article.published_at || article.created_at)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
