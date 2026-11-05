import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import MatchScore from "./MatchScore.jsx";

describe("MatchScore", () => {
  it("renders nothing when there is no score to show", () => {
    // The API sends null for a student with no profile - showing "0%" there
    // would read as "nothing suits you" rather than "we don't know yet".
    const { container } = render(<MatchScore score={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("bands the score so the number is not the only signal", () => {
    render(<MatchScore score={92} />);
    expect(screen.getByText("92%")).toBeInTheDocument();
    expect(screen.getByText(/strong match/i)).toBeInTheDocument();
  });

  it("exposes the score to screen readers as words, not a bare percent", () => {
    render(<MatchScore score={64} />);
    expect(screen.getByText("64 percent match")).toBeInTheDocument();
    expect(screen.getByText(/good match/i)).toBeInTheDocument();
  });

  it("replaces the score with a caution when the student may not qualify", () => {
    // An encouraging percentage next to a rule that rules them out would be
    // misleading, so the badge changes rather than the number going down.
    render(<MatchScore score={88} blocked />);
    expect(screen.getByText(/check eligibility/i)).toBeInTheDocument();
    expect(screen.queryByText("88%")).not.toBeInTheDocument();
  });
});
