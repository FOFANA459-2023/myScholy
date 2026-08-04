import { render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import ComingSoon from "./ComingSoon.jsx";

function renderBanner(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("ComingSoon", () => {
  it("shows the label chip and the page's own message", () => {
    renderBanner(
      <ComingSoon>
        <p>Consulting is coming soon.</p>
      </ComingSoon>,
    );
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
    expect(screen.getByText("Consulting is coming soon.")).toBeInTheDocument();
  });

  it("always offers the three places available in the meantime", () => {
    renderBanner(
      <ComingSoon>
        <p>Soon.</p>
      </ComingSoon>,
    );
    expect(screen.getByRole("link", { name: /browse scholarships/i })).toHaveAttribute(
      "href",
      "/scholarships",
    );
    expect(screen.getByRole("link", { name: /join the community/i })).toHaveAttribute(
      "href",
      "/whatsapp",
    );
    expect(screen.getByRole("link", { name: /contact us/i })).toHaveAttribute(
      "href",
      "/contact",
    );
  });
});
