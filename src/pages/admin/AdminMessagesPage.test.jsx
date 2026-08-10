import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import AdminMessagesPage from "./AdminMessagesPage.jsx";
import { admin } from "../../lib/api/endpoints.js";

vi.mock("../../lib/api/endpoints.js", () => ({
  admin: {
    contactMessages: vi.fn(),
    setContactHandled: vi.fn(),
    replyToContact: vi.fn(),
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
      id: 7,
      name: "Ama",
      email: "ama@example.com",
      message: "How do I apply for DAAD?",
      created_at: "2026-08-10T10:00:00Z",
      is_handled: false,
      replies: [],
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
  it("lists inbox messages and sends a reply", async () => {
    admin.contactMessages.mockResolvedValue(INBOX);
    admin.replyToContact.mockResolvedValue({ id: 1 });

    renderPage();
    expect(await screen.findByText("Ama")).toBeInTheDocument();
    expect(screen.getByText(/How do I apply for DAAD/)).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /^reply$/i }));
    await user.type(
      screen.getByPlaceholderText(/write your reply/i),
      "Start at the DAAD page.",
    );
    await user.click(screen.getByRole("button", { name: /send reply/i }));

    expect(admin.replyToContact).toHaveBeenCalledWith(7, {
      subject: "Re: your message to myScholy",
      body: "Start at the DAAD page.",
    });
  });

  it("composes a new message through the send API", async () => {
    admin.contactMessages.mockResolvedValue({
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
