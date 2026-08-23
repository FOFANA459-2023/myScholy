import { render, screen, within } from "@testing-library/react";
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
    deleteConversation: vi.fn(),
    sentMessages: vi.fn(),
    sendMessage: vi.fn(),
    messageAudiences: vi.fn(),
  },
}));

const AUDIENCES = [
  {
    value: "students",
    label: "All students",
    description: "Everyone with a student account.",
    count: 42,
  },
  {
    value: "admins",
    label: "All admins",
    description: "Administrators and super admins.",
    count: 3,
  },
  {
    value: "everyone",
    label: "Everyone",
    description: "Every active account with an email address.",
    count: 45,
  },
];

const INBOX = {
  count: 1,
  page: 1,
  total_pages: 1,
  results: [
    {
      email: "ama@example.com",
      name: "Ama",
      last_subject: "Question about DAAD",
      last_message: "Second question - this is the newest message from Ama.",
      last_at: "2026-08-10T10:00:00Z",
      total: 2,
      open_count: 1,
      reply_count: 1,
    },
  ],
};

const EMPTY_INBOX = { count: 0, page: 1, total_pages: 0, results: [] };

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
    expect(screen.getByText("Question about DAAD")).toBeInTheDocument();
    expect(screen.getByText(/newest message from Ama/)).toBeInTheDocument();
    expect(screen.getByText("1 open")).toBeInTheDocument();
    expect(screen.getByText(/2 messages · 1 reply/)).toBeInTheDocument();
  });

  it("composes a message to one address through the send API", async () => {
    admin.conversations.mockResolvedValue(EMPTY_INBOX);
    admin.messageAudiences.mockResolvedValue(AUDIENCES);
    admin.sendMessage.mockResolvedValue({ id: 2, recipient_count: 1 });

    renderPage();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /new message/i }));

    // A typed address is offered as its own option and has to be chosen, so a
    // half-typed recipient can never be sent to.
    await user.type(screen.getByLabelText(/^to/i), "partner@example.com");
    await user.click(
      await screen.findByRole("option", { name: /send to partner@example\.com/i }),
    );

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

  it("filters recipient groups as you type and broadcasts to the chosen one", async () => {
    admin.conversations.mockResolvedValue(EMPTY_INBOX);
    admin.messageAudiences.mockResolvedValue(AUDIENCES);
    admin.sendMessage.mockResolvedValue({ id: 3, recipient_count: 42 });

    renderPage();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /new message/i }));

    await user.type(screen.getByLabelText(/^to/i), "stu");
    // Typing narrows to the matching group; the others drop out.
    expect(
      await screen.findByRole("option", { name: /all students/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /all admins/i })).toBeNull();

    await user.click(screen.getByRole("option", { name: /all students/i }));
    await user.type(screen.getByLabelText(/subject/i), "Deadline reminder");
    await user.type(screen.getByLabelText(/^message/i), "Three awards close Friday.");
    await user.click(screen.getByRole("button", { name: /send to all students/i }));

    // A group send is confirmed first - it cannot be unsent.
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(/42 people/i);
    expect(dialog).toHaveTextContent(/own copy/i);
    await user.click(within(dialog).getByRole("button", { name: /send to 42/i }));

    expect(admin.sendMessage).toHaveBeenCalledWith({
      audience: "students",
      subject: "Deadline reminder",
      body: "Three awards close Friday.",
    });
    expect(await screen.findByText(/42 people/i)).toBeInTheDocument();
  });

  it("deletes a sender's messages after confirming", async () => {
    admin.conversations.mockResolvedValue(INBOX);
    admin.deleteConversation.mockResolvedValue(undefined);

    renderPage();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /^delete$/i }));

    // The confirmation dialog names the address and warns about permanence.
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("ama@example.com");
    expect(dialog).toHaveTextContent(/cannot be undone/i);

    await user.click(within(dialog).getByRole("button", { name: /^delete$/i }));

    expect(admin.deleteConversation).toHaveBeenCalledWith("ama@example.com");
    expect(
      await screen.findByText(/messages from ama@example.com were deleted/i),
    ).toBeInTheDocument();
  });
});
