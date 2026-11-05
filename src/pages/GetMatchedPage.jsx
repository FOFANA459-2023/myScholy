import React from "react";

import EligibilityCheck from "../features/marketing/EligibilityCheck.jsx";

/**
 * Standalone home for the matching quiz.
 *
 * Signed-in students only - the route is wrapped in ProtectedRoute, because
 * matching writes the answers onto the student's own record and emails them
 * new matches afterwards. Neither is possible for a visitor we cannot
 * identify, and offering the quiz without them would promise something we
 * could not deliver.
 */
export default function GetMatchedPage() {
  return <EligibilityCheck />;
}
