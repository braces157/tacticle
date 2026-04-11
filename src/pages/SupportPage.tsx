import { useEffect, useMemo, useState } from "react";
import { ChatThreadPanel } from "../components/chat/ChatThreadPanel";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/AsyncState";
import { Button } from "../components/ui/Button";
import { useChatRealtime } from "../context/ChatRealtimeContext";
import {
  createChatThread,
  getChatThreadDetail,
  getChatThreads,
  sendChatMessage,
} from "../services/chatApi";
import type { ChatThreadDetail, ChatThreadSummary } from "../types/domain";
import { applyIncomingMessage, applyThreadUpdate, upsertThread } from "../utils/chat";

function formatThreadDate(value: string | null) {
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

function buildLocalThreadState(
  thread: ChatThreadSummary,
  body: string,
  createdAt = new Date().toISOString(),
): ChatThreadDetail {
  return {
    thread: {
      ...thread,
      status: "OPEN",
      updatedAt: createdAt,
      lastMessageAt: createdAt,
      lastMessagePreview: body,
      lastMessageSenderRole: "customer",
    },
    messages: [],
  };
}

export function SupportPage() {
  const { connectionState, sendMessage, subscribe } = useChatRealtime();
  const [threads, setThreads] = useState<ChatThreadSummary[] | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedThreadDetail, setSelectedThreadDetail] = useState<ChatThreadDetail | null>(null);
  const [error, setError] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [creatingThread, setCreatingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [socketError, setSocketError] = useState("");

  useEffect(() => {
    getChatThreads()
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
    getChatThreadDetail(selectedThreadId)
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

  async function ensureGeneralThread() {
    const existingThread = selectedThreadDetail?.thread ?? selectedThread;
    if (existingThread) {
      return existingThread;
    }

    const thread = await createChatThread({ subject: "General support" });
    setThreads((current) => upsertThread(current ?? [], thread));
    setSelectedThreadId(thread.id);
    setSelectedThreadDetail({ thread, messages: [] });
    return thread;
  }

  async function handleCreateThread() {
    setCreatingThread(true);
    try {
      const thread = await createChatThread({ subject: "General support" });
      setThreads((current) => upsertThread(current ?? [], thread));
      setSelectedThreadId(thread.id);
      setSelectedThreadDetail({ thread, messages: [] });
    } finally {
      setCreatingThread(false);
    }
  }

  async function handleSend(body: string) {
    setSocketError("");
    setSending(true);
    try {
      const activeThread = await ensureGeneralThread();
      const sentOverSocket = sendMessage(activeThread.id, body);
      if (!sentOverSocket) {
        const createdMessage = await sendChatMessage(activeThread.id, body);
        const nextDetail = buildLocalThreadState(activeThread, body, createdMessage.createdAt);
        setThreads((current) => upsertThread(current ?? [], nextDetail.thread));
        setSelectedThreadDetail((current) => ({
          thread: nextDetail.thread,
          messages: [...(current?.messages ?? []), createdMessage],
        }));
      }
    } finally {
      setSending(false);
    }
  }

  if (error) {
    return <ErrorState title="Support unavailable" body="Unable to load your support threads right now." />;
  }

  if (!threads) {
    return <LoadingState label="Loading support threads…" />;
  }

  return (
    <div className="page-fade space-y-8">
      <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-['Manrope'] text-4xl font-extrabold tracking-[-0.05em]">
            Support Chat
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--color-muted)]">
            Reach the admin team for product questions, shipping checks, and anything
            else tied to your account. Product-specific conversations appear here too.
          </p>
        </div>
        <Button onClick={() => void handleCreateThread()} disabled={creatingThread}>
          {creatingThread ? "Opening…" : "Start general chat"}
        </Button>
      </section>

      <section className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="rounded-md bg-[var(--color-surface-low)] p-5 border border-[var(--color-outline)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
            Your threads
          </p>
          <div className="mt-5 space-y-3">
            {threads.length ? threads.map((thread) => {
              const active = thread.id === selectedThreadId;
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
                      <p className="text-sm font-semibold text-[var(--color-on-surface)]">{thread.subject}</p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        {thread.productName ?? "General support"}
                      </p>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                      {thread.status}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--color-muted)]">
                    {thread.lastMessagePreview ?? "No messages yet. Start the conversation when ready."}
                  </p>
                  <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                    {formatThreadDate(thread.lastMessageAt ?? thread.createdAt)}
                  </p>
                </button>
              );
            }) : (
              <EmptyState
                title="No support threads yet"
                body="Start a general chat here or open a product-specific thread from any product detail page."
              />
            )}
          </div>
        </aside>

        <div>
          {loadingDetail && selectedThreadId ? (
            <LoadingState label="Opening the conversation…" />
          ) : (
            <ChatThreadPanel
              heading="Admin Channel"
              description="Messages here go directly to the admin inbox in real time."
              thread={selectedThreadDetail?.thread ?? selectedThread}
              messages={selectedThreadDetail?.messages ?? []}
              onSend={handleSend}
              sending={sending}
              connectionState={connectionState}
              emptyTitle="Start a general support thread"
              emptyBody="Write your first message and the admin team will see it immediately. If the socket drops, the app falls back to a normal request."
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
