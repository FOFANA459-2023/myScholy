import React, { useState } from "react";
import { useParams } from "react-router";

import { Page, PageHeader } from "../../components/layout/SiteLayout.jsx";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  ErrorState,
  SkeletonGrid,
  TextAreaField,
  TextField,
} from "../../components/ui/index.js";
import { admin as adminApi } from "../../lib/api/endpoints.js";
import { formatDate } from "../../lib/format.js";
import { useApi, useMutation } from "../../lib/hooks.js";
import { cn } from "../../lib/cn.js";

/**
 * One sender's thread, oldest first, like an open email. Student messages sit
 * on the left in plain cards; replies sent from the myScholy address sit on
 * the right in brand-tinted cards, so who-said-what reads at a glance.
 */

function ThreadItem({ item }) {
  const isReply = item.direction === "out";
  return (
    <div className={cn("flex", isReply ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl border px-4 py-3 sm:max-w-[75%]",
          isReply
            ? "rounded-br-md border-brand-200 bg-brand-50 text-brand-950"
            : "rounded-bl-md border-ink-200 bg-white text-ink-800",
        )}
      >
        <p
          className={cn(
            "text-xs font-medium",
            isReply ? "text-brand-700" : "text-ink-500",
          )}
        >
          {isReply
            ? `myScholy${item.sent_by ? ` (${item.sent_by})` : ""}`
            : item.name}
          {" · "}
          {formatDate(item.created_at)}
        </p>
        {isReply && item.subject ? (
          <p className="mt-1 text-xs text-brand-600">{item.subject}</p>
        ) : null}
        <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed">
          {item.body}
        </p>
      </div>
    </div>
  );
}

export default function AdminConversationPage() {
  const { email } = useParams();
  const thread = useApi(
    ({ signal }) => adminApi.conversation(email, { signal }),
    [email],
  );

  const [subject, setSubject] = useState("Re: your message to myScholy");
  const [body, setBody] = useState("");
  const [justSent, setJustSent] = useState(false);
  const send = useMutation((payload) => adminApi.replyToConversation(email, payload));
  const toggle = useMutation(() =>
    adminApi.setConversationHandled(email, thread.data?.open_count > 0),
  );

  const submitReply = async (event) => {
    event.preventDefault();
    const result = await send.mutate({ subject, body });
    if (result.ok) {
      setBody("");
      setJustSent(true);
      thread.refetch();
    }
  };

  return (
    <Page width="narrow">
      <PageHeader
        back={{ to: "/admin/messages", label: "All messages" }}
        title={thread.data?.name || decodeURIComponent(email)}
        description={thread.data ? `Conversation with ${thread.data.email}` : ""}
        actions={
          thread.data && (
            <div className="flex items-center gap-2">
              <Badge tone={thread.data.open_count > 0 ? "gold" : "success"}>
                {thread.data.open_count > 0
                  ? `${thread.data.open_count} open`
                  : "Handled"}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                disabled={toggle.isPending}
                onClick={async () => {
                  const result = await toggle.mutate();
                  if (result.ok) thread.refetch();
                }}
              >
                {thread.data.open_count > 0 ? "Mark handled" : "Reopen"}
              </Button>
            </div>
          )
        }
      />

      {thread.isLoading ? (
        <SkeletonGrid count={3} />
      ) : thread.error ? (
        <ErrorState
          error={
            thread.error.status === 404
              ? { message: "No conversation exists with this address." }
              : thread.error
          }
          onRetry={thread.error.status === 404 ? undefined : thread.refetch}
        />
      ) : (
        <>
          <div className="space-y-4">
            {thread.data.items.map((item) => (
              <ThreadItem key={`${item.direction}-${item.id}`} item={item} />
            ))}
          </div>

          <Card className="mt-8">
            <CardBody>
              <h2 className="mb-3 text-base font-semibold text-ink-900">
                Reply as myScholy
              </h2>
              {send.error && (
                <Alert tone="error" className="mb-3">
                  {send.error.message}
                </Alert>
              )}
              {justSent && !send.error && (
                <Alert tone="success" className="mb-3">
                  Reply sent from the myScholy address.
                </Alert>
              )}
              <form onSubmit={submitReply} className="space-y-3">
                <TextField
                  label="Subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  required
                />
                <TextAreaField
                  label={`Reply to ${thread.data.email}`}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  rows={5}
                  placeholder="Write your reply..."
                  required
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={send.isPending || !body.trim()}>
                    {send.isPending ? "Sending..." : "Send reply"}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </>
      )}
    </Page>
  );
}
