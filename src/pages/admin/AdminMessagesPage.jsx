import React, { useState } from "react";

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
 * Super-admin message centre. Incoming contact-form messages arrive here (and
 * in the myScholy inbox); replies and new messages are sent by the backend
 * from the myScholy address, so no personal account is ever the sender.
 */

const DEFAULT_REPLY_SUBJECT = "Re: your message to myScholy";

function ReplyForm({ message, onSent }) {
  const [subject, setSubject] = useState(DEFAULT_REPLY_SUBJECT);
  const [body, setBody] = useState("");
  const send = useMutation((payload) => adminApi.replyToContact(message.id, payload));

  const submit = async (event) => {
    event.preventDefault();
    const result = await send.mutate({ subject, body });
    if (result.ok) {
      setBody("");
      onSent();
    }
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 border-t border-ink-200/70 pt-4">
      {send.error && <Alert tone="error">{send.error.message}</Alert>}
      <TextField
        label="Subject"
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
        required
      />
      <TextAreaField
        label={`Reply to ${message.email}`}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={4}
        placeholder="Write your reply..."
        required
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={send.isPending || !body.trim()}>
          {send.isPending ? "Sending..." : "Send reply"}
        </Button>
      </div>
    </form>
  );
}

function InboxMessage({ message, onChanged }) {
  const [replying, setReplying] = useState(false);
  const toggle = useMutation(() =>
    adminApi.setContactHandled(message.id, !message.is_handled),
  );

  return (
    <Card>
      <CardBody>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-ink-900">{message.name}</p>
            <p className="text-sm text-ink-500">
              {message.email} · {formatDate(message.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={message.is_handled ? "success" : "gold"}>
              {message.is_handled ? "Handled" : "Open"}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              disabled={toggle.isPending}
              onClick={async () => {
                const result = await toggle.mutate();
                if (result.ok) onChanged();
              }}
            >
              {message.is_handled ? "Reopen" : "Mark handled"}
            </Button>
            <Button size="sm" onClick={() => setReplying((value) => !value)}>
              {replying ? "Close" : "Reply"}
            </Button>
          </div>
        </div>

        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-700">
          {message.message}
        </p>

        {message.replies?.length > 0 && (
          <div className="mt-4 space-y-2">
            {message.replies.map((reply) => (
              <div
                key={reply.id}
                className="rounded-lg border border-ink-200/70 bg-ink-50/60 px-3.5 py-2.5"
              >
                <p className="text-xs font-medium text-ink-500">
                  Replied {formatDate(reply.created_at)}
                  {reply.sent_by ? ` by ${reply.sent_by}` : ""} — {reply.subject}
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-ink-700">
                  {reply.body}
                </p>
              </div>
            ))}
          </div>
        )}

        {replying && (
          <ReplyForm
            message={message}
            onSent={() => {
              setReplying(false);
              onChanged();
            }}
          />
        )}
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
        {send.error && <Alert tone="error" className="mb-3">{send.error.message}</Alert>}
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
            <p className="mt-2 whitespace-pre-line text-sm text-ink-700">{row.body}</p>
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
      adminApi.contactMessages({ page: page > 1 ? page : undefined }, { signal }),
    [page],
    { keepPreviousData: true, refetchOnFocus: true },
  );

  return (
    <Page>
      <PageHeader
        back={{ to: "/admin", label: "Dashboard" }}
        title="Messages"
        description="Contact-form messages arrive here and in the myScholy inbox. Replies and new messages send from the myScholy address."
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
        <div className="space-y-4">
          {inbox.data.results.map((message) => (
            <InboxMessage key={message.id} message={message} onChanged={inbox.refetch} />
          ))}
          <Pagination
            page={inbox.data.page}
            totalPages={inbox.data.total_pages}
            onChange={setPage}
          />
        </div>
      )}
    </Page>
  );
}
