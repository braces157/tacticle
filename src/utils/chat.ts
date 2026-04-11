import type { ChatMessage, ChatThreadDetail, ChatThreadSummary } from "../types/domain";

function threadTimestamp(thread: ChatThreadSummary) {
  return Date.parse(thread.lastMessageAt ?? thread.updatedAt ?? thread.createdAt) || 0;
}

export function sortThreads(threads: ChatThreadSummary[]) {
  return [...threads].sort((left, right) => threadTimestamp(right) - threadTimestamp(left));
}

export function upsertThread(
  threads: ChatThreadSummary[],
  nextThread: ChatThreadSummary,
) {
  return sortThreads([
    nextThread,
    ...threads.filter((thread) => thread.id !== nextThread.id),
  ]);
}

export function applyThreadUpdate(
  detail: ChatThreadDetail | null,
  nextThread: ChatThreadSummary,
) {
  if (!detail || detail.thread.id !== nextThread.id) {
    return detail;
  }

  return {
    ...detail,
    thread: nextThread,
  };
}

export function applyIncomingMessage(
  detail: ChatThreadDetail | null,
  nextThread: ChatThreadSummary,
  message: ChatMessage,
) {
  if (!detail || detail.thread.id !== nextThread.id) {
    return detail;
  }

  const alreadyPresent = detail.messages.some((entry) => entry.id === message.id);
  return {
    thread: nextThread,
    messages: alreadyPresent ? detail.messages : [...detail.messages, message],
  };
}
