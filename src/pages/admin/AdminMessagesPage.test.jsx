import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import AdminMessagesPage from "./AdminMessagesPage.jsx";
import { admin } from "../../lib/api/endpoints.js";

vi.mock("../../lib/api/endpoints.js", () => ({
  admin: {
    conversations: vi.fn(),
    conversation: vi.fn(),
    replyToConversation: vi.fn(),
    setConversationHandled: vi.fn(),
    sentMessages: vi.fn(),
    sendMessage: vi.fn(),
  },
}));

const INBOX = {
  count: 1,
  page: 1,
  total_pages: 1,
  results: [
    {
      email: "ama@example.com",
      name: "Ama",
      last_message: "Second question - this is the newest message from Ama.",
      last_at: "2026-08-10T10:00:00Z",
      total: 2,
      open_count: 1,
      reply_count: 1,
    },
  ],
};

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminMessagesPage />
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("AdminMessagesPage", () => {
  it("shows one clickable row per sender with the latest message", async () => {
    admin.conversations.mockResolvedValue(INBOX);

    renderPage();
    const link = await screen.findByRole("link", { name: "Ama" });
    expect(link).toHaveAttribute("href", "/admin/messages/ama%40example.com");
    expect(screen.getByText(/newest message from Ama/)).toBeInTheDocument();
    expect(screen.getByText("1 open")).toBeInTheDocument();
    expect(screen.getByText(/2 messages · 1 reply/)).toBeInTheDocument();
  });

  it("composes a new message through the send API", async () => {
    admin.conversations.mockResolvedValue({
      count: 0,
      page: 1,
      total_pages: 0,
      results: [],
    });
    admin.sendMessage.mockResolvedValue({ id: 2 });

    renderPage();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /new message/i }));
    await user.type(screen.getByLabelText(/to/i), "partner@example.com");
    await user.type(screen.getByLabelText(/subject/i), "Partnership");
    await user.type(screen.getByLabelText(/^message/i), "Hello from myScholy.");
    await user.click(screen.getByRole("button", { name: /send from myscholy/i }));

    expect(admin.sendMessage).toHaveBeenCalledWith({
      to_email: "partner@example.com",
      subject: "Partnership",
      body: "Hello from myScholy.",
    });
    expect(
      await screen.findByText(/sent to partner@example.com/i),
    ).toBeInTheDocument();
  });
});
