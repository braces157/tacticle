import { useEffect, useRef, useState } from "react";
import { useMatch } from "react-router-dom";
import { useChatRealtime } from "../../context/ChatRealtimeContext";
import { useSession } from "../../context/SessionContext";
import {
  createChatThread,
  getChatThreadDetail,
  getChatThreads,
  getProductChatThread,
  sendChatMessage,
} from "../../services/chatApi";
import type { ChatThreadDetail, ChatThreadSummary } from "../../types/domain";
import { applyIncomingMessage, applyThreadUpdate, upsertThread } from "../../utils/chat";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";

function formatMessageTimestamp(value: string) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(parsed));
}

export function StorefrontChatWidget() {
  const { user } = useSession();
  const { connectionState, sendMessage, subscribe } = useChatRealtime();
  const productMatch = useMatch("/product/:slug");
  const productSlug = productMatch?.params.slug ?? null;
  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedThreadDetail, setSelectedThreadDetail] = useState<ChatThreadDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [productThreadChecked, setProductThreadChecked] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  async function refreshThreads() {
    const nextThreads = await getChatThreads();
    setThreads(nextThreads);
    setSelectedThreadId((current) => current ?? nextThreads[0]?.id ?? null);
  }

  async function refreshThreadDetail(threadId: string) {
    const detail = await getChatThreadDetail(threadId);
    if (detail) {
      setSelectedThreadDetail(detail);
      setThreads((current) => upsertThread(current, detail.thread));
    }
  }

  useEffect(() => {
    if (!user || user.role !== "customer") {
      setOpen(false);
      setThreads([]);
      setSelectedThreadId(null);
      setSelectedThreadDetail(null);
      setDraft("");
      setError("");
      return;
    }

    setLoading(true);
    refreshThreads()
      .catch(() => setError("Unable to load chat right now."))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== "customer") {
      return;
    }

    if (!productSlug) {
      setProductThreadChecked(true);
      return;
    }

    setProductThreadChecked(false);
    getProductChatThread(productSlug)
      .then((detail) => {
        if (!detail) {
          return;
        }
        setThreads((current) => upsertThread(current, detail.thread));
        setSelectedThreadId(detail.thread.id);
        setSelectedThreadDetail(detail);
      })
      .finally(() => setProductThreadChecked(true));
  }, [productSlug, user]);

  useEffect(() => {
    if (!selectedThreadId) {
      setSelectedThreadDetail(null);
      return;
    }

    setLoadingDetail(true);
    refreshThreadDetail(selectedThreadId)
      .catch(() => setError("Unable to open chat right now."))
      .finally(() => setLoadingDetail(false));
  }, [selectedThreadId]);

  useEffect(() => {
    if (!user || user.role !== "customer") {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshThreads().catch(() => {
      });
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [user]);

  useEffect(() => {
    if (!open || !selectedThreadId) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshThreadDetail(selectedThreadId).catch(() => {
      });
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [open, selectedThreadId]);

  useEffect(() => subscribe((event) => {
    if (event.type === "ERROR") {
      setError(event.payload.message);
      return;
    }

    if (event.type === "CHAT_THREAD_UPDATED") {
      setThreads((current) => upsertThread(current, event.payload.thread));
      setSelectedThreadDetail((current) => applyThreadUpdate(current, event.payload.thread));
      return;
    }

    if (event.type === "CHAT_MESSAGE_CREATED") {
      setThreads((current) => upsertThread(current, event.payload.thread));
      setSelectedThreadDetail((current) =>
        applyIncomingMessage(current, event.payload.thread, event.payload.message),
      );
      setSelectedThreadId((current) => current ?? event.payload.thread.id);
    }
  }), [subscribe]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [selectedThreadDetail?.messages.length, open, selectedThreadId]);

  const activeThread = selectedThreadDetail?.thread
    ?? threads.find((thread) => thread.id === selectedThreadId)
    ?? null;
  const isClosed = activeThread?.status === "CLOSED";

  const accentClassName = connectionState === "connected"
    ? "bg-[var(--color-primary)]"
    : "bg-[var(--color-surface-highest)]";

  if (!user || user.role !== "customer") {
    return null;
  }

  async function ensureThread() {
    const existingThread = activeThread;
    if (existingThread) {
      return existingThread;
    }

    const createdThread = await createChatThread(
      productSlug ? { productSlug } : { subject: "General support" },
    );
    setThreads((current) => upsertThread(current, createdThread));
    setSelectedThreadId(createdThread.id);
    setSelectedThreadDetail({ thread: createdThread, messages: [] });
    setOpen(true);
    return createdThread;
  }

  async function handleSend() {
    const messageBody = draft.trim();
    if (!messageBody || isClosed) {
      return;
    }

    setSending(true);
    setError("");
    try {
      const thread = await ensureThread();
      const sentOverSocket = sendMessage(thread.id, messageBody);
      if (!sentOverSocket) {
        const createdMessage = await sendChatMessage(thread.id, messageBody);
        const updatedThread = {
          ...thread,
          status: "OPEN" as const,
          updatedAt: createdMessage.createdAt,
          lastMessageAt: createdMessage.createdAt,
          lastMessagePreview: createdMessage.body,
          lastMessageSenderRole: "customer" as const,
        };
        setThreads((current) => upsertThread(current, updatedThread));
        setSelectedThreadDetail((current) => ({
          thread: updatedThread,
          messages: [...(current?.messages ?? []), createdMessage],
        }));
      }

      window.setTimeout(() => {
        void refreshThreads().catch(() => {
        });
        void refreshThreadDetail(thread.id).catch(() => {
        });
      }, 600);

      setDraft("");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Unable to send your message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open ? (
        <div className="w-[min(24rem,calc(100vw-1rem))] overflow-hidden rounded-md ghost-border glass-nav text-[var(--color-on-surface)] ambient-shadow">
          <div className="flex items-center justify-between px-5 py-4 bg-[var(--color-surface)]">
            <div className="flex items-center gap-2.5">
              <span className={["h-2 w-2 rounded-full", accentClassName].join(" ")} />
              <p className="font-['Manrope'] text-[15px] font-bold tracking-[-0.02em] text-[var(--color-on-surface)]">
                {activeThread?.productName ? `Concierge: ${activeThread.productName}` : "Tactile Support"}
              </p>
              {isClosed ? (
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  Closed
                </span>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
              className="rounded-sm p-1.5 text-[var(--color-muted)] transition hover:bg-[var(--color-surface-low)] hover:text-[var(--color-on-surface)]"
            >
              <Icon name="close" className="h-4 w-4" />
            </button>
          </div>

          {threads.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto px-3 py-2 bg-[var(--color-surface-low)]">
              {threads.slice(0, 5).map((thread) => {
                const active = thread.id === selectedThreadId;
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={[
                      "shrink-0 rounded-sm px-3 py-1.5 text-[11px] font-semibold tracking-[0.02em] transition",
                      active
                        ? "bg-[var(--color-card)] text-[var(--color-on-surface)] ghost-border"
                        : "text-[var(--color-muted)] hover:bg-[var(--color-surface-high)] hover:text-[var(--color-on-surface)]",
                    ].join(" ")}
                  >
                    {thread.productName ?? "Support"}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div
            ref={messagesContainerRef}
            className="max-h-[22rem] overflow-y-auto px-5 py-2 bg-[var(--color-card)]"
          >
            {loading || (!productThreadChecked && productSlug) ? (
              <p className="text-sm text-[var(--color-muted)]">Loading…</p>
            ) : loadingDetail && selectedThreadId ? (
              <p className="text-sm text-[var(--color-muted)]">Opening…</p>
            ) : selectedThreadDetail?.messages.length ? (
              <div className="space-y-5">
                {selectedThreadDetail.messages.map((message) => {
                  const fromAdmin = message.senderRole === "admin";
                  return (
                    <div key={message.id} className={["flex flex-col gap-2", fromAdmin ? "items-start" : "items-end"].join(" ")}>
                      {fromAdmin ? (
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-surface-high)] text-[var(--color-muted)]">
                            <Icon name="user" className="h-4 w-4" />
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                            Support
                          </span>
                        </div>
                      ) : null}
                      <article
                        title={formatMessageTimestamp(message.createdAt)}
                        className={[
                          "max-w-[90%] rounded-md px-5 py-4",
                          fromAdmin
                            ? "bg-[var(--color-surface-low)] ml-[2.75rem]"
                            : "bg-[var(--color-on-surface)] text-[var(--color-surface)]",
                        ].join(" ")}
                      >
                        <p className={["whitespace-pre-wrap text-[13.5px] leading-relaxed", fromAdmin ? "text-[var(--color-muted)] font-medium" : ""].join(" ")}>
                          {message.body}
                        </p>
                      </article>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-muted)] py-4">No messages yet.</p>
            )}
          </div>

          <div className="px-5 py-4 pb-5 bg-[var(--color-card)]">
            <div className="relative flex items-center">
              <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!sending && draft.trim()) {
                      void handleSend();
                    }
                  }
                }}
                placeholder={isClosed ? "Chat closed" : "Inquire here..."}
                className="w-full rounded-md bg-[var(--color-surface-low)] py-3.5 pl-4 pr-12 text-sm text-[var(--color-on-surface)] placeholder-[var(--color-muted)] outline-none transition focus:bg-[var(--color-surface-high)]"
                disabled={sending || isClosed}
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={sending || !draft.trim() || isClosed}
                className="absolute right-2 p-2 text-[var(--color-muted)] hover:text-[var(--color-on-surface)] transition disabled:opacity-50"
              >
                <Icon name="arrow-right" className="h-5 w-5" />
              </button>
            </div>
            {error ? <p className="mt-2 text-xs text-[var(--color-error)]">{error}</p> : null}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="button-base button-primary ambient-shadow"
      >
        <Icon name="chat" className="h-5 w-5" />
        <span>Chat</span>
      </button>
    </div>
  );
}
