import React, { useMemo } from "react";
import { Link, useParams } from "react-router-dom";

import { Page } from "../components/layout/SiteLayout.jsx";
import {
  Badge,
  Button,
  Card,
  CardBody,
  ErrorState,
  Skeleton,
} from "../components/ui/index.js";
import { scholarships as scholarshipsApi } from "../lib/api/endpoints.js";
import { useApi } from "../lib/hooks.js";
import {
  deadlineStatus,
  formatDate,
  formatRelativeDays,
  toBulletPoints,
} from "../lib/format.js";

const STATUS = {
  closed: { tone: "neutral", label: "Applications closed" },
  urgent: { tone: "danger", label: "Closing within a week" },
  soon: { tone: "gold", label: "Closing this month" },
  open: { tone: "success", label: "Open for applications" },
};

function BulletList({ text }) {
  const items = useMemo(() => toBulletPoints(text), [text]);
  if (items.length === 0) return <p className="text-sm text-ink-500">Not specified.</p>;

  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex gap-2.5 text-sm text-ink-700">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-3">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <div className="grid grid-cols-2 gap-4 pt-3 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardBody className="space-y-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </CardBody>
      </Card>
    </div>
  );
}

function Fact({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-ink-800">{value || "-"}</dd>
    </div>
  );
}

export default function ScholarshipDetailPage() {
  const { id } = useParams();
  const { data, error, isLoading, refetch } = useApi(
    ({ signal }) => scholarshipsApi.detail(id, { signal }),
    [id],
  );

  return (
    <Page width="narrow">
      <Link
        to="/scholarships"
        className="mb-6 inline-flex items-center gap-1.5 rounded text-sm font-medium text-brand-800 hover:text-brand-600"
      >
        <span aria-hidden="true">&larr;</span> All scholarships
      </Link>

      {isLoading ? (
        <DetailSkeleton />
      ) : error ? (
        <ErrorState
          error={
            error.status === 404
              ? { message: "That scholarship no longer exists or has been removed." }
              : error
          }
          onRetry={error.status === 404 ? undefined : refetch}
        />
      ) : (
        <article className="space-y-6 animate-fade-in">
          <Card>
            <CardBody>
              <Badge tone={STATUS[deadlineStatus(data.deadline)].tone}>
                {STATUS[deadlineStatus(data.deadline)].label}
              </Badge>
              <h1 className="mt-3 text-2xl font-bold text-ink-900 sm:text-3xl">
                {data.name}
              </h1>
              <p className="mt-1.5 text-sm text-ink-500">
                Posted by {data.author} on {formatDate(data.created_at)}
              </p>

              <dl className="mt-6 grid grid-cols-2 gap-5 border-t border-ink-200/70 pt-5 sm:grid-cols-3">
                <Fact label="Host country" value={data.host_country} />
                <Fact label="Degree level" value={data.degree_level} />
                <Fact
                  label="Deadline"
                  value={
                    <>
                      {formatDate(data.deadline)}
                      <span className="ml-1.5 font-normal text-ink-500">
                        ({formatRelativeDays(data.deadline)})
                      </span>
                    </>
                  }
                />
              </dl>

              <div className="mt-6">
                <Button href={data.link} variant="primary" size="lg">
                  Apply on the official page
                  <span aria-hidden="true">&rarr;</span>
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-7">
              <section>
                <h2 className="mb-2.5 text-base font-semibold text-ink-900">About</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-ink-700">
                  {data.description}
                </p>
              </section>

              <section>
                <h2 className="mb-2.5 text-base font-semibold text-ink-900">
                  Who can apply
                </h2>
                <BulletList text={data.eligibility} />
              </section>

              <section>
                <h2 className="mb-2.5 text-base font-semibold text-ink-900">
                  What&apos;s covered
                </h2>
                <BulletList text={data.benefits} />
              </section>
            </CardBody>
          </Card>
        </article>
      )}
    </Page>
  );
}
