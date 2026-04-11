import { useEffect, useMemo, useRef, useState } from "react";
import { useChatRealtime } from "../../context/ChatRealtimeContext";
import {
  getAdminChatThreadDetail,
  getAdminChatThreads,
  sendChatMessage,
  updateAdminChatThreadStatus,
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

export function AdminChatWidget() {
  const { connectionState, sendMessage, subscribe } = useChatRealtime();
  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedThreadDetail, setSelectedThreadDetail] = useState<ChatThreadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [sending, setSending] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  async function refreshThreads() {
    const nextThreads = await getAdminChatThreads();
    setThreads(nextThreads);
    setSelectedThreadId((current) => current ?? nextThreads[0]?.id ?? null);
  }

  async function refreshThreadDetail(threadId: string) {
    const detail = await getAdminChatThreadDetail(threadId);
    if (detail) {
      setSelectedThreadDetail(detail);
      setThreads((current) => upsertThread(current, detail.thread));
    }
  }

  useEffect(() => {
    refreshThreads()
      .catch(() => setError("Unable to load inbox right now."))
      .finally(() => setLoading(false));
  }, []);

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
    const intervalId = window.setInterval(() => {
      void refreshThreads().catch(() => {
      });
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

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
      setSelectedThreadId((current) => current ?? event.payload.thread.id);
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

  const waitingCount = useMemo(
    () => threads.filter((thread) => thread.lastMessageSenderRole === "customer").length,
    [threads],
  );
  const accentClassName = connectionState === "connected"
    ? "bg-[var(--color-primary)]"
    : "bg-[var(--color-surface-highest)]";

  async function handleSend() {
    const messageBody = draft.trim();
    if (!activeThread || !messageBody || isClosed) {
      return;
    }

    setSending(true);
    setError("");
    try {
      const sentOverSocket = sendMessage(activeThread.id, messageBody);
      if (!sentOverSocket) {
        const createdMessage = await sendChatMessage(activeThread.id, messageBody);
        const updatedThread = {
          ...activeThread,
          status: "OPEN" as const,
          updatedAt: createdMessage.createdAt,
          lastMessageAt: createdMessage.createdAt,
          lastMessagePreview: createdMessage.body,
          lastMessageSenderRole: "admin" as const,
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
        void refreshThreadDetail(activeThread.id).catch(() => {
        });
      }, 600);

      setDraft("");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Unable to send your reply.");
    } finally {
      setSending(false);
    }
  }

  async function handleToggleStatus() {
    if (!activeThread) {
      return;
    }

    setStatusSaving(true);
    try {
      const nextStatus = activeThread.status === "OPEN" ? "CLOSED" : "OPEN";
      const updatedThread = await updateAdminChatThreadStatus(activeThread.id, nextStatus);
      setThreads((current) => upsertThread(current, updatedThread));
      setSelectedThreadDetail((current) => applyThreadUpdate(current, updatedThread));
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Unable to update chat status.");
    } finally {
      setStatusSaving(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open ? (
        <div className="w-[min(38rem,calc(100vw-1rem))] h-[32rem] overflow-hidden rounded-md ghost-border glass-nav text-[var(--color-on-surface)] ambient-shadow flex flex-row">
          {/* LEFT SIDEBAR (Inbox List) */}
          <div className={[
            "w-full sm:w-52 flex-col border-r border-[var(--color-outline)] bg-[var(--color-surface-low)] shrink-0",
            selectedThreadId ? "hidden sm:flex" : "flex"
          ].join(" ")}>
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-outline)] bg-[var(--color-surface)] px-4 py-4">
              <div className="flex items-center gap-2">
                <span className={["h-2 w-2 rounded-sm", accentClassName].join(" ")} />
                <p className="font-['Manrope'] text-sm font-bold tracking-[-0.02em]">Inbox</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {loading ? (
                <p className="text-sm text-[var(--color-muted)] p-2">Loading…</p>
              ) : threads.length ? (
                threads.map((thread) => {
                  const active = thread.id === selectedThreadId;
                  const needsReply = thread.lastMessageSenderRole === "customer";
                  return (
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => setSelectedThreadId(thread.id)}
                      className={[
                        "w-full rounded-sm px-3 py-2.5 text-left transition",
                        active
                          ? "bg-[var(--color-card)] text-[var(--color-on-surface)] ghost-border shadow-sm"
                          : "text-[var(--color-muted)] hover:bg-[var(--color-surface-high)] hover:text-[var(--color-on-surface)]",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold truncate">{thread.customerName}</p>
                        {needsReply ? <span className="h-2 w-2 rounded-sm bg-[var(--color-primary)] shrink-0" /> : null}
                      </div>
                    </button>
                  );
                })
              ) : (
                <p className="text-sm text-[var(--color-muted)] p-2">Empty</p>
              )}
            </div>
          </div>

          {/* MAIN CHAT AREA */}
          <div className={[
            "flex-1 flex-col bg-[var(--color-surface)] relative min-w-0",
            !selectedThreadId ? "hidden sm:flex" : "flex"
          ].join(" ")}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-[var(--color-surface)] border-b border-[var(--color-outline)] shrink-0">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {activeThread ? (
                  <>
                    <button
                      type="button"
                      className="sm:hidden -ml-2 rounded-sm p-1.5 text-[var(--color-muted)] hover:text-[var(--color-on-surface)] shrink-0"
                      onClick={() => setSelectedThreadId(null)}
                      aria-label="Back to inbox"
                    >
                      <Icon name="chevron-right" className="h-5 w-5 shrink-0 rotate-180" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-['Manrope'] font-bold text-[var(--color-on-surface)] tracking-[-0.02em] truncate">{activeThread.customerName}</p>
                      {activeThread.productName ? (
                        <p className="mt-0.5 text-[10px] uppercase font-bold tracking-[0.18em] text-[var(--color-muted)] truncate">{activeThread.productName}</p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      {isClosed ? (
                        <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                          Closed
                        </span>
                      ) : null}
                      <Button variant="secondary" onClick={() => void handleToggleStatus()} disabled={statusSaving}>
                        {statusSaving ? "..." : activeThread.status === "OPEN" ? "Close" : "Open"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-[var(--color-muted)]">No chat selected.</p>
                )}
              </div>
              <button
                type="button"
                aria-label="Close support inbox"
                onClick={() => setOpen(false)}
                className="ml-4 rounded-sm p-1.5 text-[var(--color-muted)] transition hover:bg-[var(--color-surface-low)] hover:text-[var(--color-on-surface)] shrink-0"
              >
                <Icon name="close" className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto px-5 py-2 bg-[var(--color-card)]"
            >
              {loadingDetail && selectedThreadId ? (
                <p className="text-sm text-[var(--color-muted)]">Opening…</p>
              ) : selectedThreadDetail?.messages.length ? (
                <div className="space-y-5">
                  {selectedThreadDetail.messages.map((message) => {
                    const fromAdmin = message.senderRole === "admin";
                    return (
                      <div key={message.id} className={["flex flex-col gap-2", fromAdmin ? "items-end" : "items-start"].join(" ")}>
                        {!fromAdmin ? (
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-surface-high)] text-[var(--color-muted)]">
                              <Icon name="user" className="h-4 w-4" />
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                              {message.senderName ?? "Customer"}
                            </span>
                          </div>
                        ) : null}
                        <article
                          title={formatMessageTimestamp(message.createdAt)}
                          className={[
                            "max-w-[90%] rounded-md px-5 py-4",
                            !fromAdmin
                              ? "bg-[var(--color-surface-low)] text-[var(--color-on-surface)] ml-[2.75rem]"
                              : "bg-[var(--color-on-surface)] text-[var(--color-surface)]",
                          ].join(" ")}
                        >
                          <p className={["whitespace-pre-wrap text-[13.5px] leading-relaxed", !fromAdmin ? "text-[var(--color-muted)] font-medium" : ""].join(" ")}>
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

            {/* Input area */}
            <div className="px-5 py-4 pb-5 bg-[var(--color-card)] shrink-0">
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
                  placeholder={isClosed ? "Chat closed" : "Reply..."}
                  className="w-full rounded-md bg-[var(--color-surface-low)] py-3.5 pl-4 pr-12 text-sm text-[var(--color-on-surface)] placeholder-[var(--color-muted)] outline-none transition focus:bg-[var(--color-surface-high)]"
                  disabled={sending || !activeThread || isClosed}
                />
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={sending || !activeThread || !draft.trim() || isClosed}
                  className="absolute right-2 p-2 text-[var(--color-muted)] hover:text-[var(--color-on-surface)] transition disabled:opacity-50"
                >
                  <Icon name="arrow-right" className="h-5 w-5" />
                </button>
              </div>
              {error ? <p className="mt-2 text-xs text-[var(--color-error)]">{error}</p> : null}
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="button-base button-primary ambient-shadow"
      >
        <Icon name="chat" className="h-5 w-5" />
        <span>Inbox</span>
        {waitingCount ? <span className="text-xs text-[var(--color-surface)]/80 ml-1">{waitingCount}</span> : null}
      </button>
    </div>
  );
}
