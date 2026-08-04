import React from "react";

import { Page, PageHeader } from "../components/layout/SiteLayout.jsx";
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingDots,
  Pagination,
  SkeletonGrid,
} from "../components/ui/index.js";
import ScholarshipCard from "../features/scholarships/ScholarshipCard.jsx";
import ScholarshipFilters from "../features/scholarships/ScholarshipFilters.jsx";
import useScholarshipQuery from "../features/scholarships/useScholarshipQuery.js";

export default function ScholarshipListPage() {
  const query = useScholarshipQuery();

  return (
    <Page width="wide">
      <PageHeader
        title="Scholarships"
        description="Funded opportunities from around the world, updated as they open."
      />

      <ScholarshipFilters
        values={query.values}
        onChange={query.setValue}
        onReset={query.reset}
        facets={query.facets}
        resultCount={query.count}
        isBusy={query.isLoading || query.isRefreshing}
      />

      {query.error ? (
        <ErrorState error={query.error} onRetry={query.refetch} />
      ) : query.isLoading ? (
        <>
          <LoadingDots label="Rounding up scholarships for you..." className="mb-4" />
          <SkeletonGrid count={6} />
        </>
      ) : query.results.length === 0 ? (
        <EmptyState
          title="No scholarships match those filters"
          description="Try widening your search - clear a filter or two and see what comes back."
          action={<Button onClick={query.reset}>Clear filters</Button>}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="m21 21-4.35-4.35M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z"
              />
            </svg>
          }
        />
      ) : (
        <>
          <div
            className={`grid grid-cols-1 gap-5 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${
              query.isRefreshing ? "opacity-60" : ""
            }`}
          >
            {query.results.map((scholarship, index) => (
              <div
                key={scholarship.id}
                className={query.isRefreshing ? undefined : "animate-fade-in"}
                // Cards settle in sequence rather than appearing as one block.
                // Capped so a full page never feels like it is waiting on itself.
                style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
              >
                <ScholarshipCard scholarship={scholarship} />
              </div>
            ))}
          </div>

          <Pagination
            className="mt-10"
            page={query.page}
            totalPages={query.totalPages}
            onChange={query.setPage}
          />
        </>
      )}
    </Page>
  );
}
