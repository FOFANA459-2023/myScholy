import React from "react";

import EligibilityCheck from "../features/marketing/EligibilityCheck.jsx";

/**
 * Standalone home for the fit assessment.
 *
 * Reached from "Start with an assessment" on the roadmap rather than sitting
 * on the landing page, so the questions are something a visitor chooses to
 * start instead of something they scroll past.
 */
export default function AssessmentPage() {
  return <EligibilityCheck />;
}
