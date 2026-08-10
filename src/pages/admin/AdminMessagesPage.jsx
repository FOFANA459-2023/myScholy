import React, { useState } from "react";
import { Link } from "react-router";

import { Page, PageHeader } from "../../components/layout/SiteLayout.jsx";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  ErrorState,
  Pagination,
  SkeletonGrid,
  TextAreaField,
  TextField,
} from "../../components/ui/index.js";
import { admin as adminApi } from "../../lib/api/endpoints.js";
import { formatDate } from "../../lib/format.js";
import { useApi, useMutation } from "../../lib/hooks.js";

/**
 * Super-admin message centre, laid out like an email client: the inbox shows
 * one row per sender with their latest message, and clicking a row opens the
 * full thread on its own page (AdminConversationPage) where replies are sent
 * from the myScholy address.
 */

function ConversationRow({ conversation }) {
  return (
    <Card interactive className="group relative transition-colors hover:bg-brand-50/40">
      <CardBody className="py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-semibold text-ink-900">
            {/* Stretched link: the whole stacked row opens the thread. */}
            <Link
              to={`/admin/messages/${encodeURIComponent(conversation.email)}`}
              className="rounded after:absolute after:inset-0 after:content-[''] group-hover:text-brand-800"
            >
              {conversation.name}
            </Link>
          </p>
          <p className="text-xs text-ink-500">{formatDate(conversation.last_at)}</p>
        </div>
        <p className="mt-0.5 text-sm text-ink-500">{conversation.email}</p>
        <p className="mt-2 line-clamp-2 whitespace-pre-line text-sm text-ink-700">
          {conversation.last_message}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Badge tone={conversation.open_count > 0 ? "gold" : "success"}>
            {conversation.open_count > 0
              ? `${conversation.open_count} open`
              : "Handled"}
          </Badge>
          <span className="text-xs text-ink-400">
            {conversation.total} message{conversation.total === 1 ? "" : "s"}
            {conversation.reply_count > 0
              ? ` · ${conversation.reply_count} repl${
                  conversation.reply_count === 1 ? "y" : "ies"
                }`
              : ""}
          </span>
        </div>
      </CardBody>
    </Card>
  );
}

function ComposeForm({ onSent }) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sentTo, setSentTo] = useState("");
  const send = useMutation((payload) => adminApi.sendMessage(payload));

  const submit = async (event) => {
    event.preventDefault();
    const result = await send.mutate({ to_email: to, subject, body });
    if (result.ok) {
      setSentTo(to);
      setTo("");
      setSubject("");
      setBody("");
      onSent();
    }
  };

  return (
    <Card className="mb-6">
      <CardBody>
        <h2 className="mb-3 text-base font-semibold text-ink-900">New message</h2>
        {send.error && (
          <Alert tone="error" className="mb-3">
            {send.error.message}
          </Alert>
        )}
        {sentTo && !send.error && (
          <Alert tone="success" className="mb-3">
            Message sent to {sentTo} from the myScholy address.
          </Alert>
        )}
        <form onSubmit={submit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="To"
              type="email"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              placeholder="student@example.com"
              error={send.error?.fieldErrors?.to_email}
              required
            />
            <TextField
              label="Subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              error={send.error?.fieldErrors?.subject}
              required
            />
          </div>
          <TextAreaField
            label="Message"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={5}
            error={send.error?.fieldErrors?.body}
            required
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={send.isPending}>
              {send.isPending ? "Sending..." : "Send from myScholy"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

function SentList() {
  const [page, setPage] = useState(1);
  const sent = useApi(
    ({ signal }) =>
      adminApi.sentMessages({ page: page > 1 ? page : undefined }, { signal }),
    [page],
    { keepPreviousData: true },
  );

  if (sent.isLoading) return <SkeletonGrid count={3} />;
  if (sent.error) return <ErrorState error={sent.error} onRetry={sent.refetch} />;
  if (!sent.data?.results?.length) {
    return (
      <EmptyState
        title="Nothing sent yet"
        description="Replies and composed messages will appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      {sent.data.results.map((row) => (
        <Card key={row.id}>
          <CardBody>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold text-ink-900">{row.subject}</p>
              <p className="text-xs text-ink-500">{formatDate(row.created_at)}</p>
            </div>
            <p className="mt-0.5 text-sm text-ink-500">
              To {row.to_email}
              {row.sent_by ? ` · sent by ${row.sent_by}` : ""}
            </p>
            <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-ink-700">
              {row.body}
            </p>
          </CardBody>
        </Card>
      ))}
      <Pagination
        page={sent.data.page}
        totalPages={sent.data.total_pages}
        onChange={setPage}
      />
    </div>
  );
}

export default function AdminMessagesPage() {
  const [tab, setTab] = useState("inbox");
  const [composing, setComposing] = useState(false);
  const [page, setPage] = useState(1);

  const inbox = useApi(
    ({ signal }) =>
      adminApi.conversations({ page: page > 1 ? page : undefined }, { signal }),
    [page],
    { keepPreviousData: true, refetchOnFocus: true },
  );

  return (
    <Page>
      <PageHeader
        back={{ to: "/admin", label: "Dashboard" }}
        title="Messages"
        description="One row per sender, like an inbox - open a thread to read the full exchange and reply from the myScholy address."
        actions={
          <Button onClick={() => setComposing((value) => !value)}>
            {composing ? "Close composer" : "New message"}
          </Button>
        }
      />

      {composing && <ComposeForm onSent={inbox.refetch} />}

      <div className="mb-5 flex gap-2">
        <Button
          size="sm"
          variant={tab === "inbox" ? "primary" : "outline"}
          onClick={() => setTab("inbox")}
        >
          Inbox
        </Button>
        <Button
          size="sm"
          variant={tab === "sent" ? "primary" : "outline"}
          onClick={() => setTab("sent")}
        >
          Sent
        </Button>
      </div>

      {tab === "sent" ? (
        <SentList />
      ) : inbox.isLoading ? (
        <SkeletonGrid count={3} />
      ) : inbox.error ? (
        <ErrorState error={inbox.error} onRetry={inbox.refetch} />
      ) : !inbox.data?.results?.length ? (
        <EmptyState
          title="No messages yet"
          description="Messages from the contact form will appear here."
        />
      ) : (
        <div className="space-y-3">
          {inbox.data.results.map((conversation) => (
            <ConversationRow key={conversation.email} conversation={conversation} />
          ))}
          <Pagination
            className="mt-6"
            page={inbox.data.page}
            totalPages={inbox.data.total_pages}
            onChange={setPage}
          />
        </div>
      )}
    </Page>
  );
}
