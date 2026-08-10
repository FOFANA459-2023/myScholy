import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import AdminConversationPage from "./AdminConversationPage.jsx";
import { admin } from "../../lib/api/endpoints.js";

vi.mock("../../lib/api/endpoints.js", () => ({
  admin: {
    conversation: vi.fn(),
    replyToConversation: vi.fn(),
    setConversationHandled: vi.fn(),
  },
}));

const THREAD = {
  email: "ama@example.com",
  name: "Ama",
  open_count: 1,
  items: [
    {
      direction: "in",
      id: 1,
      name: "Ama",
      body: "How do I apply for DAAD?",
      created_at: "2026-08-09T10:00:00Z",
      is_handled: true,
    },
    {
      direction: "out",
      id: 1,
      subject: "Re: your message to myScholy",
      body: "Start at the DAAD page on our board.",
      created_at: "2026-08-09T12:00:00Z",
      sent_by: "root",
    },
    {
      direction: "in",
      id: 2,
      name: "Ama",
      body: "Thanks! One more question.",
      created_at: "2026-08-10T09:00:00Z",
      is_handled: false,
    },
  ],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/admin/messages/ama%40example.com"]}>
      <Routes>
        <Route path="/admin/messages/:email" element={<AdminConversationPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("AdminConversationPage", () => {
  it("renders the whole exchange with student and myScholy sides distinguished", async () => {
    admin.conversation.mockResolvedValue(THREAD);

    renderPage();
    expect(await screen.findByText("How do I apply for DAAD?")).toBeInTheDocument();
    expect(screen.getByText("Start at the DAAD page on our board.")).toBeInTheDocument();
    expect(screen.getByText("Thanks! One more question.")).toBeInTheDocument();
    // The reply is attributed to myScholy (with the sender), not the student.
    expect(screen.getByText(/myScholy \(root\)/)).toBeInTheDocument();
    expect(screen.getByText("1 open")).toBeInTheDocument();
  });

  it("sends a reply to the conversation and refreshes the thread", async () => {
    admin.conversation.mockResolvedValue(THREAD);
    admin.replyToConversation.mockResolvedValue({ id: 9 });

    renderPage();
    await screen.findByText("How do I apply for DAAD?");

    const user = userEvent.setup();
    await user.type(
      screen.getByPlaceholderText(/write your reply/i),
      "Ask away!",
    );
    await user.click(screen.getByRole("button", { name: /send reply/i }));

    expect(admin.replyToConversation).toHaveBeenCalledWith("ama@example.com", {
      subject: "Re: your message to myScholy",
      body: "Ask away!",
    });
    expect(
      await screen.findByText(/reply sent from the myScholy address/i),
    ).toBeInTheDocument();
  });
});
