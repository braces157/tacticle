import { useMemo, useState, type ReactNode } from "react";
import { Button } from "../ui/Button";
import type { ChatMessage, ChatThreadDetail, ChatThreadSummary } from "../../types/domain";

type ChatThreadPanelProps = {
  heading: string;
  description: string;
  thread: ChatThreadSummary | null;
  messages: ChatMessage[];
  onSend(body: string): Promise<void>;
  sending: boolean;
  connectionState: "disconnected" | "connecting" | "connected";
  emptyTitle: string;
  emptyBody: string;
  composerLabel?: string;
  composerPlaceholder?: string;
  disabled?: boolean;
  footerAction?: ReactNode;
};

function formatTimestamp(value: string) {
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

function connectionLabel(connectionState: ChatThreadPanelProps["connectionState"]) {
  return connectionState === "connected"
    ? "Live"
    : connectionState === "connecting"
      ? "Connecting"
      : "Offline fallback";
}

export function ChatThreadPanel({
  heading,
  description,
  thread,
  messages,
  onSend,
  sending,
  connectionState,
  emptyTitle,
  emptyBody,
  composerLabel = "Message",
  composerPlaceholder = "Write your message for the admin team…",
  disabled = false,
  footerAction,
}: ChatThreadPanelProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const statusTone = useMemo(() => {
    if (!thread) {
      return "bg-[var(--color-surface-high)] text-[var(--color-muted)]";
    }

    return thread.status === "OPEN"
      ? "bg-[rgba(46,125,50,0.12)] text-[#216e39]"
      : "bg-[rgba(159,64,61,0.12)] text-[var(--color-error)]";
  }, [thread]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextDraft = draft.trim();
    if (!nextDraft || disabled) {
      return;
    }

    setError("");
    try {
      await onSend(nextDraft);
      setDraft("");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to send your message right now.",
      );
    }
  }

  return (
    <section className="rounded-md bg-[var(--color-card)] p-6 ambient-shadow md:p-8 ghost-border">
      <div className="flex flex-col gap-4 border-b border-[var(--color-outline)] pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
            {heading}
          </p>
          <h2 className="mt-3 font-['Manrope'] text-3xl font-extrabold tracking-[-0.05em]">
            {thread?.subject ?? emptyTitle}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-muted)]">
            {thread ? description : emptyBody}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-[var(--color-surface-low)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
            {connectionLabel(connectionState)}
          </span>
          <span className={["rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]", statusTone].join(" ")}>
            {thread?.status ?? "Draft"}
          </span>
          {footerAction}
        </div>
      </div>

      <div className="mt-6 rounded-md bg-[var(--color-surface-low)] p-4 md:p-5 border border-[var(--color-outline)]">
        {messages.length ? (
          <div className="space-y-4">
            {messages.map((message) => {
              const fromAdmin = message.senderRole === "admin";
              return (
                <article
                  key={message.id}
                  className={[
                    "max-w-[42rem] rounded-sm px-4 py-4 ghost-border",
                    fromAdmin
                      ? "mr-auto bg-[var(--color-card)] text-[var(--color-on-surface)]"
                      : "ml-auto bg-[var(--color-on-surface)] text-[var(--color-surface)]",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className={["text-xs font-semibold uppercase tracking-[0.18em]", fromAdmin ? "text-[var(--color-muted)]" : "text-white/72"].join(" ")}>
                      {message.senderName}
                    </p>
                    <p className={["text-[10px] uppercase tracking-[0.18em]", fromAdmin ? "text-[var(--color-muted)]" : "text-white/70"].join(" ")}>
                      {formatTimestamp(message.createdAt)}
                    </p>
                  </div>
                  <p className={["mt-3 whitespace-pre-wrap text-sm leading-7", fromAdmin ? "text-[var(--color-muted)]" : "text-white"].join(" ")}>
                    {message.body}
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-sm border border-dashed border-[var(--color-outline)] bg-[var(--color-card)] px-5 py-6">
            <p className="font-medium text-[var(--color-on-surface)]">{emptyTitle}</p>
            <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">{emptyBody}</p>
          </div>
        )}
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
            {composerLabel}
          </span>
          <span className="input-shell flex">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={4}
              placeholder={composerPlaceholder}
              className="min-h-28 w-full resize-y bg-transparent px-4 py-3 outline-none"
              disabled={disabled}
            />
          </span>
        </label>
        {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--color-muted)]">
            {thread?.productName
              ? `Thread linked to ${thread.productName}.`
              : "Use this channel for shipping, product, and order questions."}
          </p>
          <Button type="submit" disabled={disabled || sending || !draft.trim()}>
            {sending ? "Sending…" : "Send message"}
          </Button>
        </div>
      </form>
    </section>
  );
}
