import React from "react";

import { Page } from "../components/layout/SiteLayout.jsx";
import { Button, EmptyState } from "../components/ui/index.js";

export default function AccessDeniedPage() {
  return (
    <Page width="narrow">
      <EmptyState
        title="You don't have access to this page"
        description="Your account doesn't have the permissions needed here. If you think that's a mistake, get in touch and we'll sort it out."
        action={
          <div className="flex gap-2">
            <Button to="/">Back to home</Button>
            <Button to="/contact" variant="outline">
              Contact support
            </Button>
          </div>
        }
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2Zm10-10V7a4 4 0 0 0-8 0v4h8Z"
            />
          </svg>
        }
      />
    </Page>
  );
}
