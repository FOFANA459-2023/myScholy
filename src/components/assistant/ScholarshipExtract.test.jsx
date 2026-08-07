import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ScholarshipExtract from "./ScholarshipExtract.jsx";
import { assistant } from "../../lib/api/endpoints.js";

vi.mock("../../lib/api/endpoints.js", () => ({
  assistant: {
    extractScholarship: vi.fn(),
    extractScholarshipUrl: vi.fn(),
    extractScholarshipPdf: vi.fn(),
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

const SAMPLE =
  "The Example Fellowship 2027 offers fully funded masters study in Germany. Deadline 1 March 2027.";

describe("ScholarshipExtract", () => {
  it("keeps the button disabled until enough text is pasted", async () => {
    render(<ScholarshipExtract onExtract={() => {}} />);
    const button = screen.getByRole("button", { name: /extract details/i });
    expect(button).toBeDisabled();

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/announcement text/i), SAMPLE);
    expect(button).toBeEnabled();
  });

  it("passes only non-empty fields to onExtract", async () => {
    assistant.extractScholarship.mockResolvedValue({
      fields: {
        name: "Example Fellowship 2027",
        deadline: "2027-03-01",
        host_country: "Germany",
        degree_level: "",
        benefits: "",
        eligibility: "",
        description: "",
        link: "",
      },
    });
    const onExtract = vi.fn();

    render(<ScholarshipExtract onExtract={onExtract} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/announcement text/i), SAMPLE);
    await user.click(screen.getByRole("button", { name: /extract details/i }));

    expect(await screen.findByText(/details extracted/i)).toBeInTheDocument();
    expect(onExtract).toHaveBeenCalledWith({
      name: "Example Fellowship 2027",
      deadline: "2027-03-01",
      host_country: "Germany",
    });
  });

  it("extracts from a URL in link mode", async () => {
    assistant.extractScholarshipUrl.mockResolvedValue({
      fields: { name: "From URL" },
    });
    const onExtract = vi.fn();

    render(<ScholarshipExtract onExtract={onExtract} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: /web link/i }));
    await user.type(
      screen.getByLabelText(/scholarship page link/i),
      "https://example.org/award",
    );
    await user.click(screen.getByRole("button", { name: /extract details/i }));

    expect(await screen.findByText(/details extracted/i)).toBeInTheDocument();
    expect(assistant.extractScholarshipUrl).toHaveBeenCalledWith(
      "https://example.org/award",
    );
    expect(onExtract).toHaveBeenCalledWith({ name: "From URL" });
  });

  it("extracts from a file in PDF mode", async () => {
    assistant.extractScholarshipPdf.mockResolvedValue({
      fields: { name: "From PDF" },
    });
    const onExtract = vi.fn();

    render(<ScholarshipExtract onExtract={onExtract} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: /pdf file/i }));
    const pdf = new File(["%PDF-1.4"], "award.pdf", { type: "application/pdf" });
    await user.upload(screen.getByLabelText(/announcement pdf/i), pdf);
    await user.click(screen.getByRole("button", { name: /extract details/i }));

    expect(await screen.findByText(/details extracted/i)).toBeInTheDocument();
    expect(assistant.extractScholarshipPdf).toHaveBeenCalledWith(pdf);
    expect(onExtract).toHaveBeenCalledWith({ name: "From PDF" });
  });

  it("surfaces extraction errors", async () => {
    assistant.extractScholarship.mockRejectedValue(
      new Error("The text could not be analysed."),
    );

    render(<ScholarshipExtract onExtract={() => {}} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/announcement text/i), SAMPLE);
    await user.click(screen.getByRole("button", { name: /extract details/i }));

    expect(
      await screen.findByText(/could not be analysed/i),
    ).toBeInTheDocument();
  });
});
