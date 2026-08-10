import { render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import AssistantMarkdown from "./assistantMarkdown.jsx";

function renderMarkdown(text) {
  return render(
    <MemoryRouter>
      <AssistantMarkdown text={text} />
    </MemoryRouter>,
  );
}

describe("AssistantMarkdown", () => {
  it("renders paragraphs, lists, bold, and blue links", () => {
    renderMarkdown(
      "Two great options for you:\n" +
        "- **Chevening Scholarship** - closes 06 Oct 2026: [details](/scholarships/chevening)\n" +
        "- [DAAD](https://www.daad.de/en/) for Germany",
    );

    expect(screen.getByText(/two great options/i)).toBeInTheDocument();
    expect(screen.getByText("Chevening Scholarship").tagName).toBe("STRONG");

    const internal = screen.getByRole("link", { name: "details" });
    expect(internal).toHaveAttribute("href", "/scholarships/chevening");
    expect(internal.className).toContain("text-brand-700");
    expect(internal.className).toContain("underline");

    const external = screen.getByRole("link", { name: "DAAD" });
    expect(external).toHaveAttribute("href", "https://www.daad.de/en/");
    expect(external).toHaveAttribute("target", "_blank");
    expect(external).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("keeps site-absolute links inside the app and autolinks bare URLs", () => {
    renderMarkdown(
      "See [the board](https://myscholy.pages.dev/scholarships) or " +
        "https://example.com/apply directly.",
    );

    expect(screen.getByRole("link", { name: "the board" })).toHaveAttribute(
      "href",
      "/scholarships",
    );
    const bare = screen.getByRole("link", { name: "https://example.com/apply" });
    expect(bare).toHaveAttribute("href", "https://example.com/apply");
  });

  it("does not swallow sentence punctuation into bare URLs", () => {
    renderMarkdown("Apply at https://example.com/apply. Good luck!");
    const link = screen.getByRole("link", { name: "https://example.com/apply" });
    expect(link).toHaveAttribute("href", "https://example.com/apply");
    expect(screen.getByText(/\. Good luck!/)).toBeInTheDocument();
  });

  it("renders model text as plain content, never as HTML", () => {
    const { container } = renderMarkdown("Try <img src=x onerror=alert(1)> now");
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText(/onerror=alert\(1\)/)).toBeInTheDocument();
  });
});
