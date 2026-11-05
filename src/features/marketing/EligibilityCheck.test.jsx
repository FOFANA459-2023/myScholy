import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import EligibilityCheck from "./EligibilityCheck.jsx";
import {
  assessment as assessmentApi,
  assistant as assistantApi,
} from "../../lib/api/endpoints.js";

vi.mock("../../lib/api/endpoints.js", () => ({
  assessment: { match: vi.fn(), count: vi.fn() },
  assistant: { status: vi.fn(), assessment: vi.fn() },
}));

const MATCH = {
  total_live: 40,
  match_count: 3,
  exact_count: 1,
  blocked_count: 2,
  saved_to_profile: true,
  results: [
    {
      id: 1,
      name: "Chevening Scholarship",
      slug: "chevening-scholarship",
      host_country: "United Kingdom",
      degree_level: "Masters",
      deadline: "2027-01-30",
      match_score: 100,
      is_exact: true,
      match_reasons: ["Open to citizens of Liberia", "Fully funded"],
    },
    {
      id: 2,
      name: "DAAD EPOS Masters",
      slug: "daad-epos-masters",
      host_country: "Germany",
      degree_level: "Masters",
      deadline: "2027-02-15",
      match_score: 80,
      is_exact: false,
      match_reasons: ["Graduate level - matches your target"],
    },
  ],
};

function renderQuiz() {
  return render(
    <MemoryRouter>
      <EligibilityCheck />
    </MemoryRouter>,
  );
}

/** Walk the whole quiz, answering the first option of each question. */
async function completeQuiz(user) {
  await user.click(await screen.findByRole("button", { name: /^Undergraduate$/ }));

  await user.type(screen.getByLabelText(/country of citizenship/i), "Liberia");
  await user.click(screen.getByRole("button", { name: /continue/i }));

  await user.click(await screen.findByRole("button", { name: /show me everything/i }));
  await user.click(await screen.findByRole("button", { name: /open to anything/i }));
  await user.click(await screen.findByRole("button", { name: /only fully funded/i }));
  await user.click(await screen.findByRole("button", { name: /do not have one yet/i }));
}

describe("EligibilityCheck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // No AI configured: the whole result must still work.
    assistantApi.status.mockResolvedValue({ enabled: false });
    assessmentApi.count.mockResolvedValue({ total_live: 40, exact_count: 40 });
    assessmentApi.match.mockResolvedValue(MATCH);
  });

  it("shows the size of the live board before anything is answered", async () => {
    renderQuiz();
    expect(await screen.findByText("40")).toBeInTheDocument();
    expect(screen.getByText(/open right now/i)).toBeInTheDocument();
  });

  it("re-counts after each answer so the number narrows as they go", async () => {
    const user = userEvent.setup();
    assessmentApi.count.mockResolvedValueOnce({ total_live: 40, exact_count: 40 });
    assessmentApi.count.mockResolvedValue({ total_live: 40, exact_count: 11 });
    renderQuiz();

    await user.click(await screen.findByRole("button", { name: /^Undergraduate$/ }));

    expect(await screen.findByText("11")).toBeInTheDocument();
    expect(screen.getByText(/of 40 still tick every box/i)).toBeInTheDocument();
  });

  it("ranks real scholarships with the reasons they matched", async () => {
    const user = userEvent.setup();
    renderQuiz();
    await completeQuiz(user);

    expect(await screen.findByText("Chevening Scholarship")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("Open to citizens of Liberia")).toBeInTheDocument();
  });

  it("produces a complete result with no AI narrative available", async () => {
    // The ranking is the product; the written summary is decoration.
    const user = userEvent.setup();
    renderQuiz();
    await completeQuiz(user);

    expect(await screen.findByText(/here's what fits you/i)).toBeInTheDocument();
    expect(assistantApi.assessment).not.toHaveBeenCalled();
  });

  it("re-ranks when one answer is changed, without restarting the quiz", async () => {
    const user = userEvent.setup();
    renderQuiz();
    await completeQuiz(user);
    await screen.findByText("Chevening Scholarship");
    expect(assessmentApi.match).toHaveBeenCalledTimes(1);

    // The refine chips carry each answer; clicking one re-asks only that.
    await user.click(screen.getByRole("button", { name: /Anywhere/ }));
    await user.click(await screen.findByRole("button", { name: /^Europe$/ }));

    await waitFor(() => expect(assessmentApi.match).toHaveBeenCalledTimes(2));
    expect(assessmentApi.match).toHaveBeenLastCalledWith(
      expect.objectContaining({ region: "Europe", citizenship: "Liberia" }),
    );
  });

  it("promises the follow-up emails when the answers were remembered", async () => {
    assessmentApi.match.mockResolvedValue({ ...MATCH, saved_to_profile: true });
    const user = userEvent.setup();
    renderQuiz();
    await completeQuiz(user);

    expect(
      await screen.findByText(/come straight to your inbox/i),
    ).toBeInTheDocument();
  });

  it("promises nothing when there is nowhere to remember the answers", async () => {
    // A signed-in account with no student profile - an admin trying it out.
    // The results are real, so we show them, but we must not offer emails we
    // have no way to send.
    assessmentApi.match.mockResolvedValue({ ...MATCH, saved_to_profile: false });
    const user = userEvent.setup();
    renderQuiz();
    await completeQuiz(user);

    expect(await screen.findByText("Chevening Scholarship")).toBeInTheDocument();
    expect(screen.queryByText(/come straight to your inbox/i)).not.toBeInTheDocument();
    expect(screen.getByText(/won.t be remembered/i)).toBeInTheDocument();
  });

  it("always warns that extracted eligibility is not authoritative", async () => {
    const user = userEvent.setup();
    renderQuiz();
    await completeQuiz(user);
    expect(
      await screen.findByText(/double-check on the official page/i),
    ).toBeInTheDocument();
  });

  it("offers a way forward when nothing matches", async () => {
    assessmentApi.match.mockResolvedValue({
      ...MATCH,
      match_count: 0,
      exact_count: 0,
      results: [],
    });
    const user = userEvent.setup();
    renderQuiz();
    await completeQuiz(user);

    expect(await screen.findByText(/nothing fits this yet/i)).toBeInTheDocument();
    expect(screen.getByText(/see what opens up/i)).toBeInTheDocument();
  });

  it("groups results so each count sits above the listings it counts", async () => {
    // One heading over a mixed list made the number look wrong: it counted
    // the perfect matches while the list below showed the near-misses too.
    const user = userEvent.setup();
    renderQuiz();
    await completeQuiz(user);

    expect(
      await screen.findByText("1 scholarship ticks every box"),
    ).toBeInTheDocument();
    expect(screen.getByText("1 more worth a look")).toBeInTheDocument();
    expect(screen.getByText(/miss something you asked for/i)).toBeInTheDocument();
  });

  it("says nothing about profiles, digests or matchers to the reader", async () => {
    // There is no profile page to send anyone to, and the machinery is not
    // the reader's problem - the copy should promise an outcome instead.
    const user = userEvent.setup();
    renderQuiz();
    await completeQuiz(user);
    await screen.findByText("Chevening Scholarship");

    const text = document.body.textContent;
    expect(text).not.toMatch(/profile|digest|matcher|algorithm|ranked by/i);
  });
});
