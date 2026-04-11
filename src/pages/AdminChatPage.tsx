import { useEffect, useMemo, useState } from "react";
import { ChatThreadPanel } from "../components/chat/ChatThreadPanel";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/AsyncState";
import { Button } from "../components/ui/Button";
import { useChatRealtime } from "../context/ChatRealtimeContext";
import {
  getAdminChatThreadDetail,
  getAdminChatThreads,
  updateAdminChatThreadStatus,
} from "../services/chatApi";
import { sendChatMessage } from "../services/chatApi";
import type { ChatThreadDetail, ChatThreadSummary } from "../types/domain";
import { applyIncomingMessage, applyThreadUpdate, upsertThread } from "../utils/chat";

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Draft";
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(parsed));
}

export function AdminChatPage() {
  const { connectionState, sendMessage, subscribe } = useChatRealtime();
  const [threads, setThreads] = useState<ChatThreadSummary[] | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedThreadDetail, setSelectedThreadDetail] = useState<ChatThreadDetail | null>(null);
  const [error, setError] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [sending, setSending] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [socketError, setSocketError] = useState("");

  useEffect(() => {
    getAdminChatThreads()
      .then((nextThreads) => {
        setThreads(nextThreads);
        setSelectedThreadId((current) => current ?? nextThreads[0]?.id ?? null);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    if (!selectedThreadId) {
      setSelectedThreadDetail(null);
      return;
    }

    setLoadingDetail(true);
    getAdminChatThreadDetail(selectedThreadId)
      .then((detail) => setSelectedThreadDetail(detail))
      .finally(() => setLoadingDetail(false));
  }, [selectedThreadId]);

  useEffect(() => subscribe((event) => {
    if (event.type === "ERROR") {
      setSocketError(event.payload.message);
      return;
    }

    if (event.type === "CHAT_THREAD_UPDATED") {
      setThreads((current) => upsertThread(current ?? [], event.payload.thread));
      setSelectedThreadDetail((current) => applyThreadUpdate(current, event.payload.thread));
      setSelectedThreadId((current) => current ?? event.payload.thread.id);
      return;
    }

    if (event.type === "CHAT_MESSAGE_CREATED") {
      setThreads((current) => upsertThread(current ?? [], event.payload.thread));
      setSelectedThreadDetail((current) =>
        applyIncomingMessage(current, event.payload.thread, event.payload.message),
      );
      setSelectedThreadId((current) => current ?? event.payload.thread.id);
    }
  }), [subscribe]);

  const selectedThread = useMemo(
    () => threads?.find((thread) => thread.id === selectedThreadId) ?? selectedThreadDetail?.thread ?? null,
    [selectedThreadDetail?.thread, selectedThreadId, threads],
  );

  const openCount = threads?.filter((thread) => thread.status === "OPEN").length ?? 0;
  const waitingOnAdminCount = threads?.filter((thread) => thread.lastMessageSenderRole === "customer").length ?? 0;
  const closedCount = threads?.filter((thread) => thread.status === "CLOSED").length ?? 0;

  async function handleSend(body: string) {
    if (!selectedThread) {
      throw new Error("Select a thread before replying.");
    }

    setSocketError("");
    setSending(true);
    try {
      const sentOverSocket = sendMessage(selectedThread.id, body);
      if (!sentOverSocket) {
        const createdMessage = await sendChatMessage(selectedThread.id, body);
        const nextThread: ChatThreadSummary = {
          ...selectedThread,
          status: "OPEN",
          updatedAt: createdMessage.createdAt,
          lastMessageAt: createdMessage.createdAt,
          lastMessagePreview: createdMessage.body,
          lastMessageSenderRole: "admin",
        };
        setThreads((current) => upsertThread(current ?? [], nextThread));
        setSelectedThreadDetail((current) => ({
          thread: nextThread,
          messages: [...(current?.messages ?? []), createdMessage],
        }));
      }
    } finally {
      setSending(false);
    }
  }

  async function handleToggleStatus() {
    if (!selectedThread) {
      return;
    }

    setSavingStatus(true);
    try {
      const nextStatus = selectedThread.status === "OPEN" ? "CLOSED" : "OPEN";
      const updatedThread = await updateAdminChatThreadStatus(selectedThread.id, nextStatus);
      setThreads((current) => upsertThread(current ?? [], updatedThread));
      setSelectedThreadDetail((current) => applyThreadUpdate(current, updatedThread));
    } finally {
      setSavingStatus(false);
    }
  }

  if (error) {
    return <ErrorState title="Inbox unavailable" body="Unable to load support threads right now." />;
  }

  if (!threads) {
    return <LoadingState label="Loading support inbox…" />;
  }

  return (
    <div className="page-fade space-y-8">
      <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-['Manrope'] text-4xl font-extrabold tracking-[-0.05em]">
            Support Inbox
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--color-muted)]">
            Monitor customer conversations, reply in real time, and close threads when
            the request is resolved.
          </p>
        </div>
        <div className="rounded-sm bg-[var(--color-surface-low)] px-5 py-4 text-sm text-[var(--color-muted)] ghost-border">
          Socket status: {connectionState}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-sm bg-[var(--color-card)] p-6 ambient-shadow ghost-border">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Open threads</p>
          <p className="mt-3 font-['Manrope'] text-3xl font-bold tracking-[-0.04em]">{openCount}</p>
        </div>
        <div className="rounded-sm bg-[var(--color-card)] p-6 ambient-shadow ghost-border">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Waiting on admin</p>
          <p className="mt-3 font-['Manrope'] text-3xl font-bold tracking-[-0.04em]">{waitingOnAdminCount}</p>
        </div>
        <div className="rounded-sm bg-[var(--color-card)] p-6 ambient-shadow ghost-border">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Closed threads</p>
          <p className="mt-3 font-['Manrope'] text-3xl font-bold tracking-[-0.04em]">{closedCount}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="rounded-md bg-[var(--color-surface-low)] p-5 border border-[var(--color-outline)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
            All threads
          </p>
          <div className="mt-5 space-y-3">
            {threads.length ? threads.map((thread) => {
              const active = thread.id === selectedThreadId;
              const needsReply = thread.lastMessageSenderRole === "customer";
              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={[
                    "w-full rounded-sm px-4 py-4 text-left transition",
                    active
                      ? "bg-[var(--color-card)] ambient-shadow ghost-border"
                      : "bg-[var(--color-surface-highest)] hover:bg-[var(--color-card)] ghost-border border-transparent",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                        {thread.customerName}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        {thread.productName ?? "General support"}
                      </p>
                    </div>
                    <span className={[
                      "rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
                      needsReply
                        ? "bg-[rgba(46,125,50,0.12)] text-[#216e39]"
                        : "bg-[var(--color-surface-high)] text-[var(--color-muted)]",
                    ].join(" ")}>
                      {needsReply ? "Needs reply" : thread.status}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--color-muted)]">
                    {thread.lastMessagePreview ?? "No messages yet."}
                  </p>
                  <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                    {formatTimestamp(thread.lastMessageAt ?? thread.createdAt)}
                  </p>
                </button>
              );
            }) : (
              <EmptyState
                title="No support threads"
                body="Customer conversations will appear here as soon as someone starts a chat."
              />
            )}
          </div>
        </aside>

        <div>
          {loadingDetail && selectedThreadId ? (
            <LoadingState label="Opening support thread…" />
          ) : selectedThread ? (
            <ChatThreadPanel
              heading="Customer Conversation"
              description={`Reply to ${selectedThread.customerName} in real time. Product context and customer identity stay attached to the same thread.`}
              thread={selectedThreadDetail?.thread ?? selectedThread}
              messages={selectedThreadDetail?.messages ?? []}
              onSend={handleSend}
              sending={sending}
              connectionState={connectionState}
              emptyTitle="Choose a thread from the inbox"
              emptyBody="Messages will render here once you open a conversation."
              footerAction={(
                <Button variant="secondary" onClick={() => void handleToggleStatus()} disabled={savingStatus}>
                  {savingStatus
                    ? "Saving…"
                    : selectedThread.status === "OPEN"
                      ? "Close thread"
                      : "Reopen thread"}
                </Button>
              )}
            />
          ) : (
            <EmptyState
              title="No thread selected"
              body="Choose a customer conversation from the inbox to review the full message history."
            />
          )}
          {socketError ? (
            <p className="mt-4 text-sm text-[var(--color-error)]">{socketError}</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
