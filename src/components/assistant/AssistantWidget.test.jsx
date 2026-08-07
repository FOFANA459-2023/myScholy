import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import AssistantWidget from "./AssistantWidget.jsx";
import { assistant } from "../../lib/api/endpoints.js";

vi.mock("../../lib/api/endpoints.js", () => ({
  assistant: {
    status: vi.fn(),
    chat: vi.fn(),
  },
}));

afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

describe("AssistantWidget", () => {
  it("renders nothing while the backend reports the assistant disabled", async () => {
    assistant.status.mockResolvedValue({ enabled: false });
    const { container } = render(<AssistantWidget />);
    await waitFor(() => expect(assistant.status).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the launcher when enabled and answers through the chat API", async () => {
    assistant.status.mockResolvedValue({ enabled: true });
    assistant.chat.mockResolvedValue({ reply: "Browse /scholarships for that." });

    render(<AssistantWidget />);
    const launcher = await screen.findByRole("button", {
      name: /open myscholy assistant/i,
    });

    const user = userEvent.setup();
    await user.click(launcher);
    expect(screen.getByRole("dialog", { name: /myscholy assistant/i })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/type your question/i), "Any UK awards?");
    await user.click(screen.getByRole("button", { name: /^send$/i }));

    expect(await screen.findByText("Browse /scholarships for that.")).toBeInTheDocument();
    expect(assistant.chat).toHaveBeenCalledWith(
      "Any UK awards?",
      expect.arrayContaining([expect.objectContaining({ role: "model" })]),
    );
  });

  it("never auto-opens again once dismissed", async () => {
    localStorage.setItem("myscholy-assistant-dismissed", "1");
    assistant.status.mockResolvedValue({ enabled: true });

    render(<AssistantWidget />);
    await screen.findByRole("button", { name: /open myscholy assistant/i });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
