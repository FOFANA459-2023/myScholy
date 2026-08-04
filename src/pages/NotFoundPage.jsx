import React from "react";

import { Page } from "../components/layout/SiteLayout.jsx";
import { Button, EmptyState } from "../components/ui/index.js";

export default function NotFoundPage() {
  return (
    <Page width="narrow">
      <EmptyState
        title="Page not found"
        description="The page you're looking for doesn't exist, or it may have moved."
        action={
          <div className="flex gap-2">
            <Button to="/">Back to home</Button>
            <Button to="/scholarships" variant="outline">
              Browse scholarships
            </Button>
          </div>
        }
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              d="M9.879 7.519A3 3 0 0 1 15 9.75c0 1.5-2.25 2.25-2.25 3.75M12 17.25h.007M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        }
      />
    </Page>
  );
}
