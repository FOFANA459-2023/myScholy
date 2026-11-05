import React, { useEffect, useState } from "react";
import { useParams } from "react-router";

import { Page } from "../components/layout/SiteLayout.jsx";
import {
  Button,
  Card,
  CardBody,
  ErrorState,
  Skeleton,
} from "../components/ui/index.js";
import ArticleBody from "../features/insights/ArticleBody.jsx";
import ArticleCard from "../features/insights/ArticleCard.jsx";
import ArticleMasthead from "../features/insights/ArticleMasthead.jsx";
import AuthorAvatar from "../features/insights/AuthorAvatar.jsx";
import { coverUrlOf } from "../features/insights/media.js";
import cn from "../lib/cn.js";
import { articles as articlesApi } from "../lib/api/endpoints.js";
import { useApi } from "../lib/hooks.js";

/**
 * How far through the piece the reader is.
 *
 * Long-form is the one place on this site where "how much is left?" is a real
 * question, and the bar answers it without taking any layout space. It sits
 * directly under the sticky navbar (top-[4.5rem]) so it reads as part of the
 * chrome rather than as part of the article.
 */
function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const scrollable = document.body.scrollHeight - window.innerHeight;
      // A page shorter than the viewport has nothing to progress through;
      // reporting 100% there would look like a bug rather than completion.
      setProgress(scrollable <= 0 ? 0 : Math.min(1, window.scrollY / scrollable));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      className="fixed inset-x-0 top-[4.5rem] z-40 h-1 bg-transparent"
      aria-hidden="true"
    >
      <div
        className="h-full origin-left bg-gradient-to-r from-brand-700 via-brand-500 to-gold-400 transition-[transform] duration-150"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-28 rounded-full" />
      <Skeleton className="h-10 w-11/12" />
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="mt-6 h-14 w-64 rounded-xl" />
      <div className="space-y-3 pt-8">
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton
            key={i}
            className={cn("h-4", i % 4 === 3 ? "w-2/3" : "w-full")}
            style={{ "--skeleton-delay": `${i * 90}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function InsightDetailPage() {
  const { slug } = useParams();

  const { data, error, isLoading, refetch } = useApi(
    ({ signal }) => articlesApi.detail(slug, { signal }),
    [slug],
  );
  // Loads independently: the piece itself never waits on the strip, and a
  // failure here simply hides it.
  const related = useApi(
    ({ signal }) => articlesApi.related(slug, { signal }),
    [slug],
  );

  if (isLoading) {
    return (
      <Page width="narrow">
        <DetailSkeleton />
      </Page>
    );
  }

  if (error) {
    return (
      <Page width="narrow">
        <ErrorState
          error={
            error.status === 404
              ? { message: "That piece no longer exists, or hasn't been published yet." }
              : error
          }
          onRetry={error.status === 404 ? undefined : refetch}
        />
        <div className="mt-6 text-center">
          <Button variant="outline" to="/insights">
            Back to Insights
          </Button>
        </div>
      </Page>
    );
  }

  const cover = coverUrlOf(data);

  return (
    <>
      <ReadingProgress />

      <ArticleMasthead article={data} />

      <Page width="narrow">
        <article className="animate-fade-in">
          {cover && (
            <img
              src={cover}
              alt=""
              className="mb-10 aspect-[16/9] w-full rounded-2xl object-cover shadow-card"
            />
          )}

          <ArticleBody text={data.body} />

          {data.author_bio && (
            <Card className="mt-14">
              <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <AuthorAvatar
                  name={data.author_name}
                  topic={data.topic}
                  photo={data.author_photo}
                  size="xl"
                  shape="portrait"
                  className="ring-ink-100"
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                    About the writer
                  </p>
                  <p className="mt-1 text-base font-semibold text-ink-900">
                    {data.author_name}
                  </p>
                  {data.author_role && (
                    <p className="text-sm text-ink-500">{data.author_role}</p>
                  )}
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-700">
                    {data.author_bio}
                  </p>
                </div>
              </CardBody>
            </Card>
          )}

          <div className="mt-10 overflow-hidden rounded-2xl border border-gold-200 bg-gold-50/70 p-6 text-center sm:p-8">
            <h2 className="text-xl font-bold text-ink-900">
              Ready to put this to work?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">
              Browse live, fully funded scholarships on the board - or get
              matched to the ones that suit you in about a minute.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button to="/scholarships" size="lg">
                Browse scholarships
              </Button>
              <Button to="/get-matched" size="lg" variant="outline">
                Get matched
              </Button>
            </div>
          </div>
        </article>

        {related.data?.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-14">
            <h2
              id="related-heading"
              className="mb-5 flex items-center gap-3 text-sm font-semibold uppercase tracking-wider text-ink-400"
            >
              Keep reading
              <span className="h-px flex-1 bg-ink-200/70" aria-hidden="true" />
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {related.data.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}
      </Page>
    </>
  );
}
