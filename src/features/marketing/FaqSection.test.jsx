import { render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import FaqSection from "./FaqSection.jsx";
import { FAQ_GROUPS, FEATURED_FAQS } from "./faqData.js";

function renderSection(props) {
  return render(
    <MemoryRouter>
      <FaqSection {...props} />
    </MemoryRouter>,
  );
}

describe("FaqSection grouped (landing page)", () => {
  it("renders every group heading and every question", () => {
    renderSection({ grouped: true });
    for (const group of FAQ_GROUPS) {
      expect(screen.getByRole("heading", { name: group.title })).toBeInTheDocument();
      for (const faq of group.faqs) {
        expect(screen.getByText(faq.question)).toBeInTheDocument();
      }
    }
  });

  it("renders multi-paragraph answers as separate paragraphs", () => {
    renderSection({ grouped: true });
    const multi = FAQ_GROUPS.flatMap((g) => g.faqs).find((f) =>
      Array.isArray(f.answer),
    );
    expect(multi).toBeDefined();
    for (const paragraph of multi.answer) {
      expect(screen.getByText(paragraph)).toBeInTheDocument();
    }
  });

  it("opens with the gold Note disclaimer", () => {
    renderSection({ grouped: true });
    expect(screen.getByText("Note")).toBeInTheDocument();
    expect(
      screen.getByText(/does not award scholarships or grant admission/i),
    ).toBeInTheDocument();
  });
});

describe("FaqSection compact (marketing pages)", () => {
  it("renders only the featured set with a link to the full FAQ", () => {
    renderSection();
    for (const faq of FEATURED_FAQS) {
      expect(screen.getByText(faq.question)).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: /full faq/i })).toHaveAttribute(
      "href",
      "/#faq",
    );
  });
});
